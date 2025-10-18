# Smart AI Hub - Backup System Operations Guide

## Overview

This guide provides operational procedures for managing the Smart AI Hub Backup System in production environments. It covers daily operations, troubleshooting, maintenance, and emergency procedures.

## Daily Operations

### Monitoring Backup Status

#### Check Backup Service Status

```bash
# Verify backup service is running
docker ps | grep backup-service

# Check service health
docker exec backup-service /scripts/backup-monitor.sh health-check

# View backup status summary
docker exec backup-service /scripts/backup-monitor.sh status
```

#### Review Backup Logs

```bash
# Check recent backup logs
docker exec backup-service tail -50 /var/log/backup.log

# Monitor backup execution in real-time
docker exec backup-service tail -f /var/log/backup.log

# Check for errors in the last 24 hours
docker exec backup-service grep "ERROR" /var/log/backup.log | tail -10
```

#### Verify Email Delivery

```bash
# Check email delivery logs
docker exec backup-service tail -20 /var/log/mail.log

# Test email configuration
docker exec backup-service /scripts/send-backup-email.sh SUCCESS "test_backup.tar.gz"
```

### Backup File Management

#### List Available Backups

```bash
# List all backup files
docker exec backup-service ls -la /backups/critical_backup_*.tar.gz

# Show backup file sizes
docker exec backup-service du -h /backups/critical_backup_*.tar.gz

# Check backup retention
docker exec backup-service find /backups -name "critical_backup_*.tar.gz" -mtime +30
```

#### Manual Backup Operations

```bash
# Trigger immediate backup
docker exec backup-service /scripts/backup-lightweight.sh

# Trigger backup with custom retention
BACKUP_RETENTION_DAYS=7 docker exec backup-service /scripts/backup-lightweight.sh

# Backup specific tables only
docker exec backup-service bash -c "
  tables=('users' 'organizations')
  for table in \"\${tables[@]}\"; do
    PGPASSWORD=\$POSTGRES_PASSWORD pg_dump -h \$POSTGRES_HOST -p \$POSTGRES_PORT -U \$POSTGRES_USER -d \$POSTGRES_DB --table=\"\$table\" > /backups/manual_\${table}_\$(date +%Y%m%d).sql
  done
"
```

## Troubleshooting Procedures

### Common Issues and Solutions

#### Backup Service Not Running

**Symptoms**: No backup emails, service not in docker ps output

**Diagnosis**:

```bash
# Check if service exists
docker ps -a | grep backup-service

# Check service logs
docker logs backup-service

# Check docker-compose configuration
docker-compose -f docker-compose.prod.yml config | grep backup-service
```

**Solutions**:

```bash
# Restart backup service
docker-compose -f docker-compose.prod.yml restart backup-service

# Rebuild and restart service
docker-compose -f docker-compose.prod.yml up -d --force-recreate backup-service

# Check environment variables
docker exec backup-service env | grep -E "(POSTGRES|SMTP|ADMIN)"
```

#### Backup Failures

**Symptoms**: Failure alert emails, error messages in logs

**Diagnosis**:

```bash
# Check recent backup logs
docker exec backup-service tail -100 /var/log/backup.log | grep -A 10 -B 10 "ERROR"

# Check database connectivity
docker exec backup-service pg_isready -h postgres -U postgres

# Check disk space
docker exec backup-service df -h /backups

# Check database access
docker exec backup-service psql -h postgres -U postgres -d smart_ai_hub -c "SELECT 1;"
```

**Solutions**:

```bash
# Fix database connectivity issues
docker exec backup-service bash -c "
  export PGPASSWORD=\$POSTGRES_PASSWORD
  pg_isready -h \$POSTGRES_HOST -p \$POSTGRES_PORT -U \$POSTGRES_USER -d \$POSTGRES_DB
"

# Clean up disk space
docker exec backup-service find /backups -name "critical_backup_*.tar.gz" -mtime +7 -delete

# Fix permissions
docker exec backup-service chown -R backup:backup /backups /var/log
```

#### Email Delivery Issues

**Symptoms**: No backup emails, email failure alerts

**Diagnosis**:

