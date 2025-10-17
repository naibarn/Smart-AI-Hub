import { Request, Response, NextFunction } from 'express';
import { PrometheusMetrics } from './metrics';
import { PerformanceMetrics } from './types';
import fs from 'fs';
import path from 'path';

export interface MetricsRequest extends Request {
  startTime?: number;
  metrics?: PrometheusMetrics;
  slaTier?: string;
  slaThreshold?: number;
}

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
  responseTimeHeader: {
    enabled: boolean;
    headerName: string;
    precision: number;
    unit: string;
  };
}

export function createMetricsMiddleware(metrics: PrometheusMetrics) {
  return (req: MetricsRequest, res: Response, next: NextFunction): void => {
    req.startTime = Date.now();
    req.metrics = metrics;

    // Determine SLA tier for this endpoint
    const slaConfig = loadSLAConfig();
    const { slaTier, slaThreshold } = determineSLATier(req, slaConfig);
    req.slaTier = slaTier;
    req.slaThreshold = slaThreshold;

    // Increment active connections
    metrics.setActiveConnections(1);

    // Log request start
    res.on('finish', () => {
      const duration = req.startTime ? Date.now() - req.startTime : 0; // in milliseconds
      const route = req.route?.path || req.path || 'unknown';

      // Record HTTP request metrics with SLA information
      metrics.incrementHttpRequests(req.method, route, res.statusCode, {
        sla_tier: slaTier,
        sla_threshold: slaThreshold.toString(),
      });

      metrics.recordHttpRequestDuration(req.method, route, res.statusCode, duration / 1000, {
        sla_tier: slaTier,
        sla_threshold: slaThreshold.toString(),
      });

      // Record detailed response time metrics in milliseconds
      let responseTimeHistogram = metrics
        .getMetrics()
        .customMetrics.get('http_response_time_ms')?.histogram;
      if (!responseTimeHistogram) {
        responseTimeHistogram = metrics.createCustomHistogram({
          name: 'http_response_time_milliseconds',
          help: 'HTTP response time in milliseconds',
          labelNames: ['method', 'route', 'status_code', 'sla_tier', 'sla_threshold'],
        });
        metrics
          .getMetrics()
          .customMetrics.set('http_response_time_ms', { histogram: responseTimeHistogram } as any);
      }
      responseTimeHistogram?.observe(
        {
          method: req.method,
          route,
          status_code: res.statusCode.toString(),
          sla_tier: slaTier,
          sla_threshold: slaThreshold.toString(),
        },
        duration
      );

      // Add response time header if enabled
      if (slaConfig.responseTimeHeader.enabled) {
        const headerValue = `${duration.toFixed(slaConfig.responseTimeHeader.precision)}${slaConfig.responseTimeHeader.unit}`;
        res.setHeader(slaConfig.responseTimeHeader.headerName, headerValue);
      }

      // Log slow requests exceeding SLA
      if (duration > slaThreshold) {
        let slowRequestsCounter = metrics
          .getMetrics()
          .customMetrics.get('slow_requests_total')?.counter;
        if (!slowRequestsCounter) {
          slowRequestsCounter = metrics.createCustomCounter({
            name: 'slow_requests_total',
            help: 'Total number of slow requests exceeding SLA',
            labelNames: ['method', 'route', 'sla_tier', 'sla_threshold'],
          });
          metrics
            .getMetrics()
            .customMetrics.set('slow_requests_total', { counter: slowRequestsCounter } as any);
        }
        slowRequestsCounter?.inc({
          method: req.method,
          route,
          sla_tier: slaTier,
          sla_threshold: slaThreshold.toString(),
        });

        // Log slow request for debugging
        console.warn(
          `Slow request detected: ${req.method} ${route} - ${duration}ms (SLA: ${slaThreshold}ms, Tier: ${slaTier})`
        );
      }

      // Record SLA compliance
      let slaComplianceGauge = metrics.getMetrics().customMetrics.get('sla_compliance')?.gauge;
      if (!slaComplianceGauge) {
        slaComplianceGauge = metrics.createCustomGauge({
          name: 'sla_compliance',
          help: 'SLA compliance percentage',
          labelNames: ['method', 'route', 'sla_tier'],
        });
        metrics
          .getMetrics()
          .customMetrics.set('sla_compliance', { gauge: slaComplianceGauge } as any);
      }
      const compliance = duration <= slaThreshold ? 100 : 0;
      slaComplianceGauge?.set(
        {
          method: req.method,
          route,
          sla_tier: slaTier,
        },
        compliance
      );

      // Decrement active connections
      metrics.setActiveConnections(-1);

      // Record error rate for non-2xx responses
      if (res.statusCode >= 400) {
        const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
        metrics.setErrorRate(errorType, 1);
      }
    });

    next();
  };
}

