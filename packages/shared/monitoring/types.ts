export interface MetricOptions {
  name: string;
  help: string;
  labelNames?: string[];
}

export interface CounterMetric {
  inc(labels?: Partial<Record<string, string | number>>, value?: number): void;
}

export interface HistogramMetric {
  observe(value: number): void;
  observe(labels: Partial<Record<string, string | number>>, value: number): void;
}

export interface GaugeMetric {
  inc(labels?: Partial<Record<string, string | number>>, value?: number): void;
  inc(value?: number): void;
  dec(labels?: Partial<Record<string, string | number>>, value?: number): void;
  dec(value?: number): void;
  set(value: number): void;
  set(labels: Partial<Record<string, string | number>>, value: number): void;
  get(labels?: Partial<Record<string, string | number>>): any;
}

export interface SummaryMetric {
  observe(value: number): void;
  observe(labels: Partial<Record<string, string | number>>, value: number): void;
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
