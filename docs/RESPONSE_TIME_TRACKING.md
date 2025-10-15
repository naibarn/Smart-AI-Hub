# Response Time Tracking & SLA Monitoring Guide

## Overview

The Smart AI Hub platform includes comprehensive response time tracking and Service Level Agreement (SLA) monitoring to ensure optimal performance and reliability of all services. This system provides detailed insights into endpoint performance, SLA compliance, and helps identify performance bottlenecks before they impact users.

## Architecture

The response time tracking system consists of several components working together:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│   Auth Service  │────│  Core Service   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Monitoring Middleware  │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐    ┌─────────▼─────────┐    ┌────────▼────────┐
│   Prometheus    │    │   Performance    │    │   Grafana       │
│   Metrics       │    │   Baselines      │    │   Dashboard     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## SLA Configuration

### SLA Tiers

The system defines four SLA tiers with different response time thresholds:

| SLA Tier | Threshold (P95) | Description | Example Endpoints |
|----------|----------------|-------------|-------------------|
| Critical | < 500ms | Mission-critical operations that must be fast | auth, mcp chat |
| High | < 1000ms | Important user-facing features | users, credits |
| Medium | < 2000ms | Analytics and monitoring features | analytics, monitoring |
| Low | < 5000ms | Background processing and reports | webhooks, reports |

### Configuration File

SLA configuration is stored in `config/sla-config.json`:

```json
{
  "tiers": {
    "critical": {
      "threshold": 500,
      "description": "Mission-critical operations",
      "alertDuration": "5m",
      "endpoints": [
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/mcp/chat"
      ]
    },
    "high": {
      "threshold": 1000,
      "description": "Important user-facing features",
      "alertDuration": "10m",
      "endpoints": [
        "/api/v1/users/profile",
        "/api/v1/credits/balance",
        "/api/v1/analytics/usage"
      ]
    },
    "medium": {
      "threshold": 2000,
      "description": "Analytics and monitoring features",
      "alertDuration": "15m",
      "endpoints": [
        "/api/v1/analytics/reports",
        "/api/v1/monitoring/overview"
      ]
    },
    "low": {
      "threshold": 5000,
      "description": "Background processing and reports",
      "alertDuration": "30m",
      "endpoints": [
        "/api/v1/webhooks/process",
        "/api/v1/reports/generate"
      ]
    }
  },
  "defaultTier": "medium",
  "baselineCalculation": {
    "schedule": "0 2 * * *",
    "retentionDays": 90,
    "percentiles": [50, 90, 95, 99]
  }
}
```

## Monitoring Middleware

### Implementation

The monitoring middleware is implemented in `packages/shared/monitoring/middleware.ts` and provides:

- Request timing from start to finish
- SLA tier determination based on endpoint patterns
- Response time header injection (`X-Response-Time`)
- Detailed metrics recording with proper labels
- Slow request logging for SLA violations

### Metrics Collection

The middleware collects the following metrics:

```typescript
// Histogram for response time distribution
http_response_time_milliseconds_bucket{
  service="auth-service",
  route="/api/v1/auth/login",
  method="POST",
  status_code="200",
  sla_tier="critical"
}

// Counter for slow requests
slow_requests_total{
  service="auth-service",
  route="/api/v1/auth/login",
  sla_tier="critical"
}

// Gauge for SLA compliance
sla_compliance{
  service="auth-service",
  route="/api/v1/auth/login",
  sla_tier="critical"
}
```

### Response Time Header

All responses include an `X-Response-Time` header:

```
HTTP/1.1 200 OK
X-Response-Time: 245ms
Content-Type: application/json
```

## Performance Baselines

### Baseline Calculation

The system calculates daily performance baselines for each endpoint:

- **P50**: Median response time
- **P90**: 90th percentile response time
- **P95**: 95th percentile response time
- **P99**: 99th percentile response time
- **Average**: Mean response time

### Database Schema

Baselines are stored in the `performance_baselines` table:

```sql
CREATE TABLE performance_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  route VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  p50_ms INTEGER NOT NULL,
  p90_ms INTEGER NOT NULL,
  p95_ms INTEGER NOT NULL,
  p99_ms INTEGER NOT NULL,
  avg_ms INTEGER NOT NULL,
  request_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(service, route, method, date)
);
```

### Baseline Calculation Job

The baseline calculation job runs daily at 2 AM and is implemented in:
`packages/analytics-service/src/jobs/calculate-baselines.job.ts`

