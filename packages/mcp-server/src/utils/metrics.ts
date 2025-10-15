/**
 * Simple Metrics Implementation for MCP Server
 * Basic metrics collection without external dependencies
 */

export interface SimpleMetrics {
  incrementHttpRequests(method: string, route: string, statusCode: number): void;
  recordHttpRequestDuration(method: string, route: string, statusCode: number, duration: number): void;
  getMetricsAsText(): Promise<string>;
}

export class SimplePrometheusMetrics implements SimpleMetrics {
  private httpRequests: Map<string, number> = new Map();
  private httpRequestDurations: Map<string, number[]> = new Map();

  incrementHttpRequests(method: string, route: string, statusCode: number): void {
    const key = `${method}_${route}_${statusCode}`;
    const current = this.httpRequests.get(key) || 0;
    this.httpRequests.set(key, current + 1);
  }

  recordHttpRequestDuration(method: string, route: string, statusCode: number, duration: number): void {
    const key = `${method}_${route}_${statusCode}`;
    const durations = this.httpRequestDurations.get(key) || [];
    durations.push(duration);
    this.httpRequestDurations.set(key, durations);
  }

  async getMetricsAsText(): Promise<string> {
    let output = '# HELP mcp_server_http_requests_total Total number of HTTP requests\n';
    output += '# TYPE mcp_server_http_requests_total counter\n';
    
    for (const [key, count] of this.httpRequests.entries()) {
      const [method, route, statusCode] = key.split('_');
      output += `mcp_server_http_requests_total{method="${method}",route="${route}",status_code="${statusCode}"} ${count}\n`;
    }

    output += '\n# HELP mcp_server_http_request_duration_seconds Duration of HTTP requests in seconds\n';
    output += '# TYPE mcp_server_http_request_duration_seconds histogram\n';
    
    for (const [key, durations] of this.httpRequestDurations.entries()) {
      const [method, route, statusCode] = key.split('_');
      const sum = durations.reduce((a, b) => a + b, 0);
      const count = durations.length;
      const avg = sum / count;
      
      output += `mcp_server_http_request_duration_seconds_sum{method="${method}",route="${route}",status_code="${statusCode}"} ${sum}\n`;
      output += `mcp_server_http_request_duration_seconds_count{method="${method}",route="${route}",status_code="${statusCode}"} ${count}\n`;
    }

    return output;
  }
}

export function initializeMetrics(config: any): SimpleMetrics {
  return new SimplePrometheusMetrics();
}