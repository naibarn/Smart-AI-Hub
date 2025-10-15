export interface MetricOptions {
  name: string;
  help: string;
  labelNames?: string[];
}

export interface CounterMetric {
  inc(labels?: Record<string, string>, value?: number): void;
}

export interface HistogramMetric {
  observe(labels?: Record<string, string>, value?: number): void;
}

export interface GaugeMetric {
  inc(labels?: Record<string, string>, value?: number): void;
  dec(labels?: Record<string, string>, value?: number): void;
  set(value: number, labels?: Record<string, string>): void;
  get(labels?: Record<string, string>): number | Promise<number>;
}

export interface SummaryMetric {
  observe(labels?: Record<string, string>, value?: number): void;
}

export interface Metrics {
  counter: CounterMetric;
  histogram: HistogramMetric;
  gauge: GaugeMetric;
  summary: SummaryMetric;
}

export interface ServiceMetrics {
  httpRequestsTotal: CounterMetric;
  httpRequestDuration: HistogramMetric;
  activeConnections: GaugeMetric;
  databaseConnections: GaugeMetric;
  errorRate: GaugeMetric;
  queueSize: GaugeMetric;
  customMetrics: Map<string, Metrics>;
}

export interface MonitoringConfig {
  serviceName: string;
  version: string;
  environment: string;
  port: number;
  metricsPath?: string;
  defaultLabels?: Record<string, string>;
}

export interface PerformanceMetrics {
  responseTime: number;
  statusCode: number;
  method: string;
  route: string;
  userAgent?: string;
  userId?: string;
}

export interface DatabaseMetrics {
  queryTime: number;
  queryType: string;
  table: string;
  success: boolean;
  errorMessage?: string;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIO: number;
  uptime: number;
}

export interface AlertRule {
  name: string;
  condition: string;
  duration: string;
  severity: 'critical' | 'warning' | 'info';
  summary: string;
  description: string;
  labels?: Record<string, string>;
}