## SLA Alerts

### Alert Rules

SLA alerts are configured in `monitoring/sla-alert-rules.yml`:

```yaml
groups:
  - name: smart-ai-hub-sla
    rules:
      - alert: CriticalEndpointSLAViolation
        expr: histogram_quantile(0.95, sum(rate(http_response_time_milliseconds_bucket{sla_tier="critical"}[5m])) by (le, service, route)) > 500
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Critical endpoint SLA violation"
          description: "{{ $labels.service }} {{ $labels.route }} has P95 response time of {{ $value }}ms, exceeding 500ms threshold"

      - alert: HighPriorityEndpointSLAViolation
        expr: histogram_quantile(0.95, sum(rate(http_response_time_milliseconds_bucket{sla_tier="high"}[5m])) by (le, service, route)) > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High priority endpoint SLA violation"
          description: "{{ $labels.service }} {{ $labels.route }} has P95 response time of {{ $value }}ms, exceeding 1000ms threshold"

      - alert: FrequentSlowRequests
        expr: rate(slow_requests_total[5m]) / rate(http_response_time_milliseconds_count[5m]) > 0.1
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Frequent slow requests detected"
          description: "{{ $labels.service }} has {{ $value | humanizePercentage }} of requests exceeding SLA thresholds"

      - alert: ResponseTimeDegradation
        expr: histogram_quantile(0.95, sum(rate(http_response_time_milliseconds_bucket[5m])) by (le, service, route)) > 1.5 * performance_baseline_p95_ms
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Response time degradation detected"
          description: "{{ $labels.service }} {{ $labels.route }} response time is 50% higher than baseline"
```

## Response Time Analytics UI

### Dashboard Access

The Response Time Analytics dashboard is available at:
`/admin/monitoring/response-time`

### Dashboard Sections

1. **Overview**
   - Average response time across all services
   - SLA compliance percentage
   - Slowest endpoints list
   - Active SLA violations count

2. **Endpoint Analysis**
   - Filterable table with endpoint metrics
   - Sortable columns for different metrics
   - Search functionality
   - Export capabilities

3. **Response Time Trends**
   - Line chart showing P50, P90, P95, P99 percentiles
   - Time range selection
   - Service and endpoint filtering
   - Comparison with baselines

4. **SLA Violations**
   - List of recent SLA violations
   - Violation details and context
   - Trend visualization
   - Filter by severity and service

5. **Performance Comparison**
   - Compare endpoints side by side
   - Compare time periods
   - Compare services
   - Visual performance differences

### UI Components

The dashboard is built with the following React components:

- `EndpointTable` - Filterable, sortable table with endpoint metrics
- `TrendChart` - Time-series chart for response time trends
- `ViolationsList` - Expandable list of SLA violations
- `ComparisonView` - Tool for comparing performance metrics

## API Endpoints

The following API endpoints are available for response time analytics:

### Overview Metrics
```
GET /api/v1/monitoring/response-time/overview
```

Returns overall metrics including average response time, SLA compliance, and top violators.

### Endpoint Metrics
```
GET /api/v1/monitoring/response-time/endpoints
```

Returns detailed metrics for each endpoint with filtering and pagination options.

### Historical Trends
```
GET /api/v1/monitoring/response-time/trends
```

Returns historical trend data for response time percentiles.

### SLA Violations
```
GET /api/v1/monitoring/response-time/violations
```

Returns list of SLA violations with details and filtering options.

### Performance Baselines
```
GET /api/v1/monitoring/response-time/baselines
```

Returns performance baselines for comparison with current metrics.

### Comparative Analysis
```
GET /api/v1/monitoring/response-time/compare
```

Returns comparative data between endpoints, services, or time periods.

## Grafana Dashboard

### Dashboard Access

The Grafana dashboard is available at:
`https://yourdomain.com:3001/d/smart-ai-hub-response-time`

### Dashboard Panels

1. **Response Time Percentiles**
   - P50, P90, P95, P99 response time trends
   - Filterable by service and endpoint

2. **P95 Response Time by SLA Tier**
   - Current P95 response times grouped by SLA tier
   - Visual indicator of SLA compliance

3. **Request Rate by Service**
   - Request rate trends for each service
   - Correlation with response times

4. **SLA Violations Rate**
   - Rate of SLA violations by tier
   - Alert status indicators

5. **SLA Compliance Rate**
   - Percentage of requests meeting SLA thresholds
   - Trend analysis

