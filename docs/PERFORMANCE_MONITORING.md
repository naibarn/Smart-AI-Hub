# Performance Monitoring System Documentation

## Overview

The Smart AI Hub Performance Monitoring System provides comprehensive monitoring capabilities for all services, infrastructure components, and application performance metrics. This system includes real-time monitoring, alerting, visualization, and reporting features designed to ensure optimal system performance and reliability.

## Architecture

### Components

1. **Monitoring Library** (`packages/shared/monitoring/`)
   - Prometheus metrics collection
   - Middleware for automatic metrics tracking
   - Type definitions and utilities

2. **Backend Integration**
   - All 5 services expose `/metrics` endpoints
   - Prometheus scraping configuration
   - Alertmanager integration

3. **Frontend Dashboard**
   - React-based monitoring interface
   - Real-time data visualization
   - Role-based access control

4. **Visualization**
   - Grafana dashboards
   - Custom charts and components
   - Interactive data exploration

## Services Monitoring

### Monitored Services

1. **Auth Service** (`auth-service:3001`)
   - Authentication metrics
   - JWT token operations
   - User session management

2. **Core Service** (`core-service:3002`)
   - API performance
   - Business logic metrics
   - Database operations

3. **MCP Server** (`mcp-server:3003`)
   - Provider connections
   - AI model interactions
   - Response times

4. **Notification Service** (`notification-service:3004`)
   - Email delivery metrics
   - Queue processing
   - Template performance

5. **Webhook Service** (`webhook-service:3005`)
   - Webhook delivery rates
   - Retry attempts
   - Response times

### Metrics Collected

#### System Metrics

- CPU usage
- Memory consumption
- Disk I/O
- Network traffic
- Uptime

#### Application Metrics

- Request rates
- Response times
- Error rates
- Active connections
- Queue sizes

#### Business Metrics

- User activity
- API usage patterns
- Resource consumption
- Performance trends

## Frontend Monitoring Dashboard

### Access Control

The monitoring dashboard is protected by role-based access control (RBAC):

- **Required Roles**: Admin, Manager
- **Required Permissions**: `monitoring:read`, `system:read`

### Dashboard Pages

#### 1. Main Dashboard (`/admin/monitoring`)

- System health overview
- Key performance indicators
- Service status summary
- Active alerts
- Quick navigation

#### 2. Performance Analysis (`/admin/monitoring/performance`)

- Response time trends
- Throughput metrics
- Error rate analysis
- Top API endpoints
- Performance bottlenecks

#### 3. Database Monitoring (`/admin/monitoring/database`)

- Query performance
- Connection management
- Slow query analysis
- Index usage
- Database health

#### 4. Alert Management (`/admin/monitoring/alerts`)

- Active alerts list
- Alert history
- Alert acknowledgment
- Alert silencing
- Severity filtering

#### 5. System Resources (`/admin/monitoring/system`)

- CPU usage trends
- Memory consumption
- Disk utilization
- Network activity
- Resource optimization

#### 6. Grafana Integration (`/admin/monitoring/grafana`)

- Embedded Grafana dashboards
- Advanced visualizations
- Custom time ranges
- Full-screen mode
- Export capabilities

## Alerting System

### Alert Types

1. **ServiceDown**
   - Triggered when a service becomes unavailable
   - Severity: Critical
   - Notification: Immediate

2. **HighErrorRate**
   - Error rate exceeds 5%
   - Severity: Warning/Critical
   - Notification: Email

3. **HighResponseTime**
   - Response time exceeds 1 second
   - Severity: Warning
   - Notification: Email

4. **SlowDatabaseQueries**
   - Query execution time exceeds 2 seconds
   - Severity: Warning
   - Notification: Email

5. **HighMemoryUsage**
   - Memory usage exceeds 80%
   - Severity: Critical
   - Notification: Email

6. **HighCPUUsage**
   - CPU usage exceeds 80%
   - Severity: Critical
   - Notification: Email

7. **UnusualTraffic**
   - Traffic patterns deviate from baseline
   - Severity: Warning
   - Notification: Email

### Alert Configuration

Alerts are configured in `monitoring/rules/smart-ai-hub.yml` and include:

- Evaluation intervals
- Threshold values
- Severity levels
- Notification channels
- Silence periods

## Installation and Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Prometheus server
- Grafana instance
- SMTP server for email notifications

### Environment Variables

```bash
# Monitoring Configuration
VITE_GRAFANA_URL=http://localhost:3001
VITE_API_URL=http://localhost:3000

# Alertmanager Configuration
ALERTMANAGER_SMTP_HOST=smtp.example.com
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=alerts@example.com
ALERTMANAGER_SMTP_PASSWORD=your-password
```

