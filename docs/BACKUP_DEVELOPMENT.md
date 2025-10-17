# Smart AI Hub - Backup System Development Guide

## Architecture Overview

The Smart AI Hub Backup System is a containerized, automated backup solution built with Bash scripts and Docker. The system follows a modular architecture with separate components for backup execution, email delivery, and monitoring.

### System Components

```
backup-service (Docker Container)
├── scripts/
│   ├── backup-lightweight.sh    # Main backup execution
│   ├── send-backup-email.sh     # Email delivery
│   └── backup-monitor.sh        # Health monitoring
├── backups/                     # Backup storage directory
└── logs/                        # System logs
```

### Data Flow

```
Cron Trigger → Backup Script → Database Export → Configuration Backup → 
Compression → Verification → Email Delivery → Monitoring Update → Cleanup
```

## Code Structure

### Core Scripts

#### backup-lightweight.sh
**Purpose**: Main backup execution script
**Entry Point**: Called by cron job at 2:00 AM daily
**Key Functions**:
- `validate_environment()` - Environment validation
- `backup_critical_tables()` - Database table exports
- `backup_recent_transactions()` - Transaction data export
- `backup_configuration()` - Configuration file backup
- `create_compressed_backup()` - Archive creation
- `verify_backup()` - Integrity verification
- `cleanup_old_backups()` - Retention management

#### send-backup-email.sh
**Purpose**: Email delivery for backup files and alerts
**Entry Point**: Called by backup script and monitoring script
**Key Functions**:
- `generate_success_email_body()` - Success notification HTML
- `generate_failure_email_body()` - Failure alert HTML
- `send_email_with_retry()` - Retry logic for email delivery
- `send_success_email()` - Success email handling
- `send_failure_email()` - Failure email handling

#### backup-monitor.sh
**Purpose**: Health monitoring and alerting
**Entry Point**: Docker healthcheck and manual execution
**Key Functions**:
- `check_last_backup_time()` - Backup age verification
- `check_backup_size()` - Size validation
- `check_backup_files()` - File integrity checks
- `check_disk_space()` - Storage monitoring
- `check_database_connectivity()` - Database health
- `run_health_checks()` - Comprehensive health assessment

### Configuration Management

#### Environment Variables
```bash
# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=smart_ai_hub
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# Backup Settings
BACKUP_RETENTION_DAYS=30
BACKUP_MAX_SIZE_MB=100
BACKUP_MIN_SIZE_MB=1
BACKUP_MAX_AGE_HOURS=25
```

#### Docker Configuration
```dockerfile
FROM postgres:15-alpine
# Install required packages
# Create backup user
# Configure cron and ssmtp
# Set up health checks
```

## Development Setup

### Prerequisites
- Docker and Docker Compose
- PostgreSQL 15+
- Bash shell
- SMTP server access (Gmail recommended)

### Local Development Environment

1. **Clone Repository**
   ```bash
   git clone https://github.com/naibarn/Smart-AI-Hub.git
   cd Smart-AI-Hub
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   # Update with local configuration
   ```

3. **Start Development Environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Build Backup Service**
   ```bash
   docker build -f Dockerfile.backup -t backup-service .
   ```

5. **Test Backup Script**
   ```bash
   docker run --rm \
     -v $(pwd)/backups:/backups \
     -v $(pwd)/scripts:/scripts:ro \
     --env-file .env.local \
     backup-service /scripts/backup-lightweight.sh
   ```

## Adding New Backup Targets

### Database Tables

To add new database tables to the backup:

1. **Update backup-lightweight.sh**
   ```bash
   # Add to backup_critical_tables() function
   local tables=(
       "users"
       "user_roles"
       "organizations"
       "new_table"  # Add your new table
       # ... other tables
   )
   ```

2. **Update Documentation**
   - Modify `BACKUP_INFO.txt` template
   - Update user documentation
   - Update specification document

### Configuration Files

To add new configuration files to backup:

1. **Update backup-lightweight.sh**
   ```bash
   # Add to backup_configuration() function
   local config_files=(
       "/config/.env.production:.env.production"
       "/config/new-config.conf:new-config.conf"  # Add new config
       # ... other files
   )
   ```

2. **Mount New Files in Docker Compose**
   ```yaml
   volumes:
     - ./new-config.conf:/config/new-config.conf:ro
   ```

### Custom Backup Logic

For complex backup requirements:

1. **Create New Function**
   ```bash
   backup_custom_data() {
       log_info "Backing up custom data..."
       local custom_dir="$TEMP_DIR/custom"
       mkdir -p "$custom_dir"
       
       # Add your custom backup logic here
       
       log_info "Custom data backup completed"
   }
   ```

2. **Integrate into Main Flow**
   ```bash
   main() {
       # ... existing backup steps
       backup_custom_data  # Add your function
       # ... continue with compression
   }
   ```

## Email Template Customization

### Success Email Template

Modify `generate_success_email_body()` function in `send-backup-email.sh`:

```bash
generate_success_email_body() {
    local backup_file="$1"
    # Customize HTML template
    cat << EOF
<!DOCTYPE html>
<html>
<head>
    <!-- Add custom styles -->
</head>
<body>
    <!-- Add custom content -->
</body>
</html>
EOF
}
```

### Failure Email Template

Modify `generate_failure_email_body()` function:

```bash
generate_failure_email_body() {
    local backup_file="$1"
    local error_message="$2"
    # Customize failure alert template
}
```

### Adding New Email Types

1. **Create New Template Function**
   ```bash
   generate_custom_email_body() {
       local param1="$1"
       local param2="$2"
       # Custom template logic
   }
   ```

2. **Add Email Sending Function**
   ```bash
   send_custom_email() {
       local param1="$1"
       local param2="$2"
       
       local body_file="/tmp/custom_email_$$.html"
       generate_custom_email_body "$param1" "$param2" > "$body_file"
       
       local subject="Custom Alert - $(date '+%Y-%m-%d')"
       send_email_with_retry "$ADMIN_EMAILS" "$subject" "$body_file" ""
   }
   ```

## Monitoring Enhancements

### Adding New Health Checks

1. **Create Check Function**
   ```bash
   check_custom_metric() {
       log_info "Checking custom metric..."
       
       # Implement check logic
       if [[ condition ]]; then
           log_info "Custom metric check passed"
           return 0
       else
           log_error "Custom metric check failed"
           return 1
       fi
   }
   ```

2. **Integrate into Health Check Suite**
   ```bash
   run_health_checks() {
       # ... existing checks
       
       # Add custom check
       if check_custom_metric; then
           ((checks_passed++))
       else
           ((checks_failed++))
           failed_checks+=("Custom metric")
       fi
       
       # ... continue with existing logic
   }
   ```

### Custom Alerts

1. **Create Alert Function**
   ```bash
   send_custom_alert() {
       local alert_type="$1"
       local alert_message="$2"
       
       # Create custom alert email
       local body_file="/tmp/custom_alert_$$.html"
       # Generate custom alert template
       
       # Send alert
       send_monitoring_alert "$alert_type" "$alert_message"
   }
   ```

## Testing

### Unit Testing

Test individual functions:

```bash
# Test database connectivity
test_database_connectivity() {
    # Set up test environment
    # Execute check_database_connectivity
    # Verify result
}

# Test email sending
test_email_delivery() {
    # Use test SMTP server
    # Verify email content
    # Check delivery status
}
```

### Integration Testing

Test complete backup flow:

```bash
#!/bin/bash
# integration-test.sh

set -e

echo "Starting backup integration test..."

# Set up test environment
export TEST_MODE=true
export POSTGRES_PASSWORD=test_password
export ADMIN_EMAILS=test@example.com

# Run backup
./scripts/backup-lightweight.sh

# Verify backup file exists
if [[ ! -f /backups/critical_backup_*.tar.gz ]]; then
    echo "ERROR: Backup file not created"
    exit 1
fi

# Verify backup integrity
latest_backup=$(ls -t /backups/critical_backup_*.tar.gz | head -1)
if ! gzip -t "$latest_backup"; then
    echo "ERROR: Backup file integrity check failed"
    exit 1
fi

echo "Integration test passed!"
```

### Performance Testing

Monitor backup performance:

```bash
#!/bin/bash
# performance-test.sh

start_time=$(date +%s)

# Run backup
./scripts/backup-lightweight.sh

end_time=$(date +%s)
duration=$((end_time - start_time))

echo "Backup completed in ${duration} seconds"

if [[ $duration -gt 600 ]]; then
    echo "WARNING: Backup took longer than 10 minutes"
fi
```

## Debugging

### Common Issues

#### Backup Script Fails
1. Check environment variables:
   ```bash
   docker exec backup-service env | grep BACKUP
   ```

2. Check script permissions:
   ```bash
   docker exec backup-service ls -la /scripts/
   ```

3. Review logs:
   ```bash
   docker exec backup-service tail -50 /var/log/backup.log
   ```

#### Email Delivery Issues
1. Test SMTP configuration:
   ```bash
   docker exec backup-service /scripts/send-backup-email.sh SUCCESS "test_file.tar.gz"
   ```

2. Check SMTP logs:
   ```bash
   docker exec backup-service tail -20 /var/log/mail.log
   ```

#### Database Connection Issues
1. Test connectivity:
   ```bash
   docker exec backup-service pg_isready -h postgres -U postgres
   ```

2. Check database credentials:
   ```bash
   docker exec backup-service psql -h postgres -U postgres -l
   ```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export LOG_LEVEL=debug

# Run backup with debug output
./scripts/backup-lightweight.sh 2>&1 | tee debug.log
```

## Deployment

### Production Deployment

1. **Build Production Image**
   ```bash
   docker build -f Dockerfile.backup -t smartaihub/backup-service:latest .
   ```

2. **Update Docker Compose**
   ```yaml
   backup-service:
     image: smartaihub/backup-service:latest
     # ... configuration
   ```

3. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d backup-service
   ```

4. **Verify Deployment**
   ```bash
   docker ps | grep backup-service
   docker exec backup-service /scripts/backup-monitor.sh status
   ```

### Rolling Updates

1. **Update Service**
   ```bash
   docker-compose -f docker-compose.prod.yml pull backup-service
   ```

2. **Restart with Zero Downtime**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --no-deps backup-service
   ```

3. **Verify Update**
   ```bash
   docker exec backup-service /scripts/backup-monitor.sh health-check
   ```

## Contributing

### Code Standards

- Use Bash 4.0+ features
- Follow shellcheck recommendations
- Use `set -euo pipefail` for error handling
- Implement comprehensive logging
- Add function documentation

### Pull Request Process

1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit pull request
5. Code review and approval
6. Merge to main branch

### Testing Requirements

- Unit tests for new functions
- Integration tests for workflow changes
- Performance tests for optimization
- Documentation updates for all changes

---

**Version**: 1.0  
**Last Updated**: 2025-10-17  
**Maintainers**: Development Team

For technical questions or contributions, please contact the development team.