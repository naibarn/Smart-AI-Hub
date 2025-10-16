import { register, Counter, Histogram, Gauge, Summary } from 'prom-client';
import { MetricOptions, ServiceMetrics, MonitoringConfig } from './types';

export class PrometheusMetrics {
  private config: MonitoringConfig;
  private metrics: ServiceMetrics;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): ServiceMetrics {
    const defaultLabels = {
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      ...this.config.defaultLabels,
    };

    return {
      httpRequestsTotal: new Counter({
        name: `${this.config.serviceName}_http_requests_total`,
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code', ...Object.keys(defaultLabels)],
        registers: [register],
      }),
      httpRequestDuration: new Histogram({
        name: `${this.config.serviceName}_http_request_duration_seconds`,
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code', ...Object.keys(defaultLabels)],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
        registers: [register],
      }),
      activeConnections: new Gauge({
        name: `${this.config.serviceName}_active_connections`,
        help: 'Number of active connections',
        labelNames: [...Object.keys(defaultLabels)],
        registers: [register],
      }),
      databaseConnections: new Gauge({
        name: `${this.config.serviceName}_database_connections`,
        help: 'Number of active database connections',
        labelNames: ['database', ...Object.keys(defaultLabels)],
        registers: [register],
      }),
      errorRate: new Gauge({
        name: `${this.config.serviceName}_error_rate`,
        help: 'Error rate percentage',
        labelNames: ['error_type', ...Object.keys(defaultLabels)],
        registers: [register],
      }),
      queueSize: new Gauge({
        name: `${this.config.serviceName}_queue_size`,
        help: 'Current queue size',
        labelNames: ['queue_name', ...Object.keys(defaultLabels)],
        registers: [register],
      }),
      customMetrics: new Map(),
    };
  }

  public getMetrics(): ServiceMetrics {
    return this.metrics;
  }

  public incrementHttpRequests(
    method: string,
    route: string,
    statusCode: number,
    labels?: Record<string, string>
  ): void {
    const allLabels = {
      method,
      route,
      status_code: statusCode.toString(),
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      ...this.config.defaultLabels,
      ...labels,
    };

    this.metrics.httpRequestsTotal.inc(allLabels);
  }

  public recordHttpRequestDuration(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    labels?: Record<string, string>
  ): void {
    const allLabels = {
      method,
      route,
      status_code: statusCode.toString(),
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      ...this.config.defaultLabels,
      ...labels,
    };

    this.metrics.httpRequestDuration.observe(allLabels, duration);
  }

  public setActiveConnections(count: number, labels?: Record<string, string>): void {
    const allLabels = {
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      ...this.config.defaultLabels,
      ...labels,
    };

    this.metrics.activeConnections.set(count, allLabels);
  }

  public getActiveConnections(labels?: Record<string, string>): number | Promise<number> {
    const allLabels = {
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      ...this.config.defaultLabels,
      ...labels,
    };

    return this.metrics.activeConnections.get(allLabels);
  }

  public setDatabaseConnections(
    database: string,
    count: number,
    labels?: Record<string, string>
  ): void {
    const allLabels = {
      database,
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      ...this.config.defaultLabels,
      ...labels,
    };

    this.metrics.databaseConnections.set(count, allLabels);
  }

  public setErrorRate(errorType: string, rate: number, labels?: Record<string, string>): void {
    const allLabels = {
      error_type: errorType,
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      ...this.config.defaultLabels,
      ...labels,
    };

    this.metrics.errorRate.set(rate, allLabels);
  }

  public setQueueSize(queueName: string, size: number, labels?: Record<string, string>): void {
    const allLabels = {
      queue_name: queueName,
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      ...this.config.defaultLabels,
      ...labels,
    };

    this.metrics.queueSize.set(size, allLabels);
  }

  public createCustomCounter(options: MetricOptions): Counter<string> {
    const counter = new Counter({
      name: `${this.config.serviceName}_${options.name}`,
      help: options.help,
      labelNames: options.labelNames || [],
      registers: [register],
    });

    return counter;
  }

  public createCustomHistogram(options: MetricOptions, buckets?: number[]): Histogram<string> {
    const histogram = new Histogram({
      name: `${this.config.serviceName}_${options.name}`,
      help: options.help,
      labelNames: options.labelNames || [],
      buckets: buckets || [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [register],
    });

    return histogram;
  }

  public createCustomGauge(options: MetricOptions): Gauge<string> {
    const gauge = new Gauge({
      name: `${this.config.serviceName}_${options.name}`,
      help: options.help,
      labelNames: options.labelNames || [],
      registers: [register],
    });

    return gauge;
  }

  public createCustomSummary(options: MetricOptions): Summary<string> {
    const summary = new Summary({
      name: `${this.config.serviceName}_${options.name}`,
      help: options.help,
      labelNames: options.labelNames || [],
      registers: [register],
    });

    return summary;
  }

  public async getMetricsAsText(): Promise<string> {
    return await register.metrics();
  }

  public clearMetrics(): void {
    register.clear();
  }
}

let metricsInstance: PrometheusMetrics | null = null;

export function initializeMetrics(config: MonitoringConfig): PrometheusMetrics {
  if (!metricsInstance) {
    metricsInstance = new PrometheusMetrics(config);
  }
  return metricsInstance;
}

export function getMetrics(): PrometheusMetrics | null {
  return metricsInstance;
}
