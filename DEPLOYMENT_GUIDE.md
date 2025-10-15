# Smart AI Hub Deployment Guide

[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Table of Contents

- [Overview](#overview)
- [Deployment Architecture](#deployment-architecture)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Methods](#deployment-methods)
  - [Docker Deployment](#docker-deployment)
  - [Kubernetes Deployment](#kubernetes-deployment)
  - [Cloud Platform Deployment](#cloud-platform-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Database Deployment](#database-deployment)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Considerations](#security-considerations)
- [Scaling Strategies](#scaling-strategies)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Overview

This guide provides comprehensive instructions for deploying the Smart AI Hub platform to various environments. It covers everything from local development setups to production deployments on cloud platforms.

## Deployment Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   API Gateway   │────│   Frontend      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Auth Service │ │Core Service │ │MCP Server  │
        └──────────────┘ └─────────────┘ └────────────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Database & Cache    │
                    │  (PostgreSQL, Redis)  │
                    └───────────────────────┘
```

### Service Dependencies

```
Frontend → API Gateway → Auth Service → Database
                    ↓
                Core Service → Database
                    ↓
                MCP Server → External APIs
                    ↓
                Notification Service → Queue
```

## Prerequisites

### Infrastructure Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 20 GB | 50 GB SSD |
| Network | 100 Mbps | 1 Gbps |

### Software Requirements

- [Docker](https://www.docker.com/) (v20.x or later)
- [Docker Compose](https://docs.docker.com/compose/) (v2.x or later)
- [Kubernetes](https://kubernetes.io/) (v1.24 or later) - for K8s deployment
- [Helm](https://helm.sh/) (v3.8 or later) - for K8s deployment

### External Services

- PostgreSQL database (v13 or later)
- Redis cache (v6 or later)
- SMTP server for email notifications
- Object storage for file uploads (AWS S3, Google Cloud Storage, etc.)
- CDN for frontend assets (optional)

## Environment Configuration

### Environment Types

- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

### Environment Variables

Create environment-specific configuration files:

#### Development (.env.development)

```env
# Application
NODE_ENV=development
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/smartaihub_dev
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=dev-jwt-secret
JWT_REFRESH_SECRET=dev-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# OAuth Providers
GOOGLE_CLIENT_ID=dev-google-client-id
GOOGLE_CLIENT_SECRET=dev-google-client-secret

# API Keys
OPENAI_API_KEY=dev-openai-key
ANTHROPIC_API_KEY=dev-anthropic-key

# Stripe
STRIPE_SECRET_KEY=dev-stripe-key
STRIPE_WEBHOOK_SECRET=dev-webhook-secret

# Email
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=smtp-user
SMTP_PASS=smtp-pass

# Storage
STORAGE_PROVIDER=local
STORAGE_PATH=./uploads
```

#### Production (.env.production)

```env
# Application
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://username:password@db.example.com:5432/smartaihub_prod
REDIS_URL=redis://redis.example.com:6379

# Authentication
JWT_SECRET=prod-jwt-secret-change-this
JWT_REFRESH_SECRET=prod-refresh-secret-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth Providers
GOOGLE_CLIENT_ID=prod-google-client-id
GOOGLE_CLIENT_SECRET=prod-google-client-secret

# API Keys
OPENAI_API_KEY=prod-openai-key
ANTHROPIC_API_KEY=prod-anthropic-key

# Stripe
STRIPE_SECRET_KEY=prod-stripe-key
STRIPE_WEBHOOK_SECRET=prod-webhook-secret

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=sendgrid-api-key

# Storage
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=aws-access-key
AWS_SECRET_ACCESS_KEY=aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=smartaihub-prod

# Monitoring
SENTRY_DSN=https://sentry-dsn
NEW_RELIC_LICENSE_KEY=newrelic-key
```

## Deployment Methods

### Docker Deployment

#### Quick Start with Docker Compose

1. Clone the repository:
```bash
git clone https://github.com/your-username/Smart-AI-Hub.git
cd Smart-AI-Hub
```

2. Configure environment:
```bash
cp .env.example .env.production
# Edit .env.production with your values
```

3. Deploy with Docker Compose:
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Check deployment status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Docker Compose Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    depends_on:
      - api-gateway
    environment:
      - REACT_APP_API_URL=https://api.yourdomain.com
    restart: unless-stopped

  # API Gateway
  api-gateway:
    build:
      context: ./packages/api-gateway
      dockerfile: Dockerfile.prod
    ports:
      - "3001:3001"
    depends_on:
      - auth-service
      - core-service
      - redis
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - AUTH_SERVICE_URL=http://auth-service:3002
      - CORE_SERVICE_URL=http://core-service:3003
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  # Auth Service
  auth-service:
    build:
      context: ./packages/auth-service
      dockerfile: Dockerfile.prod
    ports:
      - "3002:3002"
    depends_on:
      - postgres
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/smartaihub
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  # Core Service
  core-service:
    build:
      context: ./packages/core-service
      dockerfile: Dockerfile.prod
    ports:
      - "3003:3003"
    depends_on:
      - postgres
      - redis
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/smartaihub
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  # MCP Server
  mcp-server:
    build:
      context: ./packages/mcp-server
      dockerfile: Dockerfile.prod
    ports:
      - "3004:3004"
    depends_on:
      - redis
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  # Notification Service
  notification-service:
    build:
      context: ./packages/notification-service
      dockerfile: Dockerfile.prod
    ports:
      - "3005:3005"
    depends_on:
      - redis
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=smartaihub
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api-gateway
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

#### Prerequisites

- Kubernetes cluster (v1.24 or later)
- kubectl configured to connect to your cluster
- Helm installed (optional but recommended)

#### Deploy with Helm

1. Add the Helm repository:
```bash
helm repo add smartaihub https://charts.smartaihub.com
helm repo update
```

2. Install the chart:
```bash
helm install smartaihub smartaihub/smartaihub \
  --namespace smartaihub \
  --create-namespace \
  --set ingress.enabled=true \
  --set ingress.host=api.yourdomain.com \
  --set postgresql.auth.postgresPassword=secure-password \
  --set redis.auth.password=redis-password
```

3. Check deployment:
```bash
kubectl get pods -n smartaihub
kubectl get services -n smartaihub
kubectl get ingress -n smartaihub
```

#### Kubernetes Manifests

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: smartaihub
---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: smartaihub-config
  namespace: smartaihub
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  REDIS_URL: "redis://redis-service:6379"
---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: smartaihub-secrets
  namespace: smartaihub
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  OPENAI_API_KEY: <base64-encoded-openai-key>
---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: smartaihub
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: smartaihub/api-gateway:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: smartaihub-config
        - secretRef:
            name: smartaihub-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: smartaihub
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP
---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: smartaihub-ingress
  namespace: smartaihub
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: smartaihub-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway-service
            port:
              number: 80
```

### Cloud Platform Deployment

#### AWS Deployment

1. **ECS (Elastic Container Service)**

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name smartaihub

# Create task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster smartaihub \
  --service-name api-gateway \
  --task-definition smartaihub:1 \
  --desired-count 2
```

2. **EKS (Elastic Kubernetes Service)**

```bash
# Create EKS cluster
aws eks create-cluster \
  --name smartaihub \
  --role-arn arn:aws:iam::ACCOUNT:role/EKSServiceRole \
  --resources-vpc-config subnetIds=SUBNET1,SUBNET2

# Update kubeconfig
aws eks update-kubeconfig --name smartaihub

# Deploy using Helm
helm install smartaihub ./helm-chart
```

#### Google Cloud Platform Deployment

1. **GKE (Google Kubernetes Engine)**

```bash
# Create GKE cluster
gcloud container clusters create smartaihub \
  --zone us-central1-a \
  --num-nodes 3

# Get credentials
gcloud container clusters get-credentials smartaihub \
  --zone us-central1-a

# Deploy using Helm
helm install smartaihub ./helm-chart
```

2. **Cloud Run**

```bash
# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/PROJECT-ID/smartaihub

gcloud run deploy smartaihub \
  --image gcr.io/PROJECT-ID/smartaihub \
  --platform managed \
  --region us-central1
```

#### Azure Deployment

1. **AKS (Azure Kubernetes Service)**

```bash
# Create resource group
az group create --name smartaihub-rg --location eastus

# Create AKS cluster
az aks create \
  --resource-group smartaihub-rg \
  --name smartaihub \
  --node-count 3 \
  --enable-addons monitoring

# Get credentials
az aks get-credentials --resource-group smartaihub-rg --name smartaihub

# Deploy using Helm
helm install smartaihub ./helm-chart
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push Docker images
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ghcr.io/${{ github.repository }}:latest
          ghcr.io/${{ github.repository }}:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Kubernetes
      uses: azure/k8s-deploy@v1
      with:
        manifests: |
          k8s/namespace.yaml
          k8s/configmap.yaml
          k8s/secret.yaml
          k8s/deployment.yaml
          k8s/service.yaml
          k8s/ingress.yaml
        images: |
          ghcr.io/${{ github.repository }}:${{ github.sha }}
        kubeconfig: ${{ secrets.KUBE_CONFIG }}
```

## Database Deployment

### PostgreSQL Deployment

#### Docker Deployment

```yaml
# docker-compose.db.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=smartaihub
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Managed Database Services

- **AWS RDS**
- **Google Cloud SQL**
- **Azure Database for PostgreSQL**
- **Heroku Postgres**

### Database Migrations

```bash
# Run migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Rollback migrations
npm run db:migrate:rollback
```

### Database Backups

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres smartaihub > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T postgres psql -U postgres smartaihub < backup_20231015_120000.sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

docker-compose exec -T postgres pg_dump -U postgres smartaihub > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

## Monitoring and Logging

### Application Monitoring

#### Prometheus and Grafana

```yaml
# monitoring/docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  prometheus_data:
  grafana_data:
```

#### Application Metrics

```typescript
// packages/shared/src/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Create metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Register metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(activeConnections);
```

### Logging

#### Structured Logging

```typescript
// packages/shared/src/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'smartaihub' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

#### Log Aggregation with ELK Stack

```yaml
# logging/docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

## Security Considerations

### SSL/TLS Configuration

```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://api-gateway-service:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall Configuration

```bash
# UFW (Uncomplicated Firewall) rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Security Headers

```typescript
// packages/api-gateway/src/middleware/security.middleware.ts
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});
```

## Scaling Strategies

### Horizontal Scaling

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: smartaihub
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling

#### Read Replicas

```yaml
# k8s/postgres-replica.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-replica
  namespace: smartaihub
spec:
  serviceName: postgres-replica
  replicas: 2
  selector:
    matchLabels:
      app: postgres-replica
  template:
    metadata:
      labels:
        app: postgres-replica
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_MASTER_SERVICE
          value: postgres-service
        - name: POSTGRES_REPLICATION_USER
          value: replicator
        - name: POSTGRES_REPLICATION_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secrets
              key: replication-password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Database backup
docker-compose exec -T postgres pg_dump -U postgres smartaihub | gzip > $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

# File backup
tar -czf $BACKUP_DIR/files_backup_$TIMESTAMP.tar.gz uploads/

# Clean old backups
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $TIMESTAMP"
```

### Disaster Recovery Plan

1. **Identify Critical Components**
   - Database
   - Application code
   - Configuration files
   - SSL certificates

2. **Recovery Procedures**
   - Restore database from backup
   - Deploy application from version control
   - Restore configuration
   - Verify functionality

3. **Testing Recovery**
   - Regular disaster recovery drills
   - Documentation updates
   - Process improvements

## Troubleshooting

### Common Issues

#### Service Not Starting

```bash
# Check service logs
docker-compose logs api-gateway

# Check service status
docker-compose ps

# Restart service
docker-compose restart api-gateway
```

#### Database Connection Issues

```bash
# Test database connection
docker-compose exec postgres psql -U postgres -d smartaihub -c "SELECT 1;"

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### High Memory Usage

```bash
# Check resource usage
docker stats

# Check system resources
free -h
df -h

# Optimize configuration
# Update memory limits in docker-compose.yml
```

### Debugging Tools

```bash
# Check container logs
docker-compose logs -f [service-name]

# Execute commands in container
docker-compose exec [service-name] sh

# Check network connectivity
docker-compose exec [service-name] ping [other-service]

# Monitor resource usage
docker-compose exec [service-name] top
```

## Maintenance

### Regular Maintenance Tasks

1. **Daily**
   - Check system health
   - Review error logs
   - Monitor resource usage

2. **Weekly**
   - Apply security patches
   - Update dependencies
   - Review performance metrics

3. **Monthly**
   - Test backup and recovery
   - Review and rotate secrets
   - Update documentation

### Maintenance Windows

- Schedule regular maintenance windows
- Notify users in advance
- Use blue-green deployment for zero downtime
- Have rollback procedures ready

### Update Procedures

```bash
# Update application
git pull origin main
docker-compose pull
docker-compose up -d

# Update dependencies
npm update
npm audit fix
docker-compose build --no-cache
docker-compose up -d
```

---

For additional help or questions, please contact the DevOps team or create an issue on GitHub.