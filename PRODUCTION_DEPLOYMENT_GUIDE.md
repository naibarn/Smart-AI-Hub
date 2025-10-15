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

## Monitoring Setup

### 1. Deploy Monitoring Stack

```bash
# Navigate to monitoring directory
cd monitoring

# Deploy monitoring services
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Access Monitoring Dashboards

- **Grafana**: https://yourdomain.com:3001 (admin/admin123)
- **Prometheus**: https://yourdomain.com:9090
- **AlertManager**: https://yourdomain.com:9093

### 3. Configure Grafana Dashboards

1. Log in to Grafana
2. Add Prometheus as a data source
3. Import pre-configured dashboards from `monitoring/grafana/dashboards`

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

### 2. Security Headers

The Nginx configuration includes security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: "1; mode=block"
- Strict-Transport-Security: "max-age=31536000; includeSubDomains"

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