```bash
# Test SMTP configuration
docker exec backup-service bash -c "
  echo 'Test email' | mail -s 'Test' test@example.com
"

# Check SMTP settings
docker exec backup-service env | grep SMTP

# Check email logs
docker exec backup-service tail -50 /var/log/mail.log
```

**Solutions**:

```bash
# Update SMTP configuration
docker-compose -f docker-compose.prod.yml down backup-service
# Update .env.production with correct SMTP settings
docker-compose -f docker-compose.prod.yml up -d backup-service

# Test with different SMTP server
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-app-password
```

#### Large Backup Files

**Symptoms**: Backup files > 100MB, email delivery failures

**Diagnosis**:

```bash
# Check backup file sizes
docker exec backup-service du -h /backups/critical_backup_*.tar.gz | sort -hr

# Analyze backup contents
docker exec backup-service bash -c "
  latest_backup=\$(ls -t /backups/critical_backup_*.tar.gz | head -1)
  tar -tzf \"\$latest_backup\" | head -20
"
```

**Solutions**:

```bash
# Reduce backup retention period
export BACKUP_RETENTION_DAYS=7
docker exec backup-service /scripts/backup-lightweight.sh

# Exclude large tables from backup
# Edit scripts/backup-lightweight.sh to remove large tables

# Implement data archiving
docker exec backup-service psql -h postgres -U postgres -d smart_ai_hub -c "
  -- Archive old transactions
  CREATE TABLE credit_transactions_archive AS SELECT * FROM credit_transactions WHERE created_at < NOW() - INTERVAL '6 months';
  DELETE FROM credit_transactions WHERE created_at < NOW() - INTERVAL '6 months';
"
```

## Maintenance Procedures

### Weekly Maintenance

#### System Health Check

```bash
#!/bin/bash
# weekly-maintenance.sh

echo "=== Weekly Backup System Health Check ==="

# Check service status
echo "1. Checking backup service status..."
docker ps | grep backup-service || echo "ERROR: Backup service not running"

# Check recent backups
echo "2. Checking recent backups..."
recent_backups=$(docker exec backup-service find /backups -name "critical_backup_*.tar.gz" -mtime -7 | wc -l)
echo "Recent backups (last 7 days): $recent_backups"

# Check disk space
echo "3. Checking disk space..."
docker exec backup-service df -h /backups

# Check backup sizes
echo "4. Checking backup file sizes..."
docker exec backup-service du -h /backups/critical_backup_*.tar.gz | tail -5

# Run health check
echo "5. Running comprehensive health check..."
docker exec backup-service /scripts/backup-monitor.sh health-check

echo "=== Weekly health check completed ==="
```

#### Log Rotation

```bash
#!/bin/bash
# log-rotation.sh

# Rotate backup logs
docker exec backup-service bash -c "
  if [[ -f /var/log/backup.log ]]; then
    cp /var/log/backup.log /var/log/backup.log.\$(date +%Y%m%d)
    > /var/log/backup.log
  fi
"

# Keep last 30 days of logs
docker exec backup-service find /var/log -name "backup.log.*" -mtime +30 -delete

# Rotate mail logs
docker exec backup-service bash -c "
  if [[ -f /var/log/mail.log ]]; then
    cp /var/log/mail.log /var/log/mail.log.\$(date +%Y%m%d)
    > /var/log/mail.log
  fi
"

docker exec backup-service find /var/log -name "mail.log.*" -mtime +30 -delete
```

### Monthly Maintenance

#### Backup Verification

```bash
#!/bin/bash
# monthly-backup-verification.sh

echo "=== Monthly Backup Verification ==="

# Select a random backup from last month
backup_file=$(docker exec backup-service bash -c "
  find /backups -name 'critical_backup_*.tar.gz' -mtime -30 -mtime -7 | sort -R | head -1
")

if [[ -n "$backup_file" ]]; then
  echo "Testing backup: $backup_file"

  # Extract to temporary location
  docker exec backup-service bash -c "
    mkdir -p /tmp/backup_test
    cd /tmp/backup_test
    tar -xzf $backup_file

    # Verify database files
    if [[ -f database/users.sql ]]; then
      echo '✓ Database files present'
    else
      echo '✗ Database files missing'
    fi

    # Verify configuration files
    if [[ -f config/.env.production ]]; then
      echo '✓ Configuration files present'
    else
      echo '✗ Configuration files missing'
    fi

    # Verify backup info
    if [[ -f BACKUP_INFO.txt ]]; then
      echo '✓ Backup info present'
    else
      echo '✗ Backup info missing'
    fi

    # Cleanup
    rm -rf /tmp/backup_test
  "
else
  echo "No suitable backup found for verification"
fi

echo "=== Monthly verification completed ==="
```

