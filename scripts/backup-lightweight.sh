#!/bin/bash

#=============================================================================
# Smart AI Hub - Lightweight Backup Script
# Author: Development Team
# Description: Creates lightweight backups of critical data only
# Version: 1.0
#=============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
TEMP_DIR="/tmp/backup_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/var/log/backup.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="critical_backup_${TIMESTAMP}.tar.gz"
MAX_SIZE_MB=100
MIN_SIZE_MB=1

# Database configuration
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-smart_ai_hub}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Email configuration
ADMIN_EMAILS="${ADMIN_EMAILS:-admin@example.com}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

#=============================================================================
# Logging Functions
#=============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO: $1"
    echo -e "${GREEN}INFO: $1${NC}"
}

log_warn() {
    log "WARN: $1"
    echo -e "${YELLOW}WARN: $1${NC}"
}

log_error() {
    log "ERROR: $1"
    echo -e "${RED}ERROR: $1${NC}"
}

#=============================================================================
# Error Handling
#=============================================================================

cleanup() {
    log_info "Cleaning up temporary directory: $TEMP_DIR"
    rm -rf "$TEMP_DIR" 2>/dev/null || true
}

handle_error() {
    local exit_code=$?
    log_error "Backup failed with exit code $exit_code"
    cleanup
    
    # Send failure alert
    /scripts/send-backup-email.sh "FAILURE" "$BACKUP_FILE" "Backup failed: $1"
    exit $exit_code
}

trap 'handle_error "Unexpected error occurred"' ERR
trap cleanup EXIT

#=============================================================================
# Validation Functions
#=============================================================================

validate_environment() {
    log_info "Validating environment..."
    
    # Check required environment variables
    if [[ -z "${DB_PASSWORD:-}" ]]; then
        handle_error "POSTGRES_PASSWORD environment variable is required"
    fi
    
    if [[ -z "${ADMIN_EMAILS:-}" ]]; then
        handle_error "ADMIN_EMAILS environment variable is required"
    fi
    
    # Check required directories
    mkdir -p "$BACKUP_DIR" "$TEMP_DIR"
    
    # Test database connection
    if ! PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        handle_error "Cannot connect to PostgreSQL database"
    fi
    
    log_info "Environment validation completed"
}

check_disk_space() {
    log_info "Checking available disk space..."
    
    local available_mb=$(df "$BACKUP_DIR" | awk 'NR==2 {print int($4/1024)}')
    local required_mb=500  # Minimum 500MB required
    
    if [[ $available_mb -lt $required_mb ]]; then
        handle_error "Insufficient disk space. Available: ${available_mb}MB, Required: ${required_mb}MB"
    fi
    
    log_info "Disk space check passed. Available: ${available_mb}MB"
}

#=============================================================================
# Database Backup Functions
#=============================================================================

backup_critical_tables() {
    log_info "Starting database backup..."
    
    local db_dir="$TEMP_DIR/database"
    mkdir -p "$db_dir"
    
    # List of critical tables to backup
    local tables=(
        "users"
        "user_roles"
        "organizations"
        "agencies"
        "referrals"
        "exchange_rates"
        "system_settings"
        "roles"
        "permissions"
        "role_permissions"
    )
    
    # Backup critical tables
    for table in "${tables[@]}"; do
        log_info "Backing up table: $table"
        if ! PGPASSWORD="$DB_PASSWORD" pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --table="$table" \
            --no-owner \
            --no-privileges \
            --clean \
            --if-exists \
            > "$db_dir/${table}.sql" 2>/dev/null; then
            log_warn "Failed to backup table: $table (table may not exist)"
        fi
    done
    
    log_info "Database tables backup completed"
}

backup_recent_transactions() {
    log_info "Backing up recent transactions (last 3 months)..."
    
    local db_dir="$TEMP_DIR/database"
    local three_months_ago=$(date -d "3 months ago" +%Y-%m-%d)
    
    # Backup recent credit transactions
    log_info "Backing up credit transactions since $three_months_ago"
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "\\COPY (SELECT * FROM credit_transactions WHERE created_at >= '$three_months_ago') TO '$db_dir/credit_transactions.csv' CSV HEADER" 2>/dev/null || log_warn "No credit_transactions table found"
    
    # Backup recent point transactions
    log_info "Backing up point transactions since $three_months_ago"
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "\\COPY (SELECT * FROM point_transactions WHERE created_at >= '$three_months_ago') TO '$db_dir/point_transactions.csv' CSV HEADER" 2>/dev/null || log_warn "No point_transactions table found"
    
    # Backup recent purchases
    log_info "Backing up purchases since $three_months_ago"
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "\\COPY (SELECT * FROM purchases WHERE created_at >= '$three_months_ago') TO '$db_dir/purchases.csv' CSV HEADER" 2>/dev/null || log_warn "No purchases table found"
    
    log_info "Recent transactions backup completed"
}

#=============================================================================
# Configuration Backup Functions
#=============================================================================

backup_configuration() {
    log_info "Backing up configuration files..."
    
    local config_dir="$TEMP_DIR/config"
    mkdir -p "$config_dir"
    
    # List of configuration files to backup
    local config_files=(
        "/config/.env.production:.env.production"
        "/config/docker-compose.prod.yml:docker-compose.prod.yml"
        "/config/nginx.prod.conf:nginx.prod.conf"
    )
    
    # Backup configuration files
    for config_file in "${config_files[@]}"; do
        local source="${config_file%:*}"
        local dest="${config_file#*:}"
        
        if [[ -f "$source" ]]; then
            log_info "Backing up: $dest"
            cp "$source" "$config_dir/$dest"
        else
            log_warn "Configuration file not found: $source"
        fi
    done
    
    # Backup SSL certificates if available
    if [[ -d "/config/ssl" ]]; then
        log_info "Backing up SSL certificates"
        cp -r "/config/ssl" "$config_dir/"
    else
        log_warn "SSL directory not found: /config/ssl"
    fi
    
    log_info "Configuration backup completed"
}

