import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define the API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Monitoring related types
export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastCheck: string;
  responseTime?: number;
  errorRate?: number;
}

export interface MetricData {
  timestamp: string;
  value: number;
  labels?: Record<string, string>;
}

export interface OverviewMetrics {
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  services: ServiceStatus[];
}

export interface PerformanceMetrics {
  responseTime: MetricData[];
  throughput: MetricData[];
  errorRate: MetricData[];
  topEndpoints: Array<{
    path: string;
    avgResponseTime: number;
    requestCount: number;
    errorRate: number;
  }>;
}

export interface DatabaseMetrics {
  queryTime: MetricData[];
  connectionCount: number;
  slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: string;
    frequency: number;
  }>;
  databaseSize: number;
  indexUsage: Record<string, number>;
}

export interface Alert {
  id: string;
  name: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'resolved' | 'silenced';
  message: string;
  timestamp: string;
  service?: string;
  labels?: Record<string, string>;
}

export interface SystemMetrics {
  cpu: MetricData[];
  memory: MetricData[];
  disk: MetricData[];
  network: MetricData[];
  uptime: number;
  version: string;
}

export interface MonitoringResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// Create the monitoring API slice
export const monitoringApi = createApi({
  reducerPath: 'monitoringApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Monitoring'],
  endpoints: (builder) => ({
    // Get overview metrics
    getOverview: builder.query<MonitoringResponse<OverviewMetrics>, void>({
      query: () => '/api/v1/monitoring/overview',
      providesTags: ['Monitoring'],
    }),

    // Get performance metrics
    getPerformance: builder.query<MonitoringResponse<PerformanceMetrics>, { timeRange?: string }>({
      query: ({ timeRange = '1h' }) => `/api/v1/monitoring/performance?timeRange=${timeRange}`,
      providesTags: ['Monitoring'],
    }),

    // Get database metrics
    getDatabase: builder.query<MonitoringResponse<DatabaseMetrics>, { timeRange?: string }>({
      query: ({ timeRange = '1h' }) => `/api/v1/monitoring/database?timeRange=${timeRange}`,
      providesTags: ['Monitoring'],
    }),

    // Get alerts
    getAlerts: builder.query<MonitoringResponse<Alert[]>, { status?: string; severity?: string }>({
      query: ({ status, severity }) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (severity) params.append('severity', severity);
        return `/api/v1/monitoring/alerts?${params.toString()}`;
      },
      providesTags: ['Monitoring'],
    }),

    // Get system metrics
    getSystem: builder.query<MonitoringResponse<SystemMetrics>, { timeRange?: string }>({
      query: ({ timeRange = '1h' }) => `/api/v1/monitoring/system?timeRange=${timeRange}`,
      providesTags: ['Monitoring'],
    }),

    // Get services status
    getServices: builder.query<MonitoringResponse<ServiceStatus[]>, void>({
      query: () => '/api/v1/monitoring/services',
      providesTags: ['Monitoring'],
    }),

    // Acknowledge alert
    acknowledgeAlert: builder.mutation<
      { success: boolean; message: string },
      { alertId: string; comment?: string }
    >({
      query: ({ alertId, comment }) => ({
        url: `/api/v1/monitoring/alerts/${alertId}/acknowledge`,
        method: 'POST',
        body: { comment },
      }),
      invalidatesTags: ['Monitoring'],
    }),

    // Silence alert
    silenceAlert: builder.mutation<
      { success: boolean; message: string },
      { alertId: string; duration?: string; comment?: string }
    >({
      query: ({ alertId, duration, comment }) => ({
        url: `/api/v1/monitoring/alerts/${alertId}/silence`,
        method: 'POST',
        body: { duration, comment },
      }),
      invalidatesTags: ['Monitoring'],
    }),

    // Response Time Analytics endpoints
    getResponseTimeOverview: builder.query<MonitoringResponse<any>, void>({
      query: () => '/api/v1/monitoring/response-time/overview',
      providesTags: ['Monitoring'],
    }),

    getResponseTimeEndpoints: builder.query<MonitoringResponse<any>, {
      service?: string;
      sla_tier?: string;
      page?: string;
      limit?: string;
      sort?: string;
      order?: string;
    }>({
      query: ({ service, sla_tier, page, limit, sort, order }) => {
        const params = new URLSearchParams();
        if (service) params.append('service', service);
        if (sla_tier) params.append('sla_tier', sla_tier);
        if (page) params.append('page', page);
        if (limit) params.append('limit', limit);
        if (sort) params.append('sort', sort);
        if (order) params.append('order', order);
        return `/api/v1/monitoring/response-time/endpoints?${params.toString()}`;
      },
      providesTags: ['Monitoring'],
    }),

    getResponseTimeTrends: builder.query<MonitoringResponse<any>, {
      timeframe?: string;
      service?: string;
      route?: string;
    }>({
      query: ({ timeframe, service, route }) => {
        const params = new URLSearchParams();
        if (timeframe) params.append('timeframe', timeframe);
        if (service) params.append('service', service);
        if (route) params.append('route', route);
        return `/api/v1/monitoring/response-time/trends?${params.toString()}`;
      },
      providesTags: ['Monitoring'],
    }),

    getResponseTimeViolations: builder.query<MonitoringResponse<any>, {
      timeframe?: string;
      sla_tier?: string;
      service?: string;
    }>({
      query: ({ timeframe, sla_tier, service }) => {
        const params = new URLSearchParams();
        if (timeframe) params.append('timeframe', timeframe);
        if (sla_tier) params.append('sla_tier', sla_tier);
        if (service) params.append('service', service);
        return `/api/v1/monitoring/response-time/violations?${params.toString()}`;
      },
      providesTags: ['Monitoring'],
    }),

    getResponseTimeBaselines: builder.query<MonitoringResponse<any>, {
      service?: string;
      route?: string;
      days?: string;
    }>({
      query: ({ service, route, days }) => {
        const params = new URLSearchParams();
        if (service) params.append('service', service);
        if (route) params.append('route', route);
        if (days) params.append('days', days);
        return `/api/v1/monitoring/response-time/baselines?${params.toString()}`;
      },
      providesTags: ['Monitoring'],
    }),

    getResponseTimeCompare: builder.query<MonitoringResponse<any>, {
      endpoints?: string;
      timeframe?: string;
      metric?: string;
    }>({
      query: ({ endpoints, timeframe, metric }) => {
        const params = new URLSearchParams();
        if (endpoints) params.append('endpoints', endpoints);
        if (timeframe) params.append('timeframe', timeframe);
        if (metric) params.append('metric', metric);
        return `/api/v1/monitoring/response-time/compare?${params.toString()}`;
      },
      providesTags: ['Monitoring'],
    }),
  }),
});