export function incrementActiveConnections(metrics: PrometheusMetrics): void {
  metrics.setActiveConnections(1);
}

export function decrementActiveConnections(metrics: PrometheusMetrics): void {
  metrics.setActiveConnections(-1);
}

export function recordDatabaseQuery(
  metrics: PrometheusMetrics,
  queryTime: number,
  queryType: string,
  table: string,
  success: boolean,
  errorMessage?: string
): void {
  const labels = {
    query_type: queryType,
    table,
    success: success.toString(),
  };

  if (success) {
    // Create custom histogram if it doesn't exist
    let histogram = metrics.getMetrics().customMetrics.get('database_query_duration')?.histogram;
    if (!histogram) {
      histogram = metrics.createCustomHistogram({
        name: 'database_query_duration_seconds',
        help: 'Database query duration in seconds',
        labelNames: ['query_type', 'table', 'success'],
      });
      metrics.getMetrics().customMetrics.set('database_query_duration', { histogram } as any);
    }
    histogram?.observe(labels, queryTime / 1000); // Convert to seconds
  } else {
    // Create custom counter if it doesn't exist
    let counter = metrics.getMetrics().customMetrics.get('database_errors')?.counter;
    if (!counter) {
      counter = metrics.createCustomCounter({
        name: 'database_errors_total',
        help: 'Total number of database errors',
        labelNames: ['query_type', 'table', 'success', 'error_message'],
      });
      metrics.getMetrics().customMetrics.set('database_errors', { counter } as any);
    }
    counter?.inc({
      ...labels,
      error_message: errorMessage || 'unknown',
    });
  }
}

export function recordQueueSize(metrics: PrometheusMetrics, queueName: string, size: number): void {
  metrics.setQueueSize(queueName, size);
}

export function recordCustomMetric(
  metrics: PrometheusMetrics,
  metricName: string,
  value: number,
  labels?: Record<string, string>
): void {
  const customMetric = metrics.getMetrics().customMetrics.get(metricName);
  if (customMetric) {
    if (customMetric.counter) {
      customMetric.counter.inc(labels, value);
    } else if (customMetric.histogram) {
      if (labels) {
        customMetric.histogram.observe(labels, value);
      } else {
        customMetric.histogram.observe(value);
      }
    } else if (customMetric.gauge) {
      if (labels) {
        customMetric.gauge.set(labels, value);
      } else {
        customMetric.gauge.set(value);
      }
    }
  }
}

export function createErrorTrackingMiddleware(metrics: PrometheusMetrics) {
  return (err: Error, req: MetricsRequest, res: Response, next: NextFunction): void => {
    const errorType = err.name || 'UnknownError';

    // Increment error counter
    metrics.setErrorRate(errorType, 1);

    // Record error details
    const errorLabels = {
      error_type: errorType,
      method: req.method,
      route: req.route?.path || req.path || 'unknown',
      status_code: res.statusCode.toString(),
    };

    // Create custom counter if it doesn't exist
    let errorCounter = metrics.getMetrics().customMetrics.get('http_errors_total')?.counter;
    if (!errorCounter) {
      errorCounter = metrics.createCustomCounter({
        name: 'http_errors_total',
        help: 'Total number of HTTP errors',
        labelNames: ['error_type', 'method', 'route', 'status_code'],
      });
      metrics.getMetrics().customMetrics.set('http_errors_total', { counter: errorCounter } as any);
    }
    errorCounter?.inc(errorLabels);

    next(err);
  };
}

export function createPerformanceTrackingMiddleware(metrics: PrometheusMetrics) {
  return (req: MetricsRequest, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      const performanceData: PerformanceMetrics = {
        responseTime: duration,
        statusCode: res.statusCode,
        method: req.method,
        route: req.route?.path || req.path || 'unknown',
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
      };

      // Record detailed performance metrics
      let responseTimeHistogram = metrics
        .getMetrics()
        .customMetrics.get('http_response_time_ms')?.histogram;
      if (!responseTimeHistogram) {
        responseTimeHistogram = metrics.createCustomHistogram({
          name: 'http_response_time_milliseconds',
          help: 'HTTP response time in milliseconds',
          labelNames: ['method', 'route', 'status_code'],
        });
        metrics
          .getMetrics()
          .customMetrics.set('http_response_time_ms', { histogram: responseTimeHistogram } as any);
      }
      responseTimeHistogram?.observe(
        {
          method: req.method,
          route: performanceData.route,
          status_code: res.statusCode.toString(),
        },
        duration
      );

      // Track slow requests (> 1 second)
      if (duration > 1000) {
        let slowRequestsCounter = metrics
          .getMetrics()
          .customMetrics.get('slow_requests_total')?.counter;
        if (!slowRequestsCounter) {
          slowRequestsCounter = metrics.createCustomCounter({
            name: 'slow_requests_total',
            help: 'Total number of slow requests',
            labelNames: ['method', 'route', 'threshold'],
          });
          metrics
            .getMetrics()
            .customMetrics.set('slow_requests_total', { counter: slowRequestsCounter } as any);
        }
        slowRequestsCounter?.inc({
          method: req.method,
          route: performanceData.route,
          threshold: '1s',
        });
      }
    });

    next();
  };
}

function loadSLAConfig(): SLAConfig {
  try {
    const configPath = path.join(process.cwd(), '..', '..', '..', 'config', 'sla-config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.warn('Failed to load SLA config, using defaults:', error);
    return {
      slaTiers: {
        low: {
          name: 'Low',
          thresholdMs: 5000,
          percentile: 'p95',
          endpoints: ['/*'],
          services: ['*'],
        },
      },
      responseTimeHeader: {
        enabled: true,
        headerName: 'X-Response-Time',
        precision: 2,
        unit: 'ms',
      },
    };
  }
}

function determineSLATier(
  req: MetricsRequest,
  slaConfig: SLAConfig
): { slaTier: string; slaThreshold: number } {
  const serviceName = process.env.SERVICE_NAME || 'unknown';
  const route = req.route?.path || req.path || 'unknown';

  // Check each tier from highest to lowest priority
  for (const [tier, config] of Object.entries(slaConfig.slaTiers)) {
    if (config.services.includes(serviceName) || config.services.includes('*')) {
      // Check if route matches any endpoint pattern
      for (const endpoint of config.endpoints) {
        if (routeMatchesPattern(route, endpoint)) {
          return { slaTier: tier, slaThreshold: config.thresholdMs };
        }
      }
    }
  }

  // Default to low tier if no match found
  return {
    slaTier: 'low',
    slaThreshold: slaConfig.slaTiers.low?.thresholdMs || 5000,
  };
}

function routeMatchesPattern(route: string, pattern: string): boolean {
  // Simple pattern matching - can be enhanced with regex
  if (pattern.includes('*')) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(route);
  }
  return route === pattern;
}