#### Performance Analysis

```bash
#!/bin/bash
# performance-analysis.sh

echo "=== Backup Performance Analysis ==="

# Analyze backup times
docker exec backup-service bash -c "
  echo 'Last 7 days backup performance:'
  grep 'Backup completed successfully' /var/log/backup.log | tail -7 | while read line; do
    timestamp=\$(echo \$line | grep -o '\[.*\]' | sed 's/\[//;s/\]//')
    echo \"\$timestamp\"
  done
"

# Analyze backup sizes
docker exec backup-service bash -c "
  echo 'Backup size trend (last 7 days):'
  find /backups -name 'critical_backup_*.tar.gz' -mtime -7 -exec du -h {} \; | sort
"

# Check for performance issues
echo "Checking for performance warnings..."
docker exec backup-service grep -i "slow\|timeout\|warning" /var/log/backup.log | tail -10

echo "=== Performance analysis completed ==="
```

## Emergency Procedures

### Complete System Restore

#### Emergency Restore Procedure

```bash
#!/bin/bash
# emergency-restore.sh

BACKUP_FILE="$1"
RESTORE_DIR="/tmp/emergency_restore_$(date +%Y%m%d_%H%M%S)"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup_file.tar.gz>"
  exit 1
fi

echo "=== EMERGENCY RESTORE PROCEDURE ==="
echo "Backup file: $BACKUP_FILE"
echo "Restore directory: $RESTORE_DIR"
echo "Started at: $(date)"

# Stop all services
echo "1. Stopping all services..."
docker-compose -f docker-compose.prod.yml down

# Create restore directory
echo "2. Setting up restore environment..."
mkdir -p "$RESTORE_DIR"
cd "$RESTORE_DIR"

# Extract backup
echo "3. Extracting backup..."
docker run --rm -v "$(pwd)/backups:/backups" -v "$(pwd):/restore" postgres:15-alpine tar -xzf "/backups/$BACKUP_FILE" -C /restore

# Restore database
echo "4. Restoring database..."
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 30

# Wait for database to be ready
echo "4a. Waiting for database..."
until docker exec postgres pg_isready -U postgres; do
  sleep 5
done

# Restore database tables
for sql_file in database/*.sql; do
  if [[ -f "$sql_file" ]]; then
    echo "Restoring: $sql_file"
    docker exec -i postgres psql -U postgres smart_ai_hub < "$sql_file"
  fi
done

# Restore transactions
echo "4b. Restoring transaction data..."
for csv_file in database/*.csv; do
  if [[ -f "$csv_file" ]]; then
    table_name=$(basename "$csv_file" .csv)
    echo "Restoring transactions: $table_name"
    docker cp "$csv_file" postgres:/tmp/
    docker exec postgres psql -U postgres smart_ai_hub -c "\\COPY $table_name FROM '/tmp/$(basename $csv_file)' CSV HEADER"
  fi
done

# Restore configuration
echo "5. Restoring configuration files..."
if [[ -f config/.env.production ]]; then
  cp config/.env.production .env.production
  echo "✓ Restored .env.production"
fi

if [[ -f config/docker-compose.prod.yml ]]; then
  cp config/docker-compose.prod.yml docker-compose.prod.yml
  echo "✓ Restored docker-compose.prod.yml"
fi

if [[ -f config/nginx.prod.conf ]]; then
  cp config/nginx.prod.conf nginx.prod.conf
  echo "✓ Restored nginx.prod.conf"
fi

if [[ -d config/ssl ]]; then
  cp -r config/ssl ./
  echo "✓ Restored SSL certificates"
fi

# Start all services
echo "6. Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "7. Waiting for services to start..."
sleep 60

# Verify restore
echo "8. Verifying restore..."
curl -f http://localhost/health || echo "WARNING: Health check failed"

# Cleanup
echo "9. Cleaning up..."
rm -rf "$RESTORE_DIR"

echo "=== EMERGENCY RESTORE COMPLETED ==="
echo "Completed at: $(date)"
echo "Please verify all services are functioning correctly"
```