// Export hooks for using the endpoints
export const {
  useGetOverviewQuery,
  useGetPerformanceQuery,
  useGetDatabaseQuery,
  useGetAlertsQuery,
  useGetSystemQuery,
  useGetServicesQuery,
  useAcknowledgeAlertMutation,
  useSilenceAlertMutation,
  useGetResponseTimeOverviewQuery,
  useGetResponseTimeEndpointsQuery,
  useGetResponseTimeTrendsQuery,
  useGetResponseTimeViolationsQuery,
  useGetResponseTimeBaselinesQuery,
  useGetResponseTimeCompareQuery,
} = monitoringApi;

// Create a simple monitoring service class for non-RTK usage
export class MonitoringService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  private async fetch(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getResponseTimeOverview() {
    return this.fetch('/api/v1/monitoring/response-time/overview');
  }

  async getResponseTimeEndpoints(params?: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetch(`/api/v1/monitoring/response-time/endpoints?${queryString}`);
  }

  async getResponseTimeTrends(params?: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetch(`/api/v1/monitoring/response-time/trends?${queryString}`);
  }

  async getResponseTimeViolations(params?: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetch(`/api/v1/monitoring/response-time/violations?${queryString}`);
  }

  async getResponseTimeBaselines(params?: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetch(`/api/v1/monitoring/response-time/baselines?${queryString}`);
  }

  async getResponseTimeCompare(params?: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.fetch(`/api/v1/monitoring/response-time/compare?${queryString}`);
  }
}

export const monitoringService = new MonitoringService();