# Logging Infrastructure Documentation

## Overview

Smart AI Hub implements a centralized logging infrastructure using the Loki stack (Loki, Promtail, Grafana) for efficient log aggregation, storage, and analysis across all microservices.

## Architecture

### Components

1. **Loki**: Log aggregation system that stores and indexes logs
2. **Promtail**: Log collection agent that sends logs to Loki
3. **Grafana**: Visualization and analysis dashboard
4. **Alertmanager**: Alert routing and notification system

### Data Flow

```
Services → Log Files → Promtail → Loki → Grafana
                          ↓
                      Alertmanager
```

## Infrastructure Details

### Loki Configuration

- **Retention**: 30 days
- **Storage**: Filesystem-based
- **Indexing**: Boltdb-shipper
- **Replication Factor**: 1 (can be increased for HA)
- **Ingestion Rate**: 16MB/s
- **Query Performance**: <5s for typical queries

### Promtail Configuration

- **Sources**: File logs, Docker container logs, system logs
- **Parsing**: JSON and logfmt parsing
- **Labeling**: Service, level, userId, requestId
- **Scraping Interval**: 5 seconds for Docker containers
- **Position Tracking**: Persistent position storage

### Grafana Configuration

- **Datasource**: Loki
- **Dashboards**: Logs Overview, Service-specific dashboards
- **Refresh Rate**: 30 seconds
- **Authentication**: Basic auth (admin/admin123)

## Deployment

### Prerequisites

- Docker and Docker Compose
- Sufficient disk space (2GB/day expected)
- Network access between containers

### Quick Start

1. Navigate to the logging directory:

   ```bash
   cd logging
   ```

2. Start the logging stack:

   ```bash
   docker-compose -f docker-compose.logging.yml up -d
   ```

3. Verify services are running:

   ```bash
   docker-compose -f docker-compose.logging.yml ps
   ```

4. Access Grafana:
   - URL: http://localhost:3000
   - Username: admin
   - Password: admin123

### Service Endpoints

| Service      | Port | Endpoint              | Description |
| ------------ | ---- | --------------------- | ----------- |
| Loki         | 3100 | http://localhost:3100 | Log API     |
| Promtail     | 9080 | http://localhost:9080 | Metrics API |
| Grafana      | 3000 | http://localhost:3000 | Dashboard   |
| Alertmanager | 9093 | http://localhost:9093 | Alert UI    |

## Configuration

### Loki Configuration (`loki-config.yml`)

Key settings:

- 30-day retention policy
- Filesystem storage
- Ingestion rate limiting
- Rule evaluation for alerting

### Promtail Configuration (`promtail-config.yml`)

Key settings:

- Multiple scrape configs for different services
- JSON and logfmt parsing
- Label extraction for efficient querying
- Docker container discovery

### Grafana Configuration

- Automatic datasource provisioning
- Dashboard auto-loading
- User management
- Plugin installation

## Log Sources

### Application Logs

All services write logs to:

- Combined logs: `/var/log/{service}/combined-YYYY-MM-DD.log`
- Error logs: `/var/log/{service}/error-YYYY-MM-DD.log`

### System Logs

- System logs: `/var/log/syslog`, `/var/log/messages`
- Docker logs: Container stdout/stderr
- Application logs: Service-specific log files

### Log Format

All application logs use JSON format:

```json
{
  "timestamp": "2023-10-15T09:30:00.000Z",
  "level": "info",
  "service": "auth-service",
  "message": "User login successful",
  "userId": "user123",
  "requestId": "req_abc123",
  "duration": 150
}
```

## Monitoring and Alerting

### Alert Rules

Pre-configured alerts for:

- High error rate (>5%)
- No logs received (5 minutes)
- Database errors
- Authentication failures
- Slow requests (>1s)
- Service restarts

### Alert Routing

- Critical alerts: admin@smarthub.ai
- Warning alerts: ops@smarthub.ai
- Webhook notifications to webhook-service

### Dashboards

1. **Logs Overview**: System-wide log metrics and recent errors
2. **Service Logs**: Detailed service-specific analysis
3. **Performance**: Request duration and throughput metrics
4. **Security**: Authentication and authorization events

## Performance

### Requirements

- **Log Ingestion**: <10s latency
- **Query Response**: <5s for typical queries
- **Throughput**: 1000+ logs/second
- **Storage**: <2GB/day

### Optimization

- Log sampling for high-volume events
- Efficient label usage
- Query optimization
- Caching strategies

## Security

### Access Control

- Grafana authentication
- Role-based access control
- API authentication
- Network segmentation

### Data Protection

- No sensitive data in logs
- Encrypted transmission
- Secure storage
- Access logging

## Maintenance

### Daily Tasks

- Monitor log volume
- Check alert status
- Review storage usage
- Verify service health

### Weekly Tasks

- Review log retention
- Update alert rules
- Optimize queries
- Clean up old data

### Monthly Tasks

- Capacity planning
- Performance tuning
- Security audit
- Backup verification

## Troubleshooting

### Common Issues

#### Loki Not Receiving Logs

1. Check Promtail status: `docker logs promtail`
2. Verify Loki connectivity: `curl http://loki:3100/ready`
3. Check Promtail configuration
4. Review network connectivity

#### Slow Query Performance

1. Optimize LogQL queries
2. Check Loki resource usage
3. Review label usage
4. Consider query time range

#### High Memory Usage

1. Monitor Loki memory usage
2. Check query patterns
3. Review retention settings
4. Scale resources if needed

#### Missing Logs

1. Verify service logging configuration
2. Check Promtail scrape configs
3. Review log file permissions
4. Validate log format

### Debug Commands

```bash
# Check container status
docker-compose -f docker-compose.logging.yml ps

# View service logs
docker logs loki
docker logs promtail
docker logs grafana

# Test Loki API
curl http://localhost:3100/ready
curl http://localhost:3100/loki/api/v1/labels

# Test Promtail API
curl http://localhost:9080/targets
curl http://localhost:9080/metrics
```

## Scaling

### Horizontal Scaling

- Multiple Loki instances (read/write separation)
- Promtail clusters
- Grafana HA setup
- Load balancing

### Vertical Scaling

- Increase memory allocation
- Add CPU resources
- Expand storage capacity
- Optimize configuration

## Backup and Recovery

### Backup Strategy

- Loki data backup
- Configuration backup
- Grafana dashboard backup
- Alert rules backup

### Recovery Procedures

1. Stop all services
2. Restore data from backup
3. Verify configuration
4. Restart services
5. Validate functionality

## Integration

### Service Integration

Services integrate with logging by:

1. Using shared logger library
2. Configuring log output location
3. Implementing structured logging
4. Adding correlation IDs

### External Systems

- Monitoring systems (Prometheus)
- Alerting platforms (PagerDuty)
- SIEM systems
- Log analysis tools

## Best Practices

### Log Design

- Use structured logging
- Include relevant context
- Avoid sensitive data
- Use appropriate log levels

### Query Optimization

- Use specific time ranges
- Filter early in queries
- Use efficient labels
- Limit result sets

### Operations

- Monitor log volume
- Set up appropriate alerts
- Regular maintenance
- Performance tuning

## Future Enhancements

### Planned Features

- Log-based metrics
- Machine learning for anomaly detection
- Advanced correlation
- Automated remediation

### Technology Updates

- Latest Loki versions
- Enhanced Grafana features
- Improved storage backends
- Better performance

## References

- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Promtail Documentation](https://grafana.com/docs/loki/latest/clients/promtail/)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [LogQL Documentation](https://grafana.com/docs/loki/latest/logql/)