#=============================================================================
# Backup Information and Summary
#=============================================================================

create_backup_info() {
    log_info "Creating backup information file..."
    
    local info_file="$TEMP_DIR/BACKUP_INFO.txt"
    
    cat > "$info_file" << EOF
Smart AI Hub - Critical Backup Information
==========================================

Backup Details:
- Backup Date: $(date '+%Y-%m-%d %H:%M:%S %Z')
- Backup Type: Lightweight (Critical Data Only)
- Version: 1.0
- Retention: $RETENTION_DAYS days

Contents:
- Database: Critical tables + last 3 months transactions
- Configuration: .env, docker-compose, nginx, SSL certificates
- Scope: Essential data for system restoration

Database Tables Included:
- users, user_roles, organizations, agencies
- referrals, exchange_rates, system_settings
- roles, permissions, role_permissions

Recent Data (Last 3 Months):
- credit_transactions.csv
- point_transactions.csv  
- purchases.csv

Restore Instructions:
====================

1. Extract backup file:
   tar -xzf $BACKUP_FILE

2. Restore database:
   # Restore critical tables
   for sql_file in database/*.sql; do
     psql -U postgres smart_ai_hub < "\$sql_file"
   done
   
   # Restore recent transactions
   psql -U postgres smart_ai_hub -c "\\COPY credit_transactions FROM 'database/credit_transactions.csv' CSV HEADER"
   psql -U postgres smart_ai_hub -c "\\COPY point_transactions FROM 'database/point_transactions.csv' CSV HEADER"
   psql -U postgres smart_ai_hub -c "\\COPY purchases FROM 'database/purchases.csv' CSV HEADER"

3. Restore configuration:
   cp config/.env.production /path/to/project/
   cp config/docker-compose.prod.yml /path/to/project/
   cp config/nginx.prod.conf /path/to/project/
   cp -r config/ssl /path/to/project/

4. Restart services:
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d

5. Verify system:
   curl https://yourdomain.com/health

Support:
========
For restore assistance, contact: $ADMIN_EMAILS

EOF

    log_info "Backup information file created"
}

#=============================================================================
# Compression and Verification
#=============================================================================

create_compressed_backup() {
    log_info "Creating compressed backup archive..."
    
    cd "$TEMP_DIR"
    
    if ! tar -czf "$BACKUP_DIR/$BACKUP_FILE" .; then
        handle_error "Failed to create compressed backup archive"
    fi
    
    log_info "Compressed backup created: $BACKUP_FILE"
}

verify_backup() {
    log_info "Verifying backup integrity..."
    
    local backup_path="$BACKUP_DIR/$BACKUP_FILE"
    
    # Check if file exists
    if [[ ! -f "$backup_path" ]]; then
        handle_error "Backup file does not exist: $backup_path"
    fi
    
    # Check file size
    local file_size_mb=$(du -m "$backup_path" | cut -f1)
    log_info "Backup file size: ${file_size_mb}MB"
    
    if [[ $file_size_mb -lt $MIN_SIZE_MB ]]; then
        handle_error "Backup file too small: ${file_size_mb}MB (minimum: ${MIN_SIZE_MB}MB)"
    fi
    
    if [[ $file_size_mb -gt $MAX_SIZE_MB ]]; then
        handle_error "Backup file too large: ${file_size_mb}MB (maximum: ${MAX_SIZE_MB}MB)"
    fi
    
    # Verify gzip integrity
    if ! gzip -t "$backup_path"; then
        handle_error "Backup file integrity check failed"
    fi
    
    # Verify tar archive
    if ! tar -tzf "$backup_path" >/dev/null 2>&1; then
        handle_error "Backup archive verification failed"
    fi
    
    log_info "Backup verification completed successfully"
    
    # Update monitoring status
    echo "$(date +%s)" > "$BACKUP_DIR/.last_backup_success"
    echo "$file_size_mb" > "$BACKUP_DIR/.last_backup_size_mb"
}

#=============================================================================
# Cleanup Functions
#=============================================================================

cleanup_old_backups() {
    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        log_info "Deleting old backup: $(basename "$file")"
        rm -f "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "critical_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [[ $deleted_count -gt 0 ]]; then
        log_info "Deleted $deleted_count old backup files"
    else
        log_info "No old backup files to delete"
    fi
}

#=============================================================================
# Main Backup Function
#=============================================================================

main() {
    log_info "=== Starting Smart AI Hub Critical Backup ==="
    log_info "Timestamp: $(date)"
    log_info "Backup file: $BACKUP_FILE"
    
    # Validation
    validate_environment
    check_disk_space
    
    # Database backup
    backup_critical_tables
    backup_recent_transactions
    
    # Configuration backup
    backup_configuration
    
    # Create backup information
    create_backup_info
    
    # Create and verify backup
    create_compressed_backup
    verify_backup
    
    # Send success email
    /scripts/send-backup-email.sh "SUCCESS" "$BACKUP_FILE"
    
    # Cleanup
    cleanup_old_backups
    
    log_info "=== Backup completed successfully ==="
    log_info "Backup file: $BACKUP_DIR/$BACKUP_FILE"
    log_info "Size: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"
    
    exit 0
}

#=============================================================================
# Script Entry Point
#=============================================================================

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi