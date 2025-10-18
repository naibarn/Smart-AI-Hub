# Smart AI Hub Logging Infrastructure

This directory contains the complete centralized logging infrastructure for Smart AI Hub using the Loki stack.

## Quick Start

1. **Deploy the logging stack:**

   ```bash
   chmod +x deploy-logging.sh
   ./deploy-logging.sh
   ```

2. **Test the deployment:**

   ```bash
   chmod +x test-logging.sh
   ./test-logging.sh
   ```

3. **Access Grafana:**
   - URL: http://localhost:3000
   - Username: admin
   - Password: admin123

## Architecture

```
Services → Log Files → Promtail → Loki → Grafana
                          ↓
                      Alertmanager
```

## Components

### Loki

- **Port**: 3100
- **Purpose**: Log aggregation and storage
- **Retention**: 30 days
- **Storage**: Filesystem-based

### Promtail

- **Port**: 9080
- **Purpose**: Log collection and processing
- **Sources**: File logs, Docker containers, system logs

### Grafana

- **Port**: 3000
- **Purpose**: Log visualization and analysis
- **Dashboards**: Pre-configured for Smart AI Hub

### Alertmanager

- **Port**: 9093
- **Purpose**: Alert routing and notification
- **Integration**: Email and webhook notifications

## Configuration Files

| File                         | Description                      |
| ---------------------------- | -------------------------------- |
| `loki-config.yml`            | Loki server configuration        |
| `promtail-config.yml`        | Promtail scrape configurations   |
| `docker-compose.logging.yml` | Docker Compose for logging stack |
| `alertmanager.yml`           | Alert routing configuration      |
| `alert-rules.yml`            | Loki alerting rules              |

## Grafana Dashboards

### Logs Overview

- Log volume by service
- Error rate monitoring
- Log distribution
- Recent error logs

### Service Logs

- Service-specific log analysis
- Request duration metrics
- HTTP status code distribution
- Error and slow request logs

## Log Sources

### Application Logs

All services write structured JSON logs to:

- Combined logs: `/var/log/{service}/combined-YYYY-MM-DD.log`
- Error logs: `/var/log/{service}/error-YYYY-MM-DD.log`

### System Logs

- System logs: `/var/log/syslog`
- Docker logs: Container stdout/stderr
- Nginx logs: `/var/log/nginx/`

## Alerting

Pre-configured alerts for:

- High error rate (>5%)
- No logs received (5 minutes)
- Database errors
- Authentication failures
- Slow requests (>1s)
- Service restarts

## Scripts

### deploy-logging.sh

Automated deployment script that:

- Creates necessary directories
- Sets up Docker network
- Deploys all logging services
- Verifies deployment
- Shows access information

### test-logging.sh

Validation script that:

- Tests service connectivity
- Creates test logs
- Validates log ingestion
- Tests log querying
- Generates test report

## Documentation

- [LOGGING_INFRASTRUCTURE.md](./LOGGING_INFRASTRUCTURE.md) - Complete infrastructure documentation
- [LOGGING_STANDARDS.md](./LOGGING_STANDARDS.md) - Logging standards and best practices
- [LOGQL_QUERIES.md](./LOGQL_QUERIES.md) - Common LogQL queries and examples

## Integration with Services

### 1. Update Service Dependencies

Add the shared logger to each service:

```bash
cd packages/{service-name}
npm install @smart-ai-hub/shared-logger
```

### 2. Configure Logging

```typescript
import { createLogger } from '@smart-ai-hub/shared-logger';

const logger = createLogger({
  service: 'your-service-name',
  level: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || '/var/log/your-service-name',
});
```

### 3. Add Middleware

```typescript
import {
  createRequestLoggingMiddleware,
  createErrorLoggingMiddleware,
} from '@smart-ai-hub/shared-logger';

app.use(createRequestLoggingMiddleware(logger));
app.use(createErrorLoggingMiddleware(logger));
```

## Log Format

All application logs use structured JSON format:

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

## Performance Requirements

- **Log Ingestion**: <10s latency
- **Query Response**: <5s for typical queries
- **Throughput**: 1000+ logs/second
- **Storage**: <2GB/day
- **Retention**: 30 days

## Maintenance

### Daily

- Monitor log volume
- Check alert status
- Verify service health

### Weekly

- Review log retention
- Update alert rules
- Optimize queries

### Monthly

- Capacity planning
- Performance tuning
- Security audit

## Troubleshooting

### Common Issues

1. **Loki not receiving logs**

   ```bash
   docker logs promtail
   curl http://localhost:3100/ready
   ```

2. **Slow query performance**
   - Optimize LogQL queries
   - Check Loki resource usage
   - Review label usage

3. **Missing logs**
   - Verify service logging configuration
   - Check Promtail scrape configs
   - Review log file permissions

### Useful Commands

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

# Stop services
docker-compose -f docker-compose.logging.yml down

# Restart services
docker-compose -f docker-compose.logging.yml restart
```

## Security

- Grafana authentication enabled
- No sensitive data in logs
- Encrypted transmission
- Access logging
- Network segmentation

## Scaling

### Horizontal Scaling

- Multiple Loki instances (read/write separation)
- Promtail clusters
- Grafana HA setup

### Vertical Scaling

- Increase memory allocation
- Add CPU resources
- Expand storage capacity

## Backup and Recovery

### Backup Strategy

- Loki data backup
- Configuration backup
- Grafana dashboard backup

### Recovery Procedures

1. Stop all services
2. Restore data from backup
3. Verify configuration
4. Restart services
5. Validate functionality

## Support

For issues and questions:

1. Check the documentation
2. Review troubleshooting section
3. Check service logs
4. Run test script
5. Contact the infrastructure team

## License

This logging infrastructure is part of the Smart AI Hub project and follows the same license terms.
