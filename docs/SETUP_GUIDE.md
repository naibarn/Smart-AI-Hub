# Smart AI Hub Setup Guide

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Service Configuration](#service-configuration)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Recovery](#backup-and-recovery)

## System Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Network**: 100 Mbps
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows 10+

### Recommended Requirements
- **CPU**: 8 cores
- **RAM**: 16GB
- **Storage**: 100GB SSD
- **Network**: 1 Gbps
- **OS**: Ubuntu 22.04 LTS

### Software Dependencies
- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Docker**: 20.x or higher
- **Docker Compose**: 2.x or higher
- **PostgreSQL**: 14.x or higher
- **Redis**: 6.x or higher
- **Nginx**: 1.20 or higher (for production)

## Local Development Setup

### Prerequisites

1. **Install Node.js**:
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   nvm use 18
   ```

2. **Install Docker and Docker Compose**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install docker.io docker-compose-plugin
   
   # Start Docker service
   sudo systemctl start docker
   sudo systemctl enable docker
   
   # Add user to docker group
   sudo usermod -aG docker $USER
   ```

3. **Install PostgreSQL** (if not using Docker):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # Start PostgreSQL
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

### Clone and Setup Repository

1. **Clone the repository**:
   ```bash
   git clone https://github.com/smartaihub/smart-ai-hub.git
   cd smart-ai-hub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment variables**:
   ```bash
   cp .env.example .env.local
   ```

4. **Edit environment variables**:
   ```bash
   nano .env.local
   ```

### Database Setup

1. **Start PostgreSQL with Docker** (recommended for development):
   ```bash
   docker-compose -f docker-compose.dev.yml up -d postgres
   ```

2. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

3. **Seed the database** (optional):
   ```bash
   npm run db:seed
   ```

### Start Development Services

1. **Start all services**:
   ```bash
   npm run dev
   ```

2. **Or start individual services**:
   ```bash
   # Start core service
   npm run dev:core
   
   # Start API gateway
   npm run dev:gateway
   
   # Start frontend
   npm run dev:frontend
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:3001
   - Core Service: http://localhost:3002

## Production Deployment

### Option 1: Docker Compose (Recommended)

1. **Prepare production environment**:
   ```bash
   cp .env.example .env.production
   ```

2. **Edit production environment variables**:
   ```bash
   nano .env.production
   ```

3. **Build and start services**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Check service status**:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

5. **View logs**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

### Option 2: Manual Deployment

1. **Build applications**:
   ```bash
   # Build all packages
   npm run build
   
   # Build specific packages
   npm run build:shared
   npm run build:core-service
   npm run build:api-gateway
   npm run build:frontend
   ```

2. **Setup PM2 for process management**:
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start services with PM2
   pm2 start ecosystem.config.js --env production
   ```

3. **Setup Nginx reverse proxy**:
   ```bash
   # Copy Nginx configuration
   sudo cp nginx.prod.conf /etc/nginx/sites-available/smartaihub
   sudo ln -s /etc/nginx/sites-available/smartaihub /etc/nginx/sites-enabled/
   
   # Test and reload Nginx
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Environment Configuration

### Required Environment Variables

Create a `.env` file with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3001
APP_NAME=Smart AI Hub
APP_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/smartaihub
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# External Services
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key

# File Storage
STORAGE_PROVIDER=aws # aws, gcp, azure, local
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=smartaihub-files

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# RAG System
RAG_EMBEDDING_MODEL=text-embedding-ada-002
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
RAG_MAX_CHUNKS_PER_DOCUMENT=1000

# Pricing System
PRICING_DEFAULT_CURRENCY=USD
PRICING_CREDIT_CONVERSION_RATE=0.01

# Agent Skills Marketplace
SKILLS_MAX_FILE_SIZE=52428800
SKILLS_APPROVAL_REQUIRED=true
SKILLS_AUTO_APPROVE_TRUSTED_CREATORS=false
```

### Service-Specific Environment Variables

#### Core Service (.env.core)
```bash
PORT=3002
DATABASE_URL=postgresql://username:password@localhost:5432/smartaihub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
```

#### API Gateway (.env.gateway)
```bash
PORT=3001
CORE_SERVICE_URL=http://localhost:3002
RAG_SERVICE_URL=http://localhost:3003
PRICING_SERVICE_URL=http://localhost:3004
AGENT_SKILLS_SERVICE_URL=http://localhost:3005
```

#### Frontend (.env.frontend)
```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_NAME=Smart AI Hub
VITE_APP_VERSION=1.0.0
```

## Database Setup

### PostgreSQL Configuration

1. **Create database and user**:
   ```sql
   CREATE DATABASE smartaihub;
   CREATE USER smartaihub_user WITH PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE smartaihub TO smartaihub_user;
   ```

2. **Configure PostgreSQL** (`/etc/postgresql/14/main/postgresql.conf`):
   ```ini
   # Memory settings
   shared_buffers = 256MB
   effective_cache_size = 1GB
   work_mem = 4MB
   maintenance_work_mem = 64MB
   
   # Connection settings
   max_connections = 100
   listen_addresses = 'localhost'
   
   # Logging
   log_statement = 'all'
   log_duration = on
   log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
   ```

3. **Configure PostgreSQL Authentication** (`/etc/postgresql/14/main/pg_hba.conf`):
   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   local   all             postgres                                peer
   local   all             all                                     md5
   host    all             all             127.0.0.1/32            md5
   host    all             all             ::1/128                 md5
   ```

4. **Restart PostgreSQL**:
   ```bash
   sudo systemctl restart postgresql
   ```

### Redis Configuration

1. **Configure Redis** (`/etc/redis/redis.conf`):
   ```ini
   # Memory
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   
   # Persistence
   save 900 1
   save 300 10
   save 60 10000
   
   # Security
   requirepass your-redis-password
   
   # Networking
   bind 127.0.0.1
   port 6379
   ```

2. **Restart Redis**:
   ```bash
   sudo systemctl restart redis
   ```

### Database Migrations

1. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

2. **Create a new migration**:
   ```bash
   npm run db:migration:create -- --name add_new_table
   ```

3. **Reset database** (development only):
   ```bash
   npm run db:reset
   ```

## Service Configuration

### Core Service Configuration

1. **Create configuration file** (`config/core-service.json`):
   ```json
   {
     "server": {
       "port": 3002,
       "host": "0.0.0.0",
       "cors": {
         "origin": ["http://localhost:3000", "https://app.smartaihub.com"],
         "credentials": true
       }
     },
     "database": {
       "url": "${DATABASE_URL}",
       "pool": {
         "min": 2,
         "max": 10
       }
     },
     "redis": {
       "url": "${REDIS_URL}",
       "keyPrefix": "smartaihub:"
     },
     "auth": {
       "jwtSecret": "${JWT_SECRET}",
       "jwtExpiresIn": "7d",
       "refreshTokenSecret": "${REFRESH_TOKEN_SECRET}",
       "refreshTokenExpiresIn": "30d"
     },
     "services": {
       "rag": {
         "embeddingModel": "text-embedding-ada-002",
         "chunkSize": 1000,
         "chunkOverlap": 200,
         "maxChunksPerDocument": 1000
       },
       "pricing": {
         "defaultCurrency": "USD",
         "creditConversionRate": 0.01
       },
       "agentSkills": {
         "maxFileSize": 52428800,
         "approvalRequired": true,
         "autoApproveTrustedCreators": false
       }
     }
   }
   ```

### API Gateway Configuration

1. **Create configuration file** (`config/api-gateway.json`):
   ```json
   {
     "server": {
       "port": 3001,
       "host": "0.0.0.0"
     },
     "services": {
       "core": {
         "url": "http://localhost:3002",
         "timeout": 30000
       },
       "rag": {
         "url": "http://localhost:3003",
         "timeout": 60000
       },
       "pricing": {
         "url": "http://localhost:3004",
         "timeout": 30000
       },
       "agentSkills": {
         "url": "http://localhost:3005",
         "timeout": 30000
       }
     },
     "rateLimiting": {
       "windowMs": 60000,
       "max": 100,
       "message": "Too many requests from this IP"
     }
   }
   ```

### Frontend Configuration

1. **Create configuration file** (`config/frontend.json`):
   ```json
   {
     "api": {
       "baseUrl": "${VITE_API_BASE_URL}",
       "timeout": 30000
     },
     "app": {
       "name": "${VITE_APP_NAME}",
       "version": "${VITE_APP_VERSION}",
       "description": "Smart AI Hub - Your AI-powered platform"
     },
     "features": {
       "rag": true,
       "pricing": true,
       "agentSkills": true,
       "analytics": true
     },
     "ui": {
       "theme": "light",
       "language": "en",
       "timezone": "UTC"
     }
   }
   ```

## SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

1. **Install Certbot**:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Obtain SSL certificate**:
   ```bash
   sudo certbot --nginx -d app.smartaihub.com -d api.smartaihub.com
   ```

3. **Auto-renewal**:
   ```bash
   sudo crontab -e
   # Add the following line
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Manual SSL Configuration

1. **Generate private key and CSR**:
   ```bash
   sudo openssl genrsa -out /etc/ssl/private/smartaihub.key 2048
   sudo openssl req -new -key /etc/ssl/private/smartaihub.key -out /etc/ssl/certs/smartaihub.csr
   ```

2. **Obtain certificate from CA** and install:
   ```bash
   sudo cp your-certificate.crt /etc/ssl/certs/smartaihub.crt
   sudo cp your-intermediate.crt /etc/ssl/certs/smartaihub-intermediate.crt
   ```

3. **Update Nginx configuration**:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name app.smartaihub.com;
       
       ssl_certificate /etc/ssl/certs/smartaihub.crt;
       ssl_certificate_key /etc/ssl/private/smartaihub.key;
       ssl_certificate_chain /etc/ssl/certs/smartaihub-intermediate.crt;
       
       # SSL configuration
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
       ssl_prefer_server_ciphers off;
       ssl_session_cache shared:SSL:10m;
       ssl_session_timeout 10m;
       
       # Other configuration...
   }
   ```

## Monitoring and Logging

### Application Monitoring

1. **Setup Prometheus**:
   ```yaml
   # prometheus.yml
   global:
     scrape_interval: 15s
   scrape_configs:
     - job_name: 'smartaihub'
       static_configs:
         - targets: ['localhost:3001', 'localhost:3002']
   ```

2. **Setup Grafana**:
   ```bash
   docker run -d \
     -p 3000:3000 \
     --name=grafana \
     -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
     grafana/grafana
   ```

3. **Add metrics to application**:
   ```javascript
   // In your service
   const promClient = require('prom-client');
   
   const httpRequestDuration = new promClient.Histogram({
     name: 'http_request_duration_seconds',
     help: 'Duration of HTTP requests in seconds',
     labelNames: ['method', 'route', 'status_code']
   });
   
   // Use in middleware
   app.use((req, res, next) => {
     const start = Date.now();
     res.on('finish', () => {
       const duration = (Date.now() - start) / 1000;
       httpRequestDuration
         .labels(req.method, req.route?.path || req.path, res.statusCode)
         .observe(duration);
     });
     next();
   });
   ```

### Logging Configuration

1. **Configure Winston logger**:
   ```javascript
   // logger.js
   const winston = require('winston');
   
   const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       winston.format.json()
     ),
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
   
   module.exports = logger;
   ```

2. **Log rotation with logrotate**:
   ```bash
   # /etc/logrotate.d/smartaihub
   /var/log/smartaihub/*.log {
       daily
       missingok
       rotate 52
       compress
       delaycompress
       notifempty
       create 644 www-data www-data
       postrotate
           systemctl reload smartaihub
       endscript
   }
   ```

### Error Tracking with Sentry

1. **Install Sentry**:
   ```bash
   npm install @sentry/node @sentry/tracing
   ```

2. **Configure Sentry**:
   ```javascript
   const Sentry = require('@sentry/node');
   const Tracing = require('@sentry/tracing');
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     integrations: [
       new Sentry.Integrations.Http({ tracing: true }),
       new Tracing.Integrations.Express({ app })
     ],
     tracesSampleRate: 0.1
   });
   
   app.use(Sentry.Handlers.requestHandler());
   app.use(Sentry.Handlers.tracingHandler());
   app.use(Sentry.Handlers.errorHandler());
   ```

## Backup and Recovery

### Database Backup

1. **Create backup script** (`scripts/backup-db.sh`):
   ```bash
   #!/bin/bash
   
   # Configuration
   DB_NAME="smartaihub"
   DB_USER="smartaihub_user"
   DB_HOST="localhost"
   BACKUP_DIR="/var/backups/smartaihub"
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
   
   # Create backup directory if it doesn't exist
   mkdir -p $BACKUP_DIR
   
   # Create backup
   pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE
   
   # Compress backup
   gzip $BACKUP_FILE
   
   # Remove backups older than 30 days
   find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
   
   echo "Backup completed: $BACKUP_FILE.gz"
   ```

2. **Make script executable**:
   ```bash
   chmod +x scripts/backup-db.sh
   ```

3. **Setup cron job for automatic backups**:
   ```bash
   sudo crontab -e
   # Add the following line for daily backup at 2 AM
   0 2 * * * /path/to/smartaihub/scripts/backup-db.sh
   ```

### File Storage Backup

1. **Backup S3 files** (`scripts/backup-files.sh`):
   ```bash
   #!/bin/bash
   
   # Configuration
   SOURCE_BUCKET="smartaihub-files"
   BACKUP_BUCKET="smartaihub-backups"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   # Sync files to backup bucket
   aws s3 sync s3://$SOURCE_BUCKET s3://$BACKUP_BUCKET/files/$DATE
   
   echo "File backup completed: s3://$BACKUP_BUCKET/files/$DATE"
   ```

### Recovery Procedures

1. **Restore database**:
   ```bash
   # Uncompress backup
   gunzip /var/backups/smartaihub/db_backup_20240125_020000.sql.gz
   
   # Restore database
   psql -h localhost -U smartaihub_user -d smartaihub < /var/backups/smartaihub/db_backup_20240125_020000.sql
   ```

2. **Restore files**:
   ```bash
   # List available backups
   aws s3 ls s3://smartaihub-backups/files/
   
   # Restore files from backup
   aws s3 sync s3://smartaihub-backups/files/20240125_020000 s3://smartaihub-files
   ```

### Disaster Recovery Plan

1. **Document recovery procedures**:
   - Contact information for all team members
   - Step-by-step recovery instructions
   - Priority order for service restoration
   - Communication plan for stakeholders

2. **Regular testing**:
   - Test backup restoration monthly
   - Document any issues and update procedures
   - Conduct full disaster recovery drill quarterly

3. **Monitoring and alerts**:
   - Monitor backup success/failure
   - Alert on backup failures
   - Regular backup integrity checks

## Troubleshooting

### Common Issues

1. **Service won't start**:
   - Check environment variables
   - Verify database connection
   - Check port availability
   - Review logs for errors

2. **Database connection issues**:
   - Verify database is running
   - Check connection string
   - Test network connectivity
   - Review database logs

3. **High memory usage**:
   - Check for memory leaks
   - Optimize database queries
   - Adjust memory limits
   - Monitor with profiling tools

4. **Slow performance**:
   - Check database indexes
   - Optimize queries
   - Review caching strategy
   - Monitor resource usage

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set environment variable
export DEBUG=smartaihub:*

# Or in .env file
DEBUG=smartaihub:*
```

### Health Checks

1. **Service health endpoints**:
   - Core Service: `/health`
   - API Gateway: `/health`
   - Frontend: `/health`

2. **Database health check**:
   ```bash
   pg_isready -h localhost -p 5432
   ```

3. **Redis health check**:
   ```bash
   redis-cli ping
   ```

## Security Best Practices

1. **Regular updates**:
   - Keep all dependencies updated
   - Apply security patches promptly
   - Monitor security advisories

2. **Access control**:
   - Use strong passwords
   - Implement 2FA where possible
   - Regular access reviews
   - Principle of least privilege

3. **Network security**:
   - Use firewalls
   - VPN for remote access
   - Network segmentation
   - DDoS protection

4. **Application security**:
   - Input validation
   - SQL injection prevention
   - XSS protection
   - CSRF protection

## Performance Optimization

1. **Database optimization**:
   - Proper indexing
   - Query optimization
   - Connection pooling
   - Read replicas

2. **Caching strategy**:
   - Redis for session storage
   - Application-level caching
   - CDN for static assets
   - Browser caching

3. **Load balancing**:
   - Multiple application instances
   - Load balancer configuration
   - Health checks
   - Failover mechanisms

## Scaling Considerations

1. **Horizontal scaling**:
   - Stateless application design
   - Load balancing
   - Database sharding
   - Microservices architecture

2. **Vertical scaling**:
   - Resource monitoring
   - Performance tuning
   - Hardware upgrades
   - Resource allocation

3. **Auto-scaling**:
   - Cloud provider auto-scaling
   - Metrics-based scaling
   - Scheduled scaling
   - Cost optimization