import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { CronJob } from 'cron';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

interface SLAConfig {
  slaTiers: {
    [key: string]: {
      name: string;
      thresholdMs: number;
      percentile: string;
      endpoints: string[];
      services: string[];
    };
  };
  percentiles: {
    [key: string]: {
      name: string;
      description: string;
    };
  };
  baselineCalculation: {
    schedule: string;
    retentionDays: number;
    minSampleSize: number;
    percentiles: string[];
  };
}

interface PerformanceBaseline {
  service: string;
  route: string;
  method: string;
  date: Date;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  avg: number;
  count: number;
  slaTier: string;
  slaThreshold: number;
  slaCompliance: number;
}

export class CalculateBaselinesJob {
  private prisma: PrismaClient;
  private prometheusUrl: string;
  private slaConfig: SLAConfig;
  private cronJob: CronJob;

  constructor() {
    this.prisma = new PrismaClient();
    this.prometheusUrl = process.env.PROMETHEUS_URL || 'http://prometheus:9090';
    this.slaConfig = this.loadSLAConfig();
    
    // Schedule job to run daily at 2 AM
    this.cronJob = new CronJob(
      this.slaConfig.baselineCalculation.schedule,
      () => this.execute(),
      null,
      true,
      'UTC'
    );

    logger.info('Baselines calculation job initialized', {
      schedule: this.slaConfig.baselineCalculation.schedule
    });
  }

