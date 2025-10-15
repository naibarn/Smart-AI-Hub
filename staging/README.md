# Staging Environment

This directory contains the complete staging environment setup for Smart AI Hub, designed to mirror production while providing a safe space for testing and validation before production deployment.

## 🎯 Purpose

The staging environment serves as a production-like environment where:
- New features are tested before production deployment
- Performance and security testing is conducted
- Deployment procedures are validated
- Team members can safely test functionality
- Integration testing with external services occurs

## 📁 Directory Structure

```
staging/
├── README.md                           # This file
├── docker-compose.staging.yml          # Docker Compose configuration
├── .env.staging                        # Environment variables
├── nginx.staging.conf                  # Nginx configuration
├── prometheus.staging.yml              # Prometheus configuration
├── generate-ssl.sh                     # SSL certificate generator
├── deploy-staging.sh                   # Deployment script
├── test-staging.sh                     # Integration tests
├── performance-test.sh                 # Performance tests
├── security-test.sh                    # Security tests
├── health-check.sh                     # Health checks
├── rollback-staging.sh                 # Rollback script
├── validate-deployment.sh              # Deployment validation
├── PRODUCTION_DEPLOYMENT_CHECKLIST.md  # Production checklist
├── ssl/                                # SSL certificates
└── test-results/                       # Test results directory
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- OpenSSL (for SSL certificate generation)
- curl (for health checks)
- Node.js and npm (for performance testing)
- Sufficient system resources (8GB+ RAM recommended)

### 1. Initial Setup

```bash
# Navigate to staging directory
cd staging

# Generate SSL certificates
bash generate-ssl.sh

# Make scripts executable (Unix/Linux/macOS)
chmod +x *.sh
```

### 2. Deploy to Staging

```bash
# Deploy full environment
bash deploy-staging.sh

# Or deploy specific components
bash deploy-staging.sh deploy
bash deploy-staging.sh backup
bash deploy-staging.sh health
```

### 3. Access the Environment

Once deployed, access the services at:

- **Frontend:** http://localhost:8080
- **API Gateway:** http://localhost:8080/api
- **Auth Service:** http://localhost:8080/auth
- **Core Service:** http://localhost:8080/core
- **MCP Server:** http://localhost:8080/mcp
- **Analytics Service:** http://localhost:8080/analytics
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3000 (admin/admin123)

## 🧪 Testing

### Run All Tests

```bash
# Run integration tests
bash test-staging.sh

# Run performance tests
bash performance-test.sh

# Run security tests
bash security-test.sh

# Run health checks
bash health-check.sh
```

### Run Specific Tests

```bash
# Integration tests
bash test-staging.sh all          # All tests
bash test-staging.sh health       # Health checks only
bash test-staging.sh auth         # Authentication tests
bash test-staging.sh credits      # Credit management tests
bash test-staging.sh mcp          # MCP server tests
bash test-staging.sh analytics    # Analytics tests
bash test-staging.sh api          # API standards tests

# Performance tests
bash performance-test.sh all      # All performance tests
bash performance-test.sh api      # API endpoints
bash performance-test.sh database # Database performance
bash performance-test.sh redis    # Redis caching
bash performance-test.sh concurrent # Concurrent users
bash performance-test.sh bottlenecks # Identify bottlenecks

# Security tests
bash security-test.sh all         # All security tests
bash security-test.sh sql         # SQL injection
bash security-test.sh xss         # XSS protection
bash security-test.sh auth        # Authentication bypass
bash security-test.sh authz       # Authorization checks
bash security-test.sh rate        # Rate limiting
bash security-test.sh https       # HTTPS enforcement
bash security-test.sh input       # Input validation
bash security-test.sh vuln        # Vulnerability scan

# Health checks
bash health-check.sh all          # All health checks
bash health-check.sh database     # Database health
bash health-check.sh redis        # Redis health
bash health-check.sh services     # Application services
bash health-check.sh gateway      # API Gateway health
bash health-check.sh nginx        # Nginx health
bash health-check.sh monitoring   # Monitoring stack
bash health-check.sh resources    # System resources
bash health-check.sh deps         # Service dependencies
```

## 🔄 Deployment Management

### Deployment

```bash
# Full deployment with backup and validation
bash deploy-staging.sh

# Deployment options
bash deploy-staging.sh deploy     # Deploy only
bash deploy-staging.sh backup     # Backup only
bash deploy-staging.sh health     # Health checks only
bash deploy-staging.sh rollback   # Rollback deployment
```

### Rollback

```bash
# Interactive rollback
bash rollback-staging.sh

# Automatic rollback to latest backup
bash rollback-staging.sh db        # Database only
bash rollback-staging.sh config    # Configuration only
bash rollback-staging.sh full      # Full rollback
bash rollback-staging.sh list      # List available backups
```

### Validation

```bash
# Full deployment validation
bash validate-deployment.sh

# Specific validation
bash validate-deployment.sh services   # Services status
bash validate-deployment.sh health     # Health checks
bash validate-deployment.sh database   # Database status
bash validate-deployment.sh resources  # Resource usage
bash validate-deployment.sh monitoring # Monitoring stack
bash validate-deployment.sh smoke      # Smoke tests
bash validate-deployment.sh collect    # Collect test results
```

## 📊 Monitoring

### Prometheus Metrics

Access Prometheus at http://localhost:9090

Key metrics to monitor:
- `up` - Service availability
- `http_requests_total` - HTTP request count
- `http_request_duration_seconds` - Request duration
- `database_connections_active` - Active database connections
- `redis_connections_active` - Active Redis connections

### Grafana Dashboards

Access Grafana at http://localhost:3000 (admin/admin123)

Pre-configured dashboards:
- System Overview
- Application Performance
- Database Performance
- Redis Performance
- Network Statistics

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env.staging`:

```bash
# Application
NODE_ENV=staging
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:staging_password@postgres:5432/smart_ai_hub_staging
POSTGRES_PASSWORD=staging_password

# Redis
REDIS_URL=redis://redis:6379

# Authentication
JWT_SECRET=staging-jwt-secret-key-32-chars-minimum
JWT_REFRESH_SECRET=staging-jwt-refresh-secret-key-different

# External Services (Test/Sandbox)
STRIPE_SECRET_KEY=sk_test_51234567890abcdef1234567890abcdef
OPENAI_API_KEY=sk-test1234567890abcdef1234567890abcdef
ANTHROPIC_API_KEY=sk-ant-test1234567890abcdef1234567890abcdef
```

### Service Ports

| Service | Container Port | Host Port |
|---------|----------------|-----------|
| Nginx | 80 | 8080 |
| Nginx (HTTPS) | 443 | 8443 |
| Auth Service | 3001 | - |
| Core Service | 3002 | - |
| MCP Server | 3003 | - |
| Analytics Service | 3004 | - |
| API Gateway | 8080 | - |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| Prometheus | 9090 | 9090 |
| Grafana | 3000 | 3000 |

## 🧪 Test Data

### Sample Test Credentials

- **Email:** test@example.com
- **Password:** TestPassword123!
- **Name:** Test User

### Test Payment

Use Stripe test mode with test card numbers:
- **Visa:** 4242424242424242
- **Mastercard:** 5555555555554444
- **American Express:** 378282246310005

## 📁 Test Results

All test results are stored in `test-results/` directory:

- `TEST_REPORT_*.md` - Integration test results
- `PERFORMANCE_REPORT_*.md` - Performance test results
- `SECURITY_REPORT_*.md` - Security test results
- `HEALTH_CHECK_REPORT_*.md` - Health check results
- `DEPLOYMENT_REPORT_*.md` - Deployment reports
- `ROLLBACK_REPORT_*.md` - Rollback reports
- `STAGING_DEPLOYMENT_REPORT_*.md` - Comprehensive validation reports

## 🔄 Continuous Integration

### GitHub Actions Integration

The staging environment can be integrated with CI/CD pipelines:

```yaml
name: Staging Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Deploy to Staging
        run: |
          cd staging
          bash deploy-staging.sh
      - name: Run Tests
        run: |
          cd staging
          bash test-staging.sh
          bash performance-test.sh
          bash security-test.sh
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using ports
   netstat -tulpn | grep :8080
   
   # Stop conflicting services
   sudo systemctl stop nginx
   ```

2. **Docker Issues**
   ```bash
   # Clean up Docker
   docker system prune -a
   
   # Rebuild containers
   docker-compose -f docker-compose.staging.yml build --no-cache
   ```

3. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose -f docker-compose.staging.yml exec postgres pg_isready -U postgres
   
   # Check database logs
   docker-compose -f docker-compose.staging.yml logs postgres
   ```

4. **SSL Certificate Issues**
   ```bash
   # Regenerate SSL certificates
   rm -rf ssl/*
   bash generate-ssl.sh
   ```

### Getting Help

1. Check logs: `docker-compose -f docker-compose.staging.yml logs [service]`
2. Run health checks: `bash health-check.sh`
3. Review test results in `test-results/` directory
4. Check monitoring dashboards
5. Consult the troubleshooting guide in the main documentation

## 📋 Production Readiness

Before deploying to production, ensure:

1. ✅ All integration tests pass (>95% success rate)
2. ✅ Performance tests meet benchmarks
3. ✅ Security tests pass (>85% success rate)
4. ✅ All health checks pass
5. ✅ Monitoring dashboards functional
6. ✅ Backup and recovery procedures tested
7. ✅ Rollback procedures validated
8. ✅ Documentation complete

Use the [Production Deployment Checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md) for comprehensive validation.

## 🔄 Environment Lifecycle

### Starting the Environment

```bash
# Start all services
docker-compose -f docker-compose.staging.yml up -d

# Start specific services
docker-compose -f docker-compose.staging.yml up -d postgres redis
```

### Stopping the Environment

```bash
# Stop all services
docker-compose -f docker-compose.staging.yml down

# Stop and remove volumes
docker-compose -f docker-compose.staging.yml down -v
```

### Cleaning Up

```bash
# Remove all containers, networks, and volumes
docker-compose -f docker-compose.staging.yml down -v --remove-orphans

# Clean up test results older than 7 days
find test-results/ -name "*.md" -mtime +7 -delete
```

## 📚 Additional Resources

- [Main Documentation](../README.md)
- [API Documentation](../API_DOCUMENTATION.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Security Guidelines](../SECURITY_GUIDELINES.md)
- [Production Deployment Checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md)

## 🤝 Contributing

When contributing to the staging environment:

1. Test all changes in staging before production
2. Update this README with any configuration changes
3. Add new tests for new features
4. Update the production checklist
5. Document any new monitoring requirements

## 📞 Support

For issues with the staging environment:

1. Check this README first
2. Review test results and logs
3. Check monitoring dashboards
4. Contact the DevOps team
5. Create an issue in the project repository

---

**Last Updated:** $(date +"%Y-%m-%d")
**Version:** 1.0
**Maintainer:** DevOps Team