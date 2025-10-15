# Smart AI Hub Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Smart AI Hub platform to a production environment. The deployment includes all necessary services, monitoring, security configurations, and operational procedures.

## Prerequisites

### Infrastructure Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Storage | 50 GB SSD | 100 GB SSD |
| Network | 1 Gbps | 10 Gbps |

### Software Requirements

- Docker (v20.x or later)
- Docker Compose (v2.x or later)
- OpenSSL (for SSL certificates)
- Git

### External Services

- Domain name (e.g., yourdomain.com)
- SSL certificates (Let's Encrypt or commercial)
- SMTP server for email notifications
- Cloud storage (AWS S3, Google Cloud Storage, etc.)

## Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   Nginx Proxy   │────│   Frontend      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
         ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
         │ API Gateway  │ │Auth Service │ │Core Service│
         └──────────────┘ └─────────────┘ └────────────┘
                 │               │               │
                 └───────────────┼───────────────┘
                                 │
                     ┌───────────▼───────────┐
                     │   Database & Cache    │
                     │  (PostgreSQL, Redis)  │
                     └───────────────────────┘
```

## Pre-Deployment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Smart-AI-Hub.git
cd Smart-AI-Hub
```

### 2. Configure Environment Variables

```bash
# Copy the production environment template
cp .env.production .env.local

# Edit the environment file with your actual values
nano .env.local
```

### 3. Generate SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to project directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/key.pem
```

#### Option B: Self-Signed (For Testing)

```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

### 4. Create Required Directories

```bash
# Create directories for logs and backups
mkdir -p logs/{api-gateway,auth-service,core-service,mcp-server,nginx}
mkdir -p backups
mkdir -p ssl
```

## Deployment Process

### 1. Automated Deployment

Use the provided deployment script for automated deployment:

```bash
# Make the script executable
chmod +x scripts/deploy-production.sh

# Run the deployment script
./scripts/deploy-production.sh
```

### 2. Manual Deployment

If you prefer manual deployment, follow these steps:

#### Step 1: Update Application Code

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production

# Build packages
npm run build
```

#### Step 2: Deploy Services

```bash
# Stop existing services
docker-compose -f docker-compose.prod.yml down

# Build new images
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

#### Step 3: Run Database Migrations

```bash
# Wait for database to be ready
sleep 30

# Run migrations
docker-compose -f docker-compose.prod.yml exec core-service npm run db:migrate
```

#### Step 4: Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check health endpoints
curl -f https://yourdomain.com/health
curl -f https://yourdomain.com/auth/health
curl -f https://yourdomain.com/core/health
curl -f https://yourdomain.com/mcp/health
```

## Performance Monitoring Setup

### 1. Deploy Monitoring Stack

```bash
# Navigate to monitoring directory
cd monitoring

# Deploy monitoring services
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Access Monitoring Dashboards

#### Monitoring Stack
- **Grafana**: https://yourdomain.com:3001 (admin/admin123)
- **Prometheus**: https://yourdomain.com:9090
- **AlertManager**: https://yourdomain.com:9093

#### Frontend Monitoring Dashboard
- **Main Dashboard**: https://yourdomain.com/admin/monitoring
- **Performance Analysis**: https://yourdomain.com/admin/monitoring/performance
- **Database Monitoring**: https://yourdomain.com/admin/monitoring/database
- **Alert Management**: https://yourdomain.com/admin/monitoring/alerts
- **System Resources**: https://yourdomain.com/admin/monitoring/system
- **Grafana Integration**: https://yourdomain.com/admin/monitoring/grafana

### 3. Configure Grafana Dashboards

1. Log in to Grafana
2. Add Prometheus as a data source
3. Import pre-configured dashboards from `monitoring/grafana/dashboards`

### 4. Configure Monitoring Environment Variables

Add the following to your `.env.local` file:

```bash
# Monitoring Configuration
VITE_GRAFANA_URL=https://yourdomain.com:3001
VITE_API_URL=https://yourdomain.com

# Alertmanager Configuration
ALERTMANAGER_SMTP_HOST=smtp.example.com
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=alerts@example.com
ALERTMANAGER_SMTP_PASSWORD=your-password
ALERTMANAGER_SMTP_FROM=Smart AI Hub Alerts <alerts@example.com>
ALERTMANAGER_SMTP_TO=admin@example.com
```

### 5. Verify Monitoring Integration

```bash
# Check metrics endpoints
curl https://yourdomain.com/api/metrics
curl https://yourdomain.com/auth/metrics
curl https://yourdomain.com/core/metrics
curl https://yourdomain.com/mcp/metrics
curl https://yourdomain.com/webhook/metrics

# Check monitoring API endpoints
curl -H "Authorization: Bearer <token>" https://yourdomain.com/api/v1/monitoring/overview
curl -H "Authorization: Bearer <token>" https://yourdomain.com/api/v1/monitoring/services
```

### 6. Configure Access Control

The monitoring dashboard requires specific roles and permissions:

- **Required Roles**: Admin, Manager
- **Required Permissions**: `monitoring:read`, `system:read`

To grant monitoring access to users:

```sql
-- Assign admin role for full monitoring access
INSERT INTO user_roles (user_id, role_id) VALUES ('user-id', 'admin-role-id');

-- Assign manager role for monitoring access
INSERT INTO user_roles (user_id, role_id) VALUES ('user-id', 'manager-role-id');
```

### 7. Monitor Key Metrics

#### System Health Indicators
- Service uptime (>99.9% target)
- Response time (<500ms average)
- Error rate (<1% target)
- Resource utilization (<80% threshold)

#### Alert Thresholds
- **ServiceDown**: Immediate notification
- **HighErrorRate**: >5% error rate
- **HighResponseTime**: >1s average response time
- **SlowDatabaseQueries**: >2s query time
- **HighMemoryUsage**: >80% memory usage
- **HighCPUUsage**: >80% CPU usage
- **UnusualTraffic**: 2x baseline traffic

### 8. Monitoring Best Practices

1. **Daily Monitoring**
   - Review system health overview
   - Check active alerts
   - Monitor resource usage trends

2. **Weekly Analysis**
   - Analyze performance patterns
   - Review alert effectiveness
   - Optimize dashboards

3. **Monthly Reviews**
   - Evaluate system capacity
   - Update alert thresholds
   - Plan infrastructure upgrades

For comprehensive monitoring documentation, refer to `docs/PERFORMANCE_MONITORING.md`.

## Response Time Tracking & SLA Monitoring

The Smart AI Hub includes comprehensive response time tracking and SLA (Service Level Agreement) monitoring to ensure optimal performance and reliability of all services.

### 1. SLA Configuration

SLA tiers are defined in `config/sla-config.json` with the following thresholds:

| SLA Tier | Threshold (P95) | Description | Example Endpoints |
|----------|----------------|-------------|-------------------|
| Critical | < 500ms | Mission-critical operations | auth, mcp chat |
| High | < 1000ms | Important user-facing features | users, credits |
| Medium | < 2000ms | Analytics and monitoring | analytics, monitoring |
| Low | < 5000ms | Background processing | webhooks, reports |

### 2. Response Time Metrics

The system tracks the following metrics for each endpoint:

- **Percentiles**: P50, P90, P95, P99 response times
- **Service-level metrics**: Average response time per service
- **Endpoint-level metrics**: Detailed metrics per endpoint
- **Status code tracking**: Response times by HTTP status code
- **SLA compliance**: Percentage of requests meeting SLA thresholds

### 3. Monitoring Middleware

All services include enhanced monitoring middleware that:

- Measures actual response time from request start to finish
- Determines SLA tier for each endpoint based on configuration
- Records detailed metrics with proper labels
- Adds `X-Response-Time` header to all responses
- Logs slow requests that exceed SLA thresholds

### 4. Performance Baselines

The system calculates and maintains performance baselines:

- **Daily baseline calculation**: Automated job calculates P50, P90, P95, P99, and average response times
- **Historical comparison**: Compare current performance against baselines
- **Trend analysis**: Identify performance degradation over time
- **Database storage**: Baselines stored in `performance_baselines` table

### 5. SLA Alerts

Comprehensive alerting rules are configured in `monitoring/sla-alert-rules.yml`:

| Alert | Condition | Duration | Severity |
|-------|-----------|----------|----------|
| CriticalEndpointSLAViolation | Critical > 500ms | 5 min | Critical |
| HighPriorityEndpointSLAViolation | High > 1s | 10 min | Warning |
| FrequentSlowRequests | > 10% exceed SLA | 15 min | Warning |
| ResponseTimeDegradation | 50% increase vs baseline | 10 min | Warning |

### 6. Response Time Analytics UI

Access the Response Time Analytics dashboard at:
`https://yourdomain.com/admin/monitoring/response-time`

The dashboard includes 5 sections:

1. **Overview**: Average response time, SLA compliance %, slowest endpoints, violations count
2. **Endpoint Analysis**: Filterable, sortable table with endpoint metrics
3. **Response Time Trends**: Line chart with P50/P90/P95/P99 percentiles
4. **SLA Violations**: Recent violations list with details
5. **Performance Comparison**: Compare endpoints, periods, and services

### 7. API Endpoints

The following API endpoints are available for response time analytics:

- `GET /api/v1/monitoring/response-time/overview` - Overview metrics
- `GET /api/v1/monitoring/response-time/endpoints` - Detailed endpoint metrics
- `GET /api/v1/monitoring/response-time/trends` - Historical trend data
- `GET /api/v1/monitoring/response-time/violations` - SLA violations
- `GET /api/v1/monitoring/response-time/baselines` - Performance baselines
- `GET /api/v1/monitoring/response-time/compare` - Comparative analysis

### 8. Grafana Dashboard

A dedicated Grafana dashboard is available at:
`https://yourdomain.com:3001/d/smart-ai-hub-response-time`

The dashboard includes 8+ panels:

- Average response time trends
- P95 response time by endpoint
- SLA compliance percentage
- Violations timeline
- Response time distribution histogram
- Slowest endpoints ranking
- Service performance heatmap
- Baseline comparison charts

### 9. Configuration

#### Environment Variables

Add these to your `.env.local` file:

```bash
# Response Time Tracking Configuration
ENABLE_RESPONSE_TIME_TRACKING=true
DEFAULT_SLA_TIER=medium
BASELINE_CALCULATION_SCHEDULE=0 2 * * *  # Daily at 2 AM
PERFORMANCE_RETENTION_DAYS=90
```

#### SLA Configuration

Customize SLA thresholds in `config/sla-config.json`:

```json
{
  "tiers": {
    "critical": {
      "threshold": 500,
      "description": "Mission-critical operations",
      "alertDuration": "5m"
    },
    "high": {
      "threshold": 1000,
      "description": "Important user-facing features",
      "alertDuration": "10m"
    }
  }
}
```

### 10. Troubleshooting

#### Common Issues

1. **Missing Response Time Headers**
   - Verify monitoring middleware is enabled in all services
   - Check if `ENABLE_RESPONSE_TIME_TRACKING=true` is set

2. **SLA Alerts Not Firing**
   - Verify Prometheus alert rules are loaded
   - Check AlertManager configuration

3. **Baseline Calculation Not Running**
   - Verify cron job is configured
   - Check analytics service logs

4. **Dashboard Showing No Data**
   - Verify Prometheus is collecting metrics
   - Check data source configuration in Grafana

#### Performance Optimization

1. **Optimize Prometheus Queries**
   - Use appropriate time ranges
   - Apply proper filtering by service and endpoint

2. **Database Performance**
   - Index performance_baselines table
   - Regular cleanup of old metrics

3. **UI Performance**
   - Implement pagination for large datasets
   - Use appropriate caching strategies

### 11. Best Practices

1. **Regular Monitoring**
   - Review SLA compliance daily
   - Analyze performance trends weekly
   - Update baselines monthly

2. **Alert Management**
   - Fine-tune alert thresholds to reduce noise
   - Establish on-call rotation for critical alerts
   - Document response procedures

3. **Performance Optimization**
   - Identify and optimize slow endpoints
   - Implement caching where appropriate
   - Consider horizontal scaling for high-traffic services

4. **Documentation**
   - Document performance targets
   - Maintain alert playbooks
   - Track performance improvements over time

## Security Configuration

### 1. Firewall Setup

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Security Headers Configuration

Smart AI Hub implements comprehensive security headers across all layers of the application stack. The security headers protect against various web vulnerabilities including XSS, clickjacking, MIME-type sniffing, and man-in-the-middle attacks.

#### Implemented Security Headers

The following security headers are configured:

| Header | Purpose | Value |
|--------|---------|-------|
| `X-Content-Type-Options` | Prevents MIME-type sniffing | `nosniff` |
| `X-Frame-Options` | Prevents clickjacking | `DENY` |
| `X-XSS-Protection` | Enables XSS filtering | `1; mode=block` |
| `Strict-Transport-Security` | Enforces HTTPS | `max-age=31536000; includeSubDomains; preload` |
| `Referrer-Policy` | Controls referrer information | `strict-origin-when-cross-origin` |
| `X-DNS-Prefetch-Control` | Controls DNS prefetching | `off` |
| `X-Download-Options` | Prevents file download execution | `noopen` |
| `X-Permitted-Cross-Domain-Policies` | Restricts cross-domain policies | `none` |
| `Permissions-Policy` | Controls browser feature access | Restricted |
| `Content-Security-Policy` | Controls resource loading | Environment-specific |

#### Content Security Policy (CSP)

The CSP is configured with environment-specific policies:

**Production CSP (Strict):**
```
default-src 'self';
script-src 'self' 'nonce-{NONCE}';
style-src 'self' 'nonce-{NONCE}';
img-src 'self' data: https:;
connect-src 'self' https://api.smart-ai-hub.com;
font-src 'self';
object-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
report-uri /api/v1/security/csp-report;
```

**Staging CSP (Relaxed):**
```
default-src 'self' 'unsafe-inline' 'unsafe-eval';
script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* ws://localhost:*;
connect-src 'self' localhost:* ws://localhost:*;
report-uri /api/v1/security/csp-report;
```

#### Deployment Steps for Security Headers

1. **Verify NGINX Configuration**
   ```bash
   # Test NGINX configuration
   nginx -t -c nginx.prod.conf
   
   # Reload NGINX if valid
   nginx -s reload
   ```

2. **Configure Backend Services**
   - All backend services use Helmet.js middleware
   - Security configuration is centralized in `packages/shared/security/headers.ts`
   - CSP nonces are generated per request for inline scripts

3. **Frontend Security Configuration**
   - Security meta tags are included in `packages/frontend/index.html`
   - CSP policies are enforced via NGINX and backend headers
   - All inline scripts use CSP nonces

#### Testing Security Headers

1. **Run Security Test Script**
   ```bash
   # Linux/macOS
   ./scripts/test-security-headers.sh --base-url https://yourdomain.com --frontend-url https://yourdomain.com --verbose
   
   # Windows
   scripts\test-security-headers.bat --base-url https://yourdomain.com --frontend-url https://yourdomain.com --verbose
   ```

2. **Verify Headers Manually**
   ```bash
   # Check security headers
   curl -I https://yourdomain.com
   
   # Look for all security headers in the response
   ```

3. **External Security Testing**
   - Test with [securityheaders.com](https://securityheaders.com) - Target: A+ rating
   - Test with [Mozilla Observatory](https://observatory.mozilla.org) - Target: 90+ score
   - Test with [SSL Labs](https://www.ssllabs.com/ssltest/) - Target: A+ rating

#### Security Monitoring

1. **Access Security Dashboard**
   - URL: `https://yourdomain.com/admin/security/headers`
   - Features: Security status, CSP violations, security score, recommendations

2. **Monitor CSP Violations**
   ```bash
   # Check recent violations
   curl -H "Authorization: Bearer <token>" https://yourdomain.com/api/v1/security/status
   ```

3. **Security Alerts**
   - High-severity CSP violations trigger immediate alerts
   - Security score drops below B trigger notifications
   - Missing security headers trigger critical alerts

#### Security Headers Maintenance

1. **Regular Testing**
   - Test security headers after each deployment
   - Run automated tests weekly
   - Monitor external security scores monthly

2. **CSP Violation Management**
   - Review violations daily in production
   - Update CSP policies to allow legitimate resources
   - Remove `unsafe-inline` from production CSP

3. **HSTS Management**
   - Test HSTS in staging before production
   - Start with shorter max-age (1 hour) for new domains
   - Only enable preload after thorough testing

#### Troubleshooting Security Headers

1. **CSP Violations**
   ```bash
   # Check violation details
   curl -H "Authorization: Bearer <token>" https://yourdomain.com/api/v1/security/violations
   
   # Common solutions:
   # - Add missing domains to CSP directives
   # - Use nonces instead of unsafe-inline
   # - Move inline scripts to external files
   ```

2. **Missing Headers**
   ```bash
   # Verify NGINX configuration
   nginx -t -c nginx.prod.conf
   
   # Check service configuration
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

3. **HSTS Issues**
   ```bash
   # HSTS is only enabled in production/staging
   # Check environment variable NODE_ENV=production
   
   # To temporarily disable HSTS (emergency only):
   # Remove HSTS header from nginx.prod.conf
   # Reload NGINX
   ```

#### Security Score Calculation

The security score is calculated based on:
- **Headers Present** (60%): Each required header contributes points
- **CSP Strictness** (25%): Stricter CSP policies score higher
- **HSTS Configuration** (10%): Proper HSTS setup adds points
- **Violations** (-5% each): Recent violations reduce score

**Score Ratings:**
- **A+**: 95-100 points
- **A**: 90-94 points
- **B**: 80-89 points
- **C**: 70-79 points
- **D**: 60-69 points
- **F**: Below 60 points

For comprehensive security headers documentation, refer to `docs/SECURITY_HEADERS.md`.

### 3. Rate Limiting

Rate limiting is configured in Nginx:
- API endpoints: 10 requests/second
- Auth endpoints: 5 requests/second

## Backup and Recovery

### 1. Automated Backups

Backups are automatically created during deployment and can be scheduled with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/Smart-AI-Hub/scripts/backup.sh
```

### 2. Manual Backup

```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres smart_ai_hub | gzip > backups/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Configuration backup
tar -czf backups/config_backup_$(date +%Y%m%d_%H%M%S).tar.gz .env.local nginx.prod.conf docker-compose.prod.yml
```

### 3. Recovery Procedure

```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore database
gunzip -c backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres smart_ai_hub

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## Scaling and Performance

### 1. Horizontal Scaling

To scale individual services:

```bash
# Scale API Gateway
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=3

# Scale Auth Service
docker-compose -f docker-compose.prod.yml up -d --scale auth-service=2
```

### 2. Database Optimization

- Configure connection pooling
- Enable query caching
- Set up read replicas for high traffic

### 3. Redis Optimization

- Configure memory limits
- Enable persistence
- Set up Redis Cluster for high availability

## Troubleshooting

### 1. Service Not Starting

```bash
# Check service logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Restart service
docker-compose -f docker-compose.prod.yml restart [service-name]
```

### 2. Database Connection Issues

```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d smart_ai_hub -c "SELECT 1;"

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### 3. SSL Certificate Issues

```bash
# Check certificate expiration
openssl x509 -in ssl/cert.pem -text -noout | grep "Not After"

# Renew certificates
sudo certbot renew
```

## Maintenance

### 1. Regular Updates

```bash
# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Log Management

```bash
# Rotate logs
docker-compose -f docker-compose.prod.yml exec [service-name] logrotate -f /etc/logrotate.d/[service]

# Clean old logs
find logs/ -name "*.log" -mtime +30 -delete
```

### 3. Performance Monitoring

Regularly monitor:
- CPU and memory usage
- Database performance
- Response times
- Error rates

## Emergency Procedures

### 1. Service Outage

1. Identify affected service
2. Check service logs
3. Restart service if needed
4. Verify service health

### 2. Database Failure

1. Switch to read replica if available
2. Restore from recent backup
3. Verify data integrity

### 3. Security Incident

1. Identify and contain the breach
2. Review access logs
3. Rotate secrets and certificates
4. Update security configurations

## Support and Contact

For additional support:
- Create an issue on GitHub
- Contact the DevOps team
- Review the documentation at https://docs.smartaihub.com

---

**Note**: This guide is for production deployment. For development or staging environments, please refer to the appropriate documentation.