  private loadSLAConfig(): SLAConfig {
    try {
      const configPath = path.join(process.cwd(), '..', '..', '..', 'config', 'sla-config.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      logger.error('Failed to load SLA config', { error });
      throw new Error('SLA configuration not found');
    }
  }

  private async queryPrometheus(query: string): Promise<any> {
    try {
      const response = await axios.get(`${this.prometheusUrl}/api/v1/query`, {
        params: { query },
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      logger.error('Prometheus query failed', { query, error });
      throw error;
    }
  }

  private async queryPrometheusRange(query: string, start: number, end: number): Promise<any> {
    try {
      const response = await axios.get(`${this.prometheusUrl}/api/v1/query_range`, {
        params: { 
          query, 
          start, 
          end, 
          step: '5m' 
        },
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      logger.error('Prometheus range query failed', { query, error });
      throw error;
    }
  }

  private determineSLATier(service: string, route: string): string {
    for (const [tier, config] of Object.entries(this.slaConfig.slaTiers)) {
      if (config.services.includes(service)) {
        // Check if route matches any endpoint pattern
        for (const endpoint of config.endpoints) {
          if (this.routeMatchesPattern(route, endpoint)) {
            return tier;
          }
        }
      }
    }
    return 'low'; // Default tier
  }

  private routeMatchesPattern(route: string, pattern: string): boolean {
    // Simple pattern matching - can be enhanced with regex
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(route);
    }
    return route === pattern;
  }

  private async calculatePercentiles(service: string, route: string, method: string, start: number, end: number): Promise<any> {
    const percentiles = this.slaConfig.baselineCalculation.percentiles;
    const results: any = {};

    for (const percentile of percentiles) {
      const percentileValue = parseFloat(percentile.replace('p', '')) / 100;
      const query = `histogram_quantile(${percentileValue}, rate(http_response_time_milliseconds_bucket{service="${service}",route="${route}",method="${method}"}[5m]))`;
      
      try {
        const result = await this.queryPrometheusRange(query, start, end);
        const values = result.data.result[0]?.values || [];
        
        if (values.length > 0) {
          const validValues = values.filter((v: any[]) => parseFloat(v[1]) > 0);
          if (validValues.length >= this.slaConfig.baselineCalculation.minSampleSize) {
            const sum = validValues.reduce((acc: number, v: any[]) => acc + parseFloat(v[1]), 0);
            results[percentile] = sum / validValues.length;
          }
        }
      } catch (error) {
        logger.warn('Failed to calculate percentile', { service, route, method, percentile, error });
      }
    }

    return results;
  }

  private async calculateAverage(service: string, route: string, method: string, start: number, end: number): Promise<number> {
    const query = `rate(http_response_time_milliseconds_sum{service="${service}",route="${route}",method="${method}"}[5m]) / rate(http_response_time_milliseconds_count{service="${service}",route="${route}",method="${method}"}[5m])`;
    
    try {
      const result = await this.queryPrometheusRange(query, start, end);
      const values = result.data.result[0]?.values || [];
      
      if (values.length > 0) {
        const validValues = values.filter((v: any[]) => parseFloat(v[1]) > 0);
        if (validValues.length >= this.slaConfig.baselineCalculation.minSampleSize) {
          const sum = validValues.reduce((acc: number, v: any[]) => acc + parseFloat(v[1]), 0);
          return sum / validValues.length;
        }
      }
    } catch (error) {
      logger.warn('Failed to calculate average', { service, route, method, error });
    }

    return 0;
  }

  private async getRequestCount(service: string, route: string, method: string, start: number, end: number): Promise<number> {
    const query = `sum(increase(http_response_time_milliseconds_count{service="${service}",route="${route}",method="${method}"}[5m]))`;
    
    try {
      const result = await this.queryPrometheusRange(query, start, end);
      const values = result.data.result[0]?.values || [];
      
      if (values.length > 0) {
        return values.reduce((acc: number, v: any[]) => acc + parseFloat(v[1]), 0);
      }
    } catch (error) {
      logger.warn('Failed to get request count', { service, route, method, error });
    }

    return 0;
  }

  private async calculateSLACompliance(service: string, route: string, method: string, start: number, end: number, slaTier: string): Promise<number> {
    const slaConfig = this.slaConfig.slaTiers[slaTier];
    if (!slaConfig) return 0;

    const threshold = slaConfig.thresholdMs;
    const query = `sum(increase(http_response_time_milliseconds_bucket{service="${service}",route="${route}",method="${method}",le="${threshold}"}[5m])) / sum(increase(http_response_time_milliseconds_count{service="${service}",route="${route}",method="${method}"}[5m]))`;
    
    try {
      const result = await this.queryPrometheusRange(query, start, end);
      const values = result.data.result[0]?.values || [];
      
      if (values.length > 0) {
        const sum = values.reduce((acc: number, v: any[]) => acc + parseFloat(v[1]), 0);
        return (sum / values.length) * 100; // Return percentage
      }
    } catch (error) {
      logger.warn('Failed to calculate SLA compliance', { service, route, method, error });
    }

    return 0;
  }

  private async getTopEndpoints(): Promise<Array<{service: string, route: string, method: string}>> {
    const query = 'topk(100, sum by (service, route, method) (rate(http_response_time_milliseconds_count[5m])))';
    
    try {
      const result = await this.queryPrometheus(query);
      return result.data.result.map((r: any) => ({
        service: r.metric.service,
        route: r.metric.route,
        method: r.metric.method
      }));
    } catch (error) {
      logger.error('Failed to get top endpoints', { error });
      return [];
    }
  }

  public async execute(): Promise<void> {
    logger.info('Starting baselines calculation job');
    
    try {
      const now = Math.floor(Date.now() / 1000);
      const yesterday = now - (24 * 60 * 60); // 24 hours ago
      const date = new Date(yesterday * 1000);

      const endpoints = await this.getTopEndpoints();
      const baselines: PerformanceBaseline[] = [];

      for (const endpoint of endpoints) {
        try {
          const { service, route, method } = endpoint;
          const slaTier = this.determineSLATier(service, route);
          const slaThreshold = this.slaConfig.slaTiers[slaTier]?.thresholdMs || 5000;

          const [percentiles, avg, count, slaCompliance] = await Promise.all([
            this.calculatePercentiles(service, route, method, yesterday, now),
            this.calculateAverage(service, route, method, yesterday, now),
            this.getRequestCount(service, route, method, yesterday, now),
            this.calculateSLACompliance(service, route, method, yesterday, now, slaTier)
          ]);

          if (count >= this.slaConfig.baselineCalculation.minSampleSize) {
            const baseline: PerformanceBaseline = {
              service,
              route,
              method,
              date,
              p50: percentiles.p50 || 0,
              p90: percentiles.p90 || 0,
              p95: percentiles.p95 || 0,
              p99: percentiles.p99 || 0,
              avg,
              count,
              slaTier,
              slaThreshold,
              slaCompliance
            };

            baselines.push(baseline);
          }
        } catch (error) {
          logger.error('Failed to calculate baseline for endpoint', { endpoint, error });
        }
      }

      // Store baselines in database
      await this.storeBaselines(baselines);

      // Clean old baselines
      await this.cleanOldBaselines();

      logger.info('Baselines calculation completed', {
        totalEndpoints: endpoints.length,
        calculatedBaselines: baselines.length,
        date: date.toISOString()
      });

    } catch (error) {
      logger.error('Baselines calculation job failed', { error });
      throw error;
    }
  }

  private async storeBaselines(baselines: PerformanceBaseline[]): Promise<void> {
    try {
      // Use upsert to handle potential conflicts
      for (const baseline of baselines) {
        await this.prisma.performanceBaseline.upsert({
          where: {
            service_route_method_date: {
              service: baseline.service,
              route: baseline.route,
              method: baseline.method,
              date: baseline.date
            }
          },
          update: {
            p50: baseline.p50,
            p90: baseline.p90,
            p95: baseline.p95,
            p99: baseline.p99,
            avg: baseline.avg,
            count: baseline.count,
            slaTier: baseline.slaTier,
            slaThreshold: baseline.slaThreshold,
            slaCompliance: baseline.slaCompliance
          },
          create: baseline
        });
      }
    } catch (error) {
      logger.error('Failed to store baselines', { error });
      throw error;
    }
  }

  private async cleanOldBaselines(): Promise<void> {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.slaConfig.baselineCalculation.retentionDays);

      const result = await this.prisma.performanceBaseline.deleteMany({
        where: {
          date: {
            lt: retentionDate
          }
        }
      });

      logger.info('Cleaned old baselines', { deletedCount: result.count });
    } catch (error) {
      logger.error('Failed to clean old baselines', { error });
    }
  }

  public start(): void {
    this.cronJob.start();
    logger.info('Baselines calculation job started');
  }

  public stop(): void {
    this.cronJob.stop();
    logger.info('Baselines calculation job stopped');
  }

  public async runOnce(): Promise<void> {
    await this.execute();
  }
}

// Export singleton instance
export const calculateBaselinesJob = new CalculateBaselinesJob();