# Smart AI Hub Deployment Scripts

This directory contains deployment scripts for deploying Smart AI Hub services to a VPS.

## Files

- `deploy.sh` - Bash script for Linux/macOS environments
- `deploy.bat` - Batch script for Windows environments
- `DEPLOYMENT_README.md` - This documentation file

## Prerequisites

Before running the deployment scripts, ensure you have the following installed:

1. **Node.js** (v18 or higher)
2. **npm** (comes with Node.js)
3. **Git**
4. **PM2** (Process Manager for Node.js)
   ```bash
   npm install -g pm2
   ```
5. **PostgreSQL** (for the database)
6. **Redis** (for caching and sessions)

## Environment Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd Smart-AI-Hub
   ```

2. Set up environment variables:

   ```bash
   # Copy example environment files
   cp .env.example .env
   cp packages/auth-service/.env.example packages/auth-service/.env
   cp packages/core-service/.env.example packages/core-service/.env
   cp packages/api-gateway/.env.example packages/api-gateway/.env
   cp packages/mcp-server/.env.example packages/mcp-server/.env
   ```

3. Update the environment files with your actual configuration:
   - Database connection strings
   - Redis connection details
   - JWT secrets
   - API keys and other sensitive information

## Deployment Process

The deployment scripts perform the following steps:

1. **Pull latest code from git**
   - Fetches the latest changes from the main branch

2. **Install dependencies**
   - Runs `npm ci` to install dependencies based on package-lock.json

3. **Run database migrations**
   - Executes Prisma migrations using `npx prisma migrate deploy`
   - Only applies pending migrations

4. **Build all packages**
   - Compiles TypeScript and builds all packages using `npm run build`

5. **Restart services with PM2**
   - Restarts or starts all services:
     - auth-service (port 3001)
     - core-service (port 3002)
     - api-gateway (port 3000)
     - notification-service (port 3003)
     - mcp-server (port 3004)

6. **Health check endpoints**
   - Verifies that services are responding to health checks
   - Reports any services that fail health checks

## Usage

### Linux/macOS

```bash
# Run deployment
./scripts/deploy.sh

# Show help
./scripts/deploy.sh --help

# Dry run (show what would be done without executing)
./scripts/deploy.sh --dry-run

# Verbose output
./scripts/deploy.sh --verbose
```

### Windows

```cmd
# Run deployment
scripts\deploy.bat

# Show help
scripts\deploy.bat --help

# Dry run (show what would be done without executing)
scripts\deploy.bat --dry-run

# Verbose output
scripts\deploy.bat --verbose
```

## Error Handling and Rollback

The deployment scripts include comprehensive error handling:

### Automatic Rollback

If any step fails, the script will automatically:

1. **Restore PM2 processes** - Restart any services that were stopped
2. **Rollback database migrations** - Revert database changes if migrations were applied
3. **Log the error** - Record detailed error information in the log file

### Error Scenarios

1. **Git pull fails** - Script stops immediately, no changes made
2. **Dependency installation fails** - Script stops, no services affected
3. **Migration fails** - Script stops, database remains in previous state
4. **Build fails** - Script stops, existing services continue running
5. **Service restart fails** - Script continues but logs warnings
6. **Health check fails** - Script completes but logs warnings

## Logging

All deployment events are logged to:

- Location: `logs/deployment.log`
- Format: `[YYYY-MM-DD HH:MM:SS] [LEVEL] Message`
- Levels: INFO, WARN, ERROR, DEBUG

## Service Health Checks

The deployment script performs health checks on the following endpoints:

- **Auth Service**: `http://localhost:3001/health`
- **Core Service**: `http://localhost:3002/health`
- **API Gateway**: `http://localhost:3000/health`

### Health Check Configuration

- **Timeout**: 30 seconds per service
- **Interval**: 5 seconds between retries
- **Behavior**: Services continue running even if health checks fail, but warnings are logged

## PM2 Configuration

The scripts use PM2 for process management:

### PM2 Commands

```bash
# List all processes
pm2 list

# View logs for a specific service
pm2 logs auth-service

# Restart a specific service
pm2 restart auth-service

# Stop a specific service
pm2 stop auth-service

# Save current process list
pm2 save

# Generate startup script
pm2 startup
```

### PM2 Ecosystem File

For advanced configuration, you can create an `ecosystem.config.js` file:

```javascript
module.exports = {
  apps: [
    {
      name: 'auth-service',
      script: './packages/auth-service/src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/auth-service-error.log',
      out_file: './logs/auth-service-out.log',
      log_file: './logs/auth-service-combined.log',
      time: true,
    },
    // Add other services here...
  ],
};
```

## Troubleshooting

### Common Issues

1. **Permission denied (Linux/macOS)**

   ```bash
   chmod +x scripts/deploy.sh
   ```

2. **PM2 not found**

   ```bash
   npm install -g pm2
   ```

3. **Database connection failed**
   - Check DATABASE_URL in environment files
   - Verify PostgreSQL is running
   - Check network connectivity

4. **Migration conflicts**
   - Check for manual database changes
   - Review migration files
   - Consider manual migration resolution

5. **Port conflicts**
   - Check if ports are already in use
   - Update port configurations if needed

### Manual Recovery

If automatic rollback fails, you can manually recover:

1. **Restore previous code**

   ```bash
   git checkout <previous-commit-hash>
   ```

2. **Restart services manually**

   ```bash
   pm2 restart all
   ```

3. **Rollback database**
   ```bash
   cd packages/auth-service
   npx prisma migrate reset --force --skip-seed
   npx prisma migrate deploy
   ```

## Monitoring

### PM2 Monitoring

```bash
# Monitor PM2 processes
pm2 monit

# View PM2 logs
pm2 logs

# Check PM2 status
pm2 status
```

### Log Monitoring

Monitor the deployment log:

```bash
tail -f logs/deployment.log
```

### Service Monitoring

Monitor individual service logs:

```bash
# Auth service
pm2 logs auth-service

# Core service
pm2 logs core-service

# API Gateway
pm2 logs api-gateway
```

## Security Considerations

1. **Environment Variables** - Never commit sensitive data to version control
2. **Database Access** - Use least-privilege database users
3. **Firewall Rules** - Only expose necessary ports
4. **SSL/TLS** - Use HTTPS in production
5. **Regular Updates** - Keep dependencies updated

## Production Best Practices

1. **Zero Downtime Deployment**
   - Use load balancers
   - Implement blue-green deployment
   - Use database read replicas during migration

2. **Backup Strategy**
   - Regular database backups
   - Code repository backups
   - Configuration backups

3. **Monitoring and Alerting**
   - Set up application monitoring
   - Configure alerting for failures
   - Monitor system resources

4. **Scaling**
   - Use PM2 cluster mode
   - Implement horizontal scaling
   - Use containerization (Docker)

## Support

For deployment issues:

1. Check the deployment log: `logs/deployment.log`
2. Review PM2 logs: `pm2 logs`
3. Check service-specific logs
4. Verify environment configurations
5. Test database connectivity

## Contributing

When updating deployment scripts:

1. Test on non-production environments first
2. Update this documentation
3. Add error handling for new features
4. Test rollback procedures
