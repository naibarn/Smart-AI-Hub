import { PrometheusMetrics } from './metrics';
import { AlertRule } from './types';

export function createMetricsEndpoint(metrics: PrometheusMetrics) {
  return async (req: any, res: any) => {
    try {
      const metricsText = await metrics.getMetricsAsText();
      res.set('Content-Type', 'text/plain');
      res.send(metricsText);
    } catch (error) {
      console.error('Error generating metrics:', error);
      res.status(500).send('Error generating metrics');
    }
  };
}

export function createHealthCheckEndpoint(metrics: PrometheusMetrics) {
  return async (req: any, res: any) => {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        activeConnections: await metrics.getActiveConnections(),
        service: 'running'
      };

      res.json(healthStatus);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export function generateAlertRules(serviceName: string): AlertRule[] {
  return [
    {
      name: `${serviceName}_ServiceDown`,
      condition: `up{job="${serviceName}"} == 0`,
      duration: '1m',
      severity: 'critical',
      summary: `${serviceName} service is down`,
      description: `${serviceName} service has been down for more than 1 minute`,
      labels: {
        service: serviceName,
        team: 'platform'
      }
    },
    {
      name: `${serviceName}_HighErrorRate`,
      condition: `rate(${serviceName}_http_requests_total{status_code=~"5.."}[5m]) / rate(${serviceName}_http_requests_total[5m]) > 0.1`,
      duration: '2m',
      severity: 'warning',
      summary: `${serviceName} has high error rate`,
      description: `${serviceName} error rate is above 10% for more than 2 minutes`,
      labels: {
        service: serviceName,
        team: 'platform'
      }
    },
    {
      name: `${serviceName}_HighResponseTime`,
      condition: `histogram_quantile(0.95, rate(${serviceName}_http_request_duration_seconds_bucket[5m])) > 1`,
      duration: '3m',
      severity: 'warning',
      summary: `${serviceName} has high response time`,
      description: `${serviceName} 95th percentile response time is above 1 second for more than 3 minutes`,
      labels: {
        service: serviceName,
        team: 'platform'
      }
    },
    {
      name: `${serviceName}_HighMemoryUsage`,
      condition: `process_resident_memory_bytes{job="${serviceName}"} / 1024 / 1024 > 512`,
      duration: '5m',
      severity: 'warning',
      summary: `${serviceName} has high memory usage`,
      description: `${serviceName} memory usage is above 512MB for more than 5 minutes`,
      labels: {
        service: serviceName,
        team: 'platform'
      }
    },
    {
      name: `${serviceName}_HighCPUUsage`,
      condition: `rate(process_cpu_seconds_total{job="${serviceName}"}[5m]) * 100 > 80`,
      duration: '5m',
      severity: 'warning',
      summary: `${serviceName} has high CPU usage`,
      description: `${serviceName} CPU usage is above 80% for more than 5 minutes`,
      labels: {
        service: serviceName,
        team: 'platform'
      }
    },
    {
      name: `${serviceName}_UnusualTraffic`,
      condition: `rate(${serviceName}_http_requests_total[5m]) > 100`,
      duration: '2m',
      severity: 'info',
      summary: `${serviceName} has unusual traffic pattern`,
      description: `${serviceName} is receiving more than 100 requests per second for more than 2 minutes`,
      labels: {
        service: serviceName,
        team: 'platform'
      }
    },
    {
      name: `${serviceName}_DatabaseConnectionIssues`,
      condition: `${serviceName}_database_connections == 0`,
      duration: '1m',
      severity: 'critical',
      summary: `${serviceName} has no database connections`,
      description: `${serviceName} has no active database connections for more than 1 minute`,
      labels: {
        service: serviceName,
        team: 'platform'
      }
    }
  ];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  
  return sorted[index];
}

export function calculateRate(current: number, previous: number, timeWindow: number): number {
  if (previous === 0) return 0;
  return (current - previous) / timeWindow;
}

export function sanitizeLabelName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

export function validateMetricName(name: string): boolean {
  return /^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(name);
}

export function extractServiceNameFromLabels(labels: Record<string, string>): string {
  return labels.service || labels.job || labels.instance || 'unknown';
}

export function createMetricLabels(baseLabels: Record<string, string>, additionalLabels?: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  // Sanitize all label names and values
  Object.entries(baseLabels).forEach(([key, value]) => {
    const sanitizedKey = sanitizeLabelName(key);
    sanitized[sanitizedKey] = String(value);
  });
  
  if (additionalLabels) {
    Object.entries(additionalLabels).forEach(([key, value]) => {
      const sanitizedKey = sanitizeLabelName(key);
      sanitized[sanitizedKey] = String(value);
    });
  }
  
  return sanitized;
}