### Service Recovery

#### Backup Service Recovery

```bash
#!/bin/bash
# backup-service-recovery.sh

echo "=== Backup Service Recovery ==="

# Check service status
echo "1. Checking backup service status..."
if ! docker ps | grep -q backup-service; then
  echo "Backup service is not running"

  # Check if container exists
  if docker ps -a | grep -q backup-service; then
    echo "Restarting existing container..."
    docker start backup-service
  else
    echo "Creating new container..."
    docker-compose -f docker-compose.prod.yml up -d backup-service
  fi
else
  echo "Backup service is running"
fi

# Check service health
echo "2. Checking service health..."
sleep 10
if docker exec backup-service /scripts/backup-monitor.sh health-check; then
  echo "✓ Service health check passed"
else
  echo "✗ Service health check failed"

  # Recreate service
  echo "Recreating backup service..."
  docker-compose -f docker-compose.prod.yml down backup-service
  docker-compose -f docker-compose.prod.yml up -d backup-service

  sleep 20
  docker exec backup-service /scripts/backup-monitor.sh health-check
fi

# Test manual backup
echo "3. Testing manual backup..."
if docker exec backup-service /scripts/backup-lightweight.sh; then
  echo "✓ Manual backup test passed"
else
  echo "✗ Manual backup test failed"
  exit 1
fi

echo "=== Backup service recovery completed ==="
```

### Data Recovery

#### Partial Data Recovery

```bash
#!/bin/bash
# partial-data-recovery.sh

BACKUP_FILE="$1"
TABLE_NAME="$2"

if [[ -z "$BACKUP_FILE" || -z "$TABLE_NAME" ]]; then
  echo "Usage: $0 <backup_file.tar.gz> <table_name>"
  exit 1
fi

echo "=== Partial Data Recovery ==="
echo "Backup: $BACKUP_FILE"
echo "Table: $TABLE_NAME"

# Extract specific table
echo "1. Extracting table data..."
docker run --rm -v "$(pwd)/backups:/backups" -v "$(pwd)":/restore postgres:15-alpine bash -c "
  cd /restore
  tar -xzf /backups/$BACKUP_FILE database/$TABLE_NAME.sql
"

# Restore table
echo "2. Restoring table..."
if [[ -f "database/$TABLE_NAME.sql" ]]; then
  docker exec -i postgres psql -U postgres smart_ai_hub < "database/$TABLE_NAME.sql"
  echo "✓ Table $TABLE_NAME restored"
else
  echo "✗ Table $TABLE_NAME not found in backup"
  exit 1
fi

# Cleanup
rm -rf database/

echo "=== Partial recovery completed ==="
```

## Monitoring and Alerting

### Health Check Automation

#### Automated Health Monitoring

```bash
#!/bin/bash
# health-monitor.sh

# Check backup service health
if ! docker exec backup-service /scripts/backup-monitor.sh health-check; then
  echo "ALERT: Backup service health check failed"

  # Send alert to administrators
  docker exec backup-service /scripts/send-backup-email.sh "FAILURE" "health_monitor_$(date +%Y%m%d_%H%M%S)" "Backup service health check failed"

  # Attempt automatic recovery
  echo "Attempting automatic recovery..."
  ./backup-service-recovery.sh
fi

# Check backup age
last_backup_age=$(docker exec backup-service bash -c "
  if [[ -f /backups/.last_backup_success ]]; then
    last_backup=\$(cat /backups/.last_backup_success)
    current=\$(date +%s)
    echo \$(( (current - last_backup) / 3600 ))
  else
    echo 999
  fi
")

if [[ $last_backup_age -gt 25 ]]; then
  echo "ALERT: Last backup is $last_backup_age hours old"

  # Send alert
  docker exec backup-service /scripts/send-backup-email.sh "FAILURE" "backup_age_$(date +%Y%m%d_%H%M%S)" "Last backup is $last_backup_age hours old"
fi

# Check disk space
available_space=$(docker exec backup-service df /backups | awk 'NR==2 {print $4}')
if [[ $available_space -lt 1048576 ]]; then  # Less than 1GB
  echo "ALERT: Low disk space - ${available_space}KB available"

  # Send alert
  docker exec backup-service /scripts/send-backup-email.sh "FAILURE" "disk_space_$(date +%Y%m%d_%H%M%S)" "Low disk space: ${available_space}KB available"

  # Clean up old backups
  docker exec backup-service find /backups -name "critical_backup_*.tar.gz" -mtime +7 -delete
fi
```