### Setup Steps

1. **Start Monitoring Stack**

   ```bash
   cd monitoring
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. **Configure Prometheus**
   - Edit `monitoring/prometheus.yml`
   - Update service endpoints
   - Restart Prometheus

3. **Configure Grafana**
   - Import dashboards from `monitoring/grafana/dashboards/`
   - Set up data sources
   - Configure alerts

4. **Configure Alertmanager**
   - Edit `monitoring/alertmanager.yml`
   - Set up email templates
   - Configure routing rules

## Usage Guide

### Accessing the Dashboard

1. Log in to the Smart AI Hub
2. Navigate to `/admin/monitoring`
3. Ensure you have the required permissions

### Monitoring Workflow

1. **Daily Checks**
   - Review system health overview
   - Check active alerts
   - Monitor resource usage trends

2. **Performance Analysis**
   - Analyze response time patterns
   - Identify bottlenecks
   - Track error rates

3. **Alert Management**
   - Acknowledge active alerts
   - Investigate root causes
   - Implement fixes

4. **Resource Optimization**
   - Monitor resource utilization
   - Identify optimization opportunities
   - Plan capacity upgrades

### Custom Dashboards

Create custom dashboards in Grafana:

1. Log in to Grafana
2. Click "Create Dashboard"
3. Add panels with Prometheus queries
4. Configure visualization options
5. Save and share

## Troubleshooting

### Common Issues

#### Metrics Not Available

- Check Prometheus configuration
- Verify service endpoints are accessible
- Confirm metrics are being exported

#### Alerts Not Firing

- Review alert rule configuration
- Check Alertmanager logs
- Verify notification settings

#### Dashboard Not Loading

- Confirm API connectivity
- Check browser console for errors
- Verify authentication tokens

#### High Resource Usage

- Identify resource-intensive processes
- Check for memory leaks
- Optimize database queries

### Debug Commands

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check service metrics
curl http://localhost:3001/metrics

# Check Alertmanager status
curl http://localhost:9093/api/v1/status

# Test Grafana API
curl -u admin:admin http://localhost:3001/api/health
```

## Performance Optimization

### Best Practices

1. **Metric Collection**
   - Use appropriate metric types
   - Avoid high cardinality labels
   - Set reasonable scraping intervals

2. **Alert Tuning**
   - Set meaningful thresholds
   - Avoid alert fatigue
   - Use proper severity levels

3. **Dashboard Design**
   - Limit panel count per dashboard
   - Use appropriate visualization types
   - Optimize query performance

4. **Resource Management**
   - Monitor resource usage
   - Set retention policies
   - Archive historical data

### Monitoring Metrics

Monitor the monitoring system itself:

- Prometheus performance
- Grafana resource usage
- Alert delivery rates
- Dashboard load times

## Security Considerations

### Access Control

- Implement strong authentication
- Use role-based permissions
- Regularly review access logs
- Secure API endpoints

### Data Protection

- Encrypt sensitive metrics
- Secure communication channels
- Implement data retention policies
- Backup configuration files

### Network Security

- Restrict access to monitoring ports
- Use firewall rules
- Implement VPN access
- Monitor network traffic

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review alert rules
   - Check system performance
   - Update dashboards

2. **Monthly**
   - Analyze trends
   - Optimize queries
   - Review documentation

3. **Quarterly**
   - Capacity planning
   - Security audit
   - Performance tuning

### Backup and Recovery

- Backup Prometheus data
- Export Grafana dashboards
- Save configuration files
- Document recovery procedures

## API Reference

### Monitoring API Endpoints

#### Overview Metrics

```
GET /api/v1/monitoring/overview
```

#### Performance Metrics

```
GET /api/v1/monitoring/performance?timeRange=1h
```

#### Database Metrics

```
GET /api/v1/monitoring/database?timeRange=1h
```

#### Alerts

```
GET /api/v1/monitoring/alerts?status=active&severity=critical
```

#### System Metrics

```
GET /api/v1/monitoring/system?timeRange=1h
```

#### Services Status

```
GET /api/v1/monitoring/services
```

### Response Format

```json
{
  "success": true,
  "data": {
    // Metrics data
  },
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Conclusion

The Performance Monitoring System provides comprehensive visibility into the Smart AI Hub infrastructure and applications. By following this documentation and implementing the recommended practices, you can ensure optimal system performance, quick issue detection, and efficient problem resolution.

For additional support or questions, refer to the troubleshooting section or contact the monitoring team.