6. **Top 10 Busiest Endpoints**
   - Pie chart showing request distribution
   - Filterable by time range

7. **Top 5 Slowest Endpoints**
   - Ranking of slowest endpoints by P95 response time
   - SLA tier indicators

8. **Response Time Distribution**
   - Histogram showing response time distribution
   - Percentile markers

### Dashboard Configuration

The dashboard configuration is stored in:
`monitoring/grafana/dashboards/response-time-analysis.json`

## Environment Configuration

### Required Environment Variables

```bash
# Enable response time tracking
ENABLE_RESPONSE_TIME_TRACKING=true

# Default SLA tier for unclassified endpoints
DEFAULT_SLA_TIER=medium

# Baseline calculation schedule (cron format)
BASELINE_CALCULATION_SCHEDULE=0 2 * * *

# Retention period for performance data
PERFORMANCE_RETENTION_DAYS=90

# Prometheus configuration
PROMETHEUS_URL=http://prometheus:9090

# Grafana configuration
GRAFANA_URL=http://grafana:3001
GRAFANA_USERNAME=admin
GRAFANA_PASSWORD=admin123
```

## Best Practices

### Performance Optimization

1. **Optimize Slow Endpoints**
   - Identify endpoints with high P95 times
   - Implement caching where appropriate
   - Optimize database queries
   - Consider async processing for heavy operations

2. **Monitor Trends**
   - Watch for gradual performance degradation
   - Compare against baselines regularly
   - Investigate sudden spikes in response times

3. **SLA Management**
   - Review SLA thresholds regularly
   - Adjust based on user expectations
   - Consider seasonal traffic patterns

### Alert Management

1. **Fine-tune Alert Thresholds**
   - Reduce false positives
   - Adjust for known slow periods
   - Consider different thresholds for different times

2. **Establish Response Procedures**
   - Create playbooks for common issues
   - Define escalation paths
   - Document recovery procedures

3. **Regular Reviews**
   - Weekly alert effectiveness reviews
   - Monthly threshold adjustments
   - Quarterly SLA evaluations

### Data Retention

1. **Optimize Storage**
   - Regular cleanup of old metrics
   - Aggregate long-term data
   - Consider data archiving for historical analysis

2. **Performance Impact**
   - Monitor metrics collection overhead
   - Optimize Prometheus queries
   - Use appropriate sampling rates

## Troubleshooting

### Common Issues

#### Missing Response Time Headers

**Symptoms**: `X-Response-Time` header not present in responses

**Solutions**:
1. Verify monitoring middleware is enabled in all services
2. Check if `ENABLE_RESPONSE_TIME_TRACKING=true` is set
3. Restart services after configuration changes

#### SLA Alerts Not Firing

**Symptoms**: Expected alerts not being generated

**Solutions**:
1. Verify Prometheus alert rules are loaded
2. Check AlertManager configuration
3. Verify alert thresholds and durations
4. Check Prometheus query performance

#### Baseline Calculation Not Running

**Symptoms**: No baseline data available

**Solutions**:
1. Verify cron job is configured correctly
2. Check analytics service logs
3. Verify database connectivity
4. Check job execution logs

#### Dashboard Showing No Data

**Symptoms**: Grafana or UI dashboard empty

**Solutions**:
1. Verify Prometheus is collecting metrics
2. Check data source configuration in Grafana
3. Verify query syntax and time ranges
4. Check API endpoints are returning data

### Performance Issues

#### High Metrics Collection Overhead

**Solutions**:
1. Optimize Prometheus query performance
2. Use appropriate metric sampling
3. Consider metric aggregation
4. Review metric cardinality

#### Slow Dashboard Loading

**Solutions**:
1. Implement pagination for large datasets
2. Use appropriate caching strategies
3. Optimize database queries
4. Consider data pre-aggregation

## Implementation Checklist

- [ ] Configure SLA tiers in `config/sla-config.json`
- [ ] Deploy monitoring middleware to all services
- [ ] Set up SLA alert rules in Prometheus
- [ ] Configure baseline calculation job
- [ ] Import Grafana dashboard
- [ ] Verify response time headers are added
- [ ] Test SLA violation alerts
- [ ] Validate UI dashboard functionality
- [ ] Document alert response procedures
- [ ] Schedule regular performance reviews

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [SLA Best Practices](https://sre.google/resources/practices-and-processes/service-level-objectives/)
- [Performance Monitoring Guide](./PERFORMANCE_MONITORING.md)