### Performance Monitoring

#### Backup Performance Metrics

```bash
#!/bin/bash
# performance-metrics.sh

# Collect backup metrics
echo "=== Backup Performance Metrics ==="

# Backup duration
echo "1. Backup duration analysis..."
docker exec backup-service bash -c "
  echo 'Last 7 backup durations:'
  grep 'Backup completed successfully' /var/log/backup.log | tail -7 | while read line; do
    start_time=\$(echo \$line | grep -o '\[.*\]' | sed 's/\[//;s/\]//')
    echo \"\$start_time\"
  done
"

# Backup size trends
echo "2. Backup size trends..."
docker exec backup-service bash -c "
  echo 'Last 7 backup sizes:'
  find /backups -name 'critical_backup_*.tar.gz' -mtime -7 -exec du -h {} \; | sort -n
"

# Success rate
echo "3. Backup success rate..."
total_backups=$(docker exec backup-service find /backups -name "critical_backup_*.tar.gz" -mtime -7 | wc -l)
successful_backups=$(docker exec backup-service grep -c "Backup completed successfully" /var/log/backup.log | tail -7)
echo "Success rate: $successful_backups/$total_backups backups"

echo "=== Performance metrics collected ==="
```

## Security Procedures

### Access Control

#### Backup Access Management

```bash
#!/bin/bash
# backup-access-control.sh

# Set proper permissions
echo "1. Setting backup directory permissions..."
docker exec backup-service chown -R backup:backup /backups
docker exec backup-service chmod 700 /backups
docker exec backup-service chmod 600 /backups/critical_backup_*.tar.gz

# Set log permissions
echo "2. Setting log permissions..."
docker exec backup-service chown -R backup:backup /var/log
docker exec backup-service chmod 640 /var/log/backup.log
docker exec backup-service chmod 640 /var/log/mail.log

# Verify permissions
echo "3. Verifying permissions..."
docker exec backup-service ls -la /backups/
docker exec backup-service ls -la /var/log/

echo "=== Access control updated ==="
```

### Security Auditing

#### Backup Security Audit

```bash
#!/bin/bash
# security-audit.sh

echo "=== Backup Security Audit ==="

# Check for exposed credentials
echo "1. Checking for exposed credentials..."
if docker exec backup-service grep -i "password\|secret\|key" /var/log/backup.log | head -5; then
  echo "WARNING: Potential credential exposure in logs"
else
  echo "✓ No credential exposure detected"
fi

# Check file permissions
echo "2. Checking file permissions..."
docker exec backup-service find /backups -type f -perm /o+r | head -5
if [[ $? -eq 0 ]]; then
  echo "WARNING: Some backup files are world-readable"
else
  echo "✓ Backup file permissions are secure"
fi

# Check email security
echo "3. Checking email configuration..."
docker exec backup-service env | grep SMTP | grep -v "PASS" | head -5

# Check for unauthorized access
echo "4. Checking for unauthorized access..."
docker exec backup-service grep -i "unauthorized\|forbidden\|denied" /var/log/backup.log | tail -5

echo "=== Security audit completed ==="
```

---

**Version**: 1.0  
**Last Updated**: 2025-10-17  
**Maintainers**: Operations Team

For operational support and emergencies, contact the operations team immediately.
