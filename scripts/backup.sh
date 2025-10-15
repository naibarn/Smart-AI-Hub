#!/bin/bash

# Smart AI Hub Backup Script
# This script creates backups of the database and configuration files

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Function to create backup directory
create_backup_dir() {
    log "Creating backup directory..."
    mkdir -p $BACKUP_DIR
    log "Backup directory created: $BACKUP_DIR"
}

# Function to backup database
backup_database() {
    log "Creating database backup..."
    
    # Check if postgres container is running
    if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
        # Create database backup
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres smart_ai_hub | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
        log "Database backup created: $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
    else
        error "PostgreSQL container is not running. Skipping database backup."
    fi
}

# Function to backup configuration files
backup_config() {
    log "Creating configuration backup..."
    
    # Create configuration backup
    tar -czf "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" \
        .env.production \
        nginx.prod.conf \
        docker-compose.prod.yml \
        ssl/ \
        monitoring/ \
        2>/dev/null || warning "Some configuration files not found"
    
    log "Configuration backup created: $BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz"
}

# Function to backup application logs
backup_logs() {
    log "Creating logs backup..."
    
    # Create logs backup if logs directory exists
    if [ -d "logs" ]; then
        tar -czf "$BACKUP_DIR/logs_backup_$TIMESTAMP.tar.gz" logs/
        log "Logs backup created: $BACKUP_DIR/logs_backup_$TIMESTAMP.tar.gz"
    else
        warning "Logs directory not found. Skipping logs backup."
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    # Remove old database backups
    find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # Remove old configuration backups
    find $BACKUP_DIR -name "config_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # Remove old logs backups
    find $BACKUP_DIR -name "logs_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    log "Old backups cleaned up."
}

# Function to verify backups
verify_backups() {
    log "Verifying backup files..."
    
    # Verify database backup
    if [ -f "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz" ]; then
        # Test if the backup file is valid
        if gzip -t "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz" 2>/dev/null; then
            log "Database backup verified successfully."
        else
            error "Database backup is corrupted."
            exit 1
        fi
    fi
    
    # Verify configuration backup
    if [ -f "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" ]; then
        # Test if the backup file is valid
        if tar -tzf "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" >/dev/null 2>&1; then
            log "Configuration backup verified successfully."
        else
            error "Configuration backup is corrupted."
            exit 1
        fi
    fi
    
    # Verify logs backup
    if [ -f "$BACKUP_DIR/logs_backup_$TIMESTAMP.tar.gz" ]; then
        # Test if the backup file is valid
        if tar -tzf "$BACKUP_DIR/logs_backup_$TIMESTAMP.tar.gz" >/dev/null 2>&1; then
            log "Logs backup verified successfully."
        else
            error "Logs backup is corrupted."
            exit 1
        fi
    fi
}

# Function to display backup summary
display_summary() {
    log "Backup completed successfully!"
    log "Backup timestamp: $TIMESTAMP"
    log "Backup location: $BACKUP_DIR"
    
    echo ""
    echo "=== Backup Summary ==="
    echo "Timestamp: $TIMESTAMP"
    echo "Location: $BACKUP_DIR"
    echo ""
    
    # List created backups
    echo "Created backups:"
    [ -f "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz" ] && echo "  - Database: $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
    [ -f "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" ] && echo "  - Configuration: $BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz"
    [ -f "$BACKUP_DIR/logs_backup_$TIMESTAMP.tar.gz" ] && echo "  - Logs: $BACKUP_DIR/logs_backup_$TIMESTAMP.tar.gz"
    
    echo ""
    echo "Total backup size:"
    du -sh $BACKUP_DIR/*$TIMESTAMP* 2>/dev/null || echo "  No backups found"
    
    echo ""
    echo "To restore from backup, refer to the PRODUCTION_DEPLOYMENT_GUIDE.md"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --db-only      Backup database only"
    echo "  --config-only  Backup configuration only"
    echo "  --logs-only    Backup logs only"
    echo "  --no-cleanup   Skip cleanup of old backups"
    echo ""
    echo "Examples:"
    echo "  $0                    # Backup everything"
    echo "  $0 --db-only          # Backup database only"
    echo "  $0 --no-cleanup       # Backup without cleanup"
}

# Main backup function
main() {
    # Parse command line arguments
    DB_ONLY=false
    CONFIG_ONLY=false
    LOGS_ONLY=false
    NO_CLEANUP=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            --db-only)
                DB_ONLY=true
                shift
                ;;
            --config-only)
                CONFIG_ONLY=true
                shift
                ;;
            --logs-only)
                LOGS_ONLY=true
                shift
                ;;
            --no-cleanup)
                NO_CLEANUP=true
                shift
                ;;
            *)
                error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate options
    if [[ "$DB_ONLY" == true && "$CONFIG_ONLY" == true ]] || \
       [[ "$DB_ONLY" == true && "$LOGS_ONLY" == true ]] || \
       [[ "$CONFIG_ONLY" == true && "$LOGS_ONLY" == true ]]; then
        error "Cannot specify multiple backup types. Use only one type or none for all."
        exit 1
    fi
    
    log "Starting Smart AI Hub backup process..."
    log "Backup timestamp: $TIMESTAMP"
    
    # Run backup steps
    create_backup_dir
    
    if [[ "$DB_ONLY" == true ]]; then
        backup_database
    elif [[ "$CONFIG_ONLY" == true ]]; then
        backup_config
    elif [[ "$LOGS_ONLY" == true ]]; then
        backup_logs
    else
        backup_database
        backup_config
        backup_logs
    fi
    
    if [[ "$NO_CLEANUP" == false ]]; then
        cleanup_old_backups
    fi
    
    verify_backups
    display_summary
    
    log "Backup process completed successfully!"
}

# Handle script interruption
trap 'error "Backup interrupted. Please check the backup directory: $BACKUP_DIR"' INT

# Run main function
main "$@"