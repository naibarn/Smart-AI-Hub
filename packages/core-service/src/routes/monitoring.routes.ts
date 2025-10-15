import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { getMetrics } from '@smart-ai-hub/shared';

const router = Router();
const prisma = new PrismaClient();

// Prometheus and Alertmanager URLs
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://prometheus:9090';
const ALERTMANAGER_URL = process.env.ALERTMANAGER_URL || 'http://alertmanager:9093';

// Helper function to query Prometheus
async function queryPrometheus(query: string): Promise<any> {
  try {
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
      params: { query },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('Error querying Prometheus:', error);
    throw error;
  }
}

// Helper function to query Prometheus range
async function queryPrometheusRange(query: string, start: number, end: number, step: string = '30s'): Promise<any> {
  try {
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query_range`, {
      params: { query, start, end, step },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Error querying Prometheus range:', error);
    throw error;
  }
}

// Helper function to query Alertmanager
async function queryAlertmanager(path: string): Promise<any> {
  try {
    const response = await axios.get(`${ALERTMANAGER_URL}${path}`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('Error querying Alertmanager:', error);
    throw error;
  }
}

// GET /api/v1/monitoring/overview - Main dashboard data
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const now = Date.now() / 1000;
    const oneHourAgo = now - 3600;

    // Get service status
    const services = ['auth-service', 'core-service', 'mcp-server', 'webhook-service', 'notification-service'];
    const serviceStatus = await Promise.all(
      services.map(async (service) => {
        try {
          const result = await queryPrometheus(`up{job="${service}"}`);
          const isUp = result.data.result.length > 0 ? result.data.result[0].value[1] === '1' : false;
          return { service, status: isUp ? 'up' : 'down' };
        } catch (error) {
          return { service, status: 'unknown' };
        }
      })
    );

    // Get total requests in last hour
    const totalRequestsQuery = services.map(s => `sum(rate(${s.replace('-', '_')}_http_requests_total[1m]))`).join(' + ');
    const totalRequests = await queryPrometheus(totalRequestsQuery || '0');

    // Get average response time
    const avgResponseTimeQuery = services.map(s => 
      `histogram_quantile(0.95, rate(${s.replace('-', '_')}_http_request_duration_seconds_bucket[5m]))`
    ).join(' + ');
    const avgResponseTime = await queryPrometheus(avgResponseTimeQuery || '0');

    // Get error rate
    const errorRateQuery = services.map(s => 
      `sum(rate(${s.replace('-', '_')}_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(${s.replace('-', '_')}_http_requests_total[5m]))`
    ).join(' + ');
    const errorRate = await queryPrometheus(errorRateQuery || '0');

    // Get active alerts count
    const alerts = await queryAlertmanager('/api/v1/alerts');
    const activeAlerts = alerts.data?.alerts?.filter((alert: any) => alert.status.state === 'active') || [];

    res.json({
      status: 'success',
      data: {
        services: serviceStatus,
        metrics: {
          totalRequests: totalRequests.data.result[0]?.value[1] || '0',
          avgResponseTime: avgResponseTime.data.result[0]?.value[1] || '0',
          errorRate: errorRate.data.result[0]?.value[1] || '0',
          activeAlerts: activeAlerts.length
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch overview data'
    });
  }
});

// GET /api/v1/monitoring/performance - Response time analysis
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const { timeframe = '1h' } = req.query;
    const now = Date.now() / 1000;
    let start: number;

    switch (timeframe) {
      case '1h':
        start = now - 3600;
        break;
      case '6h':
        start = now - 21600;
        break;
      case '24h':
        start = now - 86400;
        break;
      default:
        start = now - 3600;
    }

    const services = ['auth-service', 'core-service', 'mcp-server', 'webhook-service', 'notification-service'];
    
    // Get response time trends
    const responseTimeTrends = await Promise.all(
      services.map(async (service) => {
        try {
          const query = `histogram_quantile(0.95, rate(${service.replace('-', '_')}_http_request_duration_seconds_bucket[5m]))`;
          const result = await queryPrometheusRange(query, start, now);
          return {
            service,
            data: result.data.result[0]?.values || []
          };
        } catch (error) {
          return { service, data: [] };
        }
      })
    );

    // Get slow endpoints
    const slowEndpoints = await Promise.all(
      services.map(async (service) => {
        try {
          const query = `histogram_quantile(0.95, rate(${service.replace('-', '_')}_http_request_duration_seconds_bucket[5m])) > 1`;
          const result = await queryPrometheus(query);
          return {
            service,
            endpoints: result.data.result.map((r: any) => ({
              route: r.metric.route,
              value: r.value[1]
            }))
          };
        } catch (error) {
          return { service, endpoints: [] };
        }
      })
    );

    res.json({
      status: 'success',
      data: {
        responseTimeTrends,
        slowEndpoints,
        timeframe,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch performance data'
    });
  }
});

// GET /api/v1/monitoring/database - Database performance
router.get('/database', async (req: Request, res: Response) => {
  try {
    const now = Date.now() / 1000;
    const oneHourAgo = now - 3600;

    // Get database query performance
    const queryPerformance = await queryPrometheus(
      'rate(database_query_duration_seconds_sum[5m]) / rate(database_query_duration_seconds_count[5m])'
    );

    // Get slow queries
    const slowQueries = await queryPrometheus(
      'database_query_duration_seconds{quantile="0.95"} > 2'
    );

    // Get database connections
    const dbConnections = await queryPrometheus(
      'sum(database_connections)'
    );

    // Get database errors
    const dbErrors = await queryPrometheus(
      'rate(database_errors_total[5m])'
    );

    res.json({
      status: 'success',
      data: {
        queryPerformance: queryPerformance.data.result,
        slowQueries: slowQueries.data.result,
        connections: dbConnections.data.result,
        errors: dbErrors.data.result,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching database data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch database data'
    });
  }
});

// GET /api/v1/monitoring/alerts - Active alerts and history
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    // Get active alerts
    const alerts = await queryAlertmanager('/api/v1/alerts');
    const activeAlerts = alerts.data?.alerts?.filter((alert: any) => alert.status.state === 'active') || [];
    
    // Get alert groups
    const alertGroups = await queryAlertmanager('/api/v1/alerts/groups');
    
    // Get silence status
    const silences = await queryAlertmanager('/api/v1/silences');

    res.json({
      status: 'success',
      data: {
        activeAlerts: activeAlerts.map((alert: any) => ({
          id: alert.fingerprint,
          name: alert.labels.alertname,
          severity: alert.labels.severity,
          service: alert.labels.service,
          summary: alert.annotations.summary,
          description: alert.annotations.description,
          startsAt: alert.startsAt,
          status: alert.status
        })),
        alertGroups: alertGroups.data?.groups || [],
        silences: silences.data?.silences || [],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching alerts data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch alerts data'
    });
  }
});

// GET /api/v1/monitoring/system - Resource usage
router.get('/system', async (req: Request, res: Response) => {
  try {
    const now = Date.now() / 1000;
    const oneHourAgo = now - 3600;

    // Get CPU usage
    const cpuUsage = await queryPrometheusRange(
      'rate(process_cpu_seconds_total[5m]) * 100',
      oneHourAgo,
      now
    );

    // Get memory usage
    const memoryUsage = await queryPrometheusRange(
      'process_resident_memory_bytes / 1024 / 1024',
      oneHourAgo,
      now
    );

    // Get disk usage (if available)
    const diskUsage = await queryPrometheus(
      'node_filesystem_size_bytes - node_filesystem_free_bytes'
    );

    // Get network I/O (if available)
    const networkIO = await queryPrometheusRange(
      'rate(node_network_receive_bytes_total[5m]) + rate(node_network_transmit_bytes_total[5m])',
      oneHourAgo,
      now
    );

    res.json({
      status: 'success',
      data: {
        cpu: cpuUsage.data.result,
        memory: memoryUsage.data.result,
        disk: diskUsage.data.result,
        network: networkIO.data.result,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching system data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch system data'
    });
  }
});

// GET /api/v1/monitoring/services - Detailed service status
router.get('/services', async (req: Request, res: Response) => {
  try {
    const services = ['auth-service', 'core-service', 'mcp-server', 'webhook-service', 'notification-service'];
    
    const serviceDetails = await Promise.all(
      services.map(async (service) => {
        try {
          const [
            uptime,
            requestRate,
            errorRate,
            responseTime,
            memoryUsage
          ] = await Promise.all([
            queryPrometheus(`process_start_time_seconds{job="${service}"}`),
            queryPrometheus(`sum(rate(${service.replace('-', '_')}_http_requests_total[5m]))`),
            queryPrometheus(`sum(rate(${service.replace('-', '_')}_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(${service.replace('-', '_')}_http_requests_total[5m]))`),
            queryPrometheus(`histogram_quantile(0.95, rate(${service.replace('-', '_')}_http_request_duration_seconds_bucket[5m]))`),
            queryPrometheus(`process_resident_memory_bytes{job="${service}"}`)
          ]);

          return {
            service,
            status: 'up',
            uptime: uptime.data.result[0]?.value[1] || '0',
            requestRate: requestRate.data.result[0]?.value[1] || '0',
            errorRate: errorRate.data.result[0]?.value[1] || '0',
            responseTime: responseTime.data.result[0]?.value[1] || '0',
            memoryUsage: memoryUsage.data.result[0]?.value[1] || '0'
          };
        } catch (error) {
          return {
            service,
            status: 'down',
            uptime: '0',
            requestRate: '0',
            errorRate: '0',
            responseTime: '0',
            memoryUsage: '0'
          };
        }
      })
    );

    res.json({
      status: 'success',
      data: {
        services: serviceDetails,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching services data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch services data'
    });
  }
});

// GET /api/v1/monitoring/response-time/overview - Response time overview
router.get('/response-time/overview', async (req: Request, res: Response) => {
  try {
    const now = Date.now() / 1000;
    const oneHourAgo = now - 3600;

    // Get average response time across all services
    const avgResponseTimeQuery = `
      (
        histogram_quantile(0.50, sum(rate(http_response_time_milliseconds_bucket[5m])) by (le, service, route)) +
        histogram_quantile(0.90, sum(rate(http_response_time_milliseconds_bucket[5m])) by (le, service, route)) +
        histogram_quantile(0.95, sum(rate(http_response_time_milliseconds_bucket[5m])) by (le, service, route)) +
        histogram_quantile(0.99, sum(rate(http_response_time_milliseconds_bucket[5m])) by (le, service, route))
      ) / 4
    `;
    const avgResponseTime = await queryPrometheus(avgResponseTimeQuery);

    // Get SLA compliance rate
    const slaComplianceQuery = `
      (
        sum(
          rate(slow_requests_total[5m])
        ) by (sla_tier)
        /
        sum(
          rate(http_response_time_milliseconds_count[5m])
        ) by (sla_tier)
      )
    `;
    const slaCompliance = await queryPrometheus(slaComplianceQuery);

    // Get slowest endpoints
    const slowestEndpointsQuery = `
      topk(10,
        histogram_quantile(0.95,
          sum(rate(http_response_time_milliseconds_bucket[5m]))
          by (le, service, route)
        )
      )
    `;
    const slowestEndpoints = await queryPrometheus(slowestEndpointsQuery);

    // Get violations count
    const violationsQuery = `
      sum(
        rate(slow_requests_total[5m])
      )
    `;
    const violations = await queryPrometheus(violationsQuery);

    res.json({
      status: 'success',
      data: {
        avgResponseTime: {
          p50: avgResponseTime.data.result[0]?.value[1] || '0',
          p90: avgResponseTime.data.result[1]?.value[1] || '0',
          p95: avgResponseTime.data.result[2]?.value[1] || '0',
          p99: avgResponseTime.data.result[3]?.value[1] || '0'
        },
        slaCompliance: slaCompliance.data.result.map((r: any) => ({
          tier: r.metric.sla_tier,
          compliance: ((1 - parseFloat(r.value[1])) * 100).toFixed(2)
        })),
        slowestEndpoints: slowestEndpoints.data.result.map((r: any) => ({
          service: r.metric.service,
          route: r.metric.route,
          p95: parseFloat(r.value[1]).toFixed(2)
        })),
        violationsCount: violations.data.result[0]?.value[1] || '0',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching response time overview:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch response time overview'
    });
  }
});

// GET /api/v1/monitoring/response-time/endpoints - Endpoint analysis
router.get('/response-time/endpoints', async (req: Request, res: Response) => {
  try {
    const {
      service,
      sla_tier,
      page = '1',
      limit = '50',
      sort = 'p95',
      order = 'desc'
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    // Build query filters
    let filters = [];
    if (service) filters.push(`service="${service}"`);
    if (sla_tier) filters.push(`sla_tier="${sla_tier}"`);
    
    const filterClause = filters.length > 0 ? `{${filters.join(',')}}` : '';

    // Get endpoint metrics
    const endpointsQuery = `
      topk(${parseInt(limit as string) + offset},
        histogram_quantile(0.95,
          sum(rate(http_response_time_milliseconds_bucket${filterClause}[5m]))
          by (le, service, route, method, sla_tier)
        )
      )
    `;
    const endpoints = await queryPrometheus(endpointsQuery);

    // Get additional metrics for each endpoint
    const detailedEndpoints = await Promise.all(
      endpoints.data.result.slice(offset, offset + parseInt(limit as string)).map(async (endpoint: any) => {
        const { service, route, method, sla_tier } = endpoint.metric;
        
        const [p50, p90, p95, p99, avg, count, slaCompliance] = await Promise.all([
          queryPrometheus(`histogram_quantile(0.50, sum(rate(http_response_time_milliseconds_bucket{service="${service}",route="${route}",method="${method}"}[5m])) by (le)`),
          queryPrometheus(`histogram_quantile(0.90, sum(rate(http_response_time_milliseconds_bucket{service="${service}",route="${route}",method="${method}"}[5m])) by (le)`),
          queryPrometheus(`histogram_quantile(0.95, sum(rate(http_response_time_milliseconds_bucket{service="${service}",route="${route}",method="${method}"}[5m])) by (le)`),
          queryPrometheus(`histogram_quantile(0.99, sum(rate(http_response_time_milliseconds_bucket{service="${service}",route="${route}",method="${method}"}[5m])) by (le)`),
          queryPrometheus(`sum(rate(http_response_time_milliseconds_sum{service="${service}",route="${route}",method="${method}"}[5m])) / sum(rate(http_response_time_milliseconds_count{service="${service}",route="${route}",method="${method}"}[5m]))`),
          queryPrometheus(`sum(rate(http_response_time_milliseconds_count{service="${service}",route="${route}",method="${method}"}[5m]))`),
          queryPrometheus(`sla_compliance{service="${service}",route="${route}",method="${method}"`)
        ]);

        return {
          service,
          route,
          method,
          slaTier: sla_tier,
          metrics: {
            p50: parseFloat(p50.data.result[0]?.value[1] || '0').toFixed(2),
            p90: parseFloat(p90.data.result[0]?.value[1] || '0').toFixed(2),
            p95: parseFloat(p95.data.result[0]?.value[1] || '0').toFixed(2),
            p99: parseFloat(p99.data.result[0]?.value[1] || '0').toFixed(2),
            avg: parseFloat(avg.data.result[0]?.value[1] || '0').toFixed(2),
            count: parseInt(count.data.result[0]?.value[1] || '0'),
            slaCompliance: parseFloat(slaCompliance.data.result[0]?.value[1] || '0')
          }
        };
      })
    );

    // Sort results
    detailedEndpoints.sort((a, b) => {
      const aValue = parseFloat(a.metrics[sort as string]);
      const bValue = parseFloat(b.metrics[sort as string]);
      return order === 'desc' ? bValue - aValue : aValue - bValue;
    });

    res.json({
      status: 'success',
      data: {
        endpoints: detailedEndpoints,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: endpoints.data.result.length
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching endpoint analysis:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch endpoint analysis'
    });
  }
});

// GET /api/v1/monitoring/response-time/trends - Response time trends
router.get('/response-time/trends', async (req: Request, res: Response) => {
  try {
    const { timeframe = '1h', service, route } = req.query;
    const now = Date.now() / 1000;
    let start: number;

    switch (timeframe) {
      case '1h':
        start = now - 3600;
        break;
      case '6h':
        start = now - 21600;
        break;
      case '24h':
        start = now - 86400;
        break;
      case '7d':
        start = now - 604800;
        break;
      default:
        start = now - 3600;
    }

    // Build query filters
    let filters = [];
    if (service) filters.push(`service="${service}"`);
    if (route) filters.push(`route="${route}"`);
    
    const filterClause = filters.length > 0 ? `{${filters.join(',')}}` : '';

    // Get trends for different percentiles
    const [p50Trend, p90Trend, p95Trend, p99Trend] = await Promise.all([
      queryPrometheusRange(`histogram_quantile(0.50, sum(rate(http_response_time_milliseconds_bucket${filterClause}[5m])) by (le, service, route))`, start, now),
      queryPrometheusRange(`histogram_quantile(0.90, sum(rate(http_response_time_milliseconds_bucket${filterClause}[5m])) by (le, service, route))`, start, now),
      queryPrometheusRange(`histogram_quantile(0.95, sum(rate(http_response_time_milliseconds_bucket${filterClause}[5m])) by (le, service, route))`, start, now),
      queryPrometheusRange(`histogram_quantile(0.99, sum(rate(http_response_time_milliseconds_bucket${filterClause}[5m])) by (le, service, route))`, start, now)
    ]);

    // Process trend data
    const processTrendData = (data: any, percentile: string) => {
      return data.data.result.map((result: any) => ({
        service: result.metric.service,
        route: result.metric.route,
        percentile,
        data: result.values.map((value: any[]) => ({
          timestamp: new Date(parseInt(value[0]) * 1000).toISOString(),
          value: parseFloat(value[1]).toFixed(2)
        }))
      }));
    };

    const trends = [
      ...processTrendData(p50Trend, 'p50'),
      ...processTrendData(p90Trend, 'p90'),
      ...processTrendData(p95Trend, 'p95'),
      ...processTrendData(p99Trend, 'p99')
    ];

    res.json({
      status: 'success',
      data: {
        trends,
        timeframe,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching response time trends:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch response time trends'
    });
  }
});

// GET /api/v1/monitoring/response-time/violations - SLA violations
router.get('/response-time/violations', async (req: Request, res: Response) => {
  try {
    const { timeframe = '1h', sla_tier, service } = req.query;
    const now = Date.now() / 1000;
    let start: number;

    switch (timeframe) {
      case '1h':
        start = now - 3600;
        break;
      case '6h':
        start = now - 21600;
        break;
      case '24h':
        start = now - 86400;
        break;
      default:
        start = now - 3600;
    }

    // Build query filters
    let filters = [];
    if (sla_tier) filters.push(`sla_tier="${sla_tier}"`);
    if (service) filters.push(`service="${service}"`);
    
    const filterClause = filters.length > 0 ? `{${filters.join(',')}}` : '';

    // Get SLA violations
    const violationsQuery = `
      sum(rate(slow_requests_total${filterClause}[5m])) by (service, route, method, sla_tier, sla_threshold)
    `;
    const violations = await queryPrometheus(violationsQuery);

    // Get violation trends
    const violationTrends = await queryPrometheusRange(
      `sum(rate(slow_requests_total${filterClause}[5m])) by (service, route, method, sla_tier)`,
      start,
      now
    );

    // Process violations data
    const processedViolations = violations.data.result.map((violation: any) => ({
      service: violation.metric.service,
      route: violation.metric.route,
      method: violation.metric.method,
      slaTier: violation.metric.sla_tier,
      slaThreshold: violation.metric.sla_threshold,
      violationRate: parseFloat(violation.value[1]).toFixed(2),
      trend: violationTrends.data.result
        .find((t: any) =>
          t.metric.service === violation.metric.service &&
          t.metric.route === violation.metric.route &&
          t.metric.method === violation.metric.method
        )?.values || []
    }));

    res.json({
      status: 'success',
      data: {
        violations: processedViolations,
        timeframe,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching SLA violations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch SLA violations'
    });
  }
});

// GET /api/v1/monitoring/response-time/baselines - Performance baselines
router.get('/response-time/baselines', async (req: Request, res: Response) => {
  try {
    const { service, route, days = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    // Build database query filters
    const whereClause: any = {
      date: {
        gte: startDate
      }
    };

    if (service) whereClause.service = service;
    if (route) whereClause.route = { contains: route };

    // Query performance baselines from database
    const baselines = await prisma.performanceBaseline.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc'
      },
      take: 100
    });

    // Group baselines by endpoint
    const groupedBaselines = baselines.reduce((acc: any, baseline: any) => {
      const key = `${baseline.service}-${baseline.route}-${baseline.method}`;
      if (!acc[key]) {
        acc[key] = {
          service: baseline.service,
          route: baseline.route,
          method: baseline.method,
          slaTier: baseline.slaTier,
          slaThreshold: baseline.slaThreshold,
          data: []
        };
      }
      acc[key].data.push({
        date: baseline.date.toISOString().split('T')[0],
        p50: baseline.p50,
        p90: baseline.p90,
        p95: baseline.p95,
        p99: baseline.p99,
        avg: baseline.avg,
        count: baseline.count,
        slaCompliance: baseline.slaCompliance
      });
      return acc;
    }, {});

    res.json({
      status: 'success',
      data: {
        baselines: Object.values(groupedBaselines),
        period: days,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching performance baselines:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch performance baselines'
    });
  }
});

// GET /api/v1/monitoring/response-time/compare - Performance comparison
router.get('/response-time/compare', async (req: Request, res: Response) => {
  try {
    const {
      endpoints,
      timeframe = '1h',
      metric = 'p95'
    } = req.query;

    if (!endpoints) {
      return res.status(400).json({
        status: 'error',
        message: 'Endpoints parameter is required (comma-separated list)'
      });
    }

    const endpointList = (endpoints as string).split(',');
    const now = Date.now() / 1000;
    let start: number;

    switch (timeframe) {
      case '1h':
        start = now - 3600;
        break;
      case '6h':
        start = now - 21600;
        break;
      case '24h':
        start = now - 86400;
        break;
      default:
        start = now - 3600;
    }

    // Get comparison data for each endpoint
    const comparisonData = await Promise.all(
      endpointList.map(async (endpoint) => {
        const [service, route] = endpoint.trim().split(':');
        
        const percentile = parseFloat((metric as string).replace('p', '')) / 100;
        const query = `histogram_quantile(${percentile}, sum(rate(http_response_time_milliseconds_bucket{service="${service}",route="${route}"}[5m])) by (le))`;
        
        try {
          const result = await queryPrometheusRange(query, start, now);
          const values = result.data.result[0]?.values || [];
          
          return {
            endpoint: endpoint.trim(),
            data: values.map((value: any[]) => ({
              timestamp: new Date(parseInt(value[0]) * 1000).toISOString(),
              value: parseFloat(value[1]).toFixed(2)
            }))
          };
        } catch (error) {
          return {
            endpoint: endpoint.trim(),
            data: []
          };
        }
      })
    );

    res.json({
      status: 'success',
      data: {
        comparison: comparisonData,
        metric,
        timeframe,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching performance comparison:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch performance comparison'
    });
  }
});

export default router;