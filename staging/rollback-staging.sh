#!/bin/bash

# Staging Rollback Script
# This script handles rollback procedures for the staging environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$STAGING_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups/staging"
LOG_FILE="$STAGING_DIR/rollback.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking rollback prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi
    
    # Check if docker-compose.staging.yml exists
    if [ ! -f "$STAGING_DIR/docker-compose.staging.yml" ]; then
        error "docker-compose.staging.yml not found."
        exit 1
    fi
    
    log "Prerequisites check completed."
}

# Function to list available backups
list_backups() {
    log "Listing available backups..."
    
    echo ""
    echo "Available Database Backups:"
    echo "=========================="
    
    local db_backups=($(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null || echo ""))
    
    if [ ${#db_backups[@]} -eq 0 ]; then
        warning "No database backups found."
    else
        for i in "${!db_backups[@]}"; do
            local backup_file=$(basename "${db_backups[$i]}")
            local backup_date=$(echo "$backup_file" | sed 's/db_backup_\(.*\)\.sql/\1/' | sed 's/\(....\)\(..\)\(..\)_\(..\)\(..\)\(..\)/\1-\2-\3 \4:\5:\6/')
            echo "[$i] $backup_file (Created: $backup_date)"
        done
    fi
    
    echo ""
    echo "Available Configuration Backups:"
    echo "================================"
    
    local config_backups=($(ls -t "$BACKUP_DIR"/config_backup_*.tar.gz 2>/dev/null || echo ""))
    
    if [ ${#config_backups[@]} -eq 0 ]; then
        warning "No configuration backups found."
    else
        for i in "${!config_backups[@]}"; do
            local backup_file=$(basename "${config_backups[$i]}")
            local backup_date=$(echo "$backup_file" | sed 's/config_backup_\(.*\)\.tar.gz/\1/' | sed 's/\(....\)\(..\)\(..\)_\(..\)\(..\)\(..\)/\1-\2-\3 \4:\5:\6/')
            echo "[$i] $backup_file (Created: $backup_date)"
        done
    fi
    
    echo ""
}

# Function to select backup
select_backup() {
    local backup_type="$1"  # "db" or "config"
    
    case "$backup_type" in
        "db")
            local backups=($(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null || echo ""))
            ;;
        "config")
            local backups=($(ls -t "$BACKUP_DIR"/config_backup_*.tar.gz 2>/dev/null || echo ""))
            ;;
        *)
            error "Invalid backup type: $backup_type"
            exit 1
            ;;
    esac
    
    if [ ${#backups[@]} -eq 0 ]; then
        error "No $backup_type backups found."
        exit 1
    fi
    
    if [ "${2:-}" = "latest" ]; then
        echo "${backups[0]}"
        return
    fi
    
    echo "Available $backup_type backups:"
    for i in "${!backups[@]}"; do
        local backup_file=$(basename "${backups[$i]}")
        local backup_date=$(echo "$backup_file" | sed "s/${backup_type}_backup_\(.*\)\.\(sql\|tar\.gz\)/\1/" | sed 's/\(....\)\(..\)\(..\)_\(..\)\(..\)\(..\)/\1-\2-\3 \4:\5:\6/')
        echo "[$i] $backup_file (Created: $backup_date)"
    done
    
    read -p "Select backup number [0-$(( ${#backups[@]} - 1 ))]: " selection
    
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 0 ] && [ "$selection" -lt ${#backups[@]} ]; then
        echo "${backups[$selection]}"
    else
        error "Invalid selection."
        exit 1
    fi
}

# Function to create current state backup
create_current_backup() {
    log "Creating backup of current state before rollback..."
    
    local current_backup_dir="$BACKUP_DIR/before_rollback_$TIMESTAMP"
    mkdir -p "$current_backup_dir"
    
    # Backup current database
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" ps postgres | grep -q "Up"; then
        docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres pg_dump -U postgres smart_ai_hub_staging > "$current_backup_dir/db_before_rollback.sql"
        log "Current database backed up to: $current_backup_dir/db_before_rollback.sql"
    fi
    
    # Backup current configuration
    tar -czf "$current_backup_dir/config_before_rollback.tar.gz" -C "$STAGING_DIR" .env.staging nginx.staging.conf prometheus.staging.yml
    log "Current configuration backed up to: $current_backup_dir/config_before_rollback.tar.gz"
    
    # Backup current Docker images
    docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" images > "$current_backup_dir/docker_images.txt"
    log "Current Docker images listed in: $current_backup_dir/docker_images.txt"
    
    log "Current state backup completed."
}

# Function to rollback database
rollback_database() {
    local backup_file="$1"
    
    log "Rolling back database using: $backup_file"
    
    # Stop application services to prevent conflicts
    info "Stopping application services..."
    docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" stop auth-service core-service mcp-server analytics-service api-gateway || true
    
    # Restore database
    info "Restoring database from backup..."
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS smart_ai_hub_staging_temp;" > /dev/null 2>&1; then
        info "Temporary database dropped (if existed)"
    fi
    
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres psql -U postgres -c "CREATE DATABASE smart_ai_hub_staging_temp;" > /dev/null 2>&1; then
        info "Temporary database created"
    fi
    
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres psql -U postgres smart_ai_hub_staging_temp < "$backup_file" > /dev/null 2>&1; then
        info "Database restored to temporary database"
    else
        error "Failed to restore database to temporary database"
        return 1
    fi
    
    # Drop old database and rename temporary
    info "Swapping databases..."
    docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS smart_ai_hub_staging;" > /dev/null 2>&1
    docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres psql -U postgres -c "ALTER DATABASE smart_ai_hub_staging_temp RENAME TO smart_ai_hub_staging;" > /dev/null 2>&1
    
    log "Database rollback completed successfully."
}

# Function to rollback configuration
rollback_configuration() {
    local backup_file="$1"
    
    log "Rolling back configuration using: $backup_file"
    
    # Extract configuration backup
    local temp_dir="$BACKUP_DIR/temp_config_$TIMESTAMP"
    mkdir -p "$temp_dir"
    
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Backup current configuration files
    cp "$STAGING_DIR/.env.staging" "$STAGING_DIR/.env.staging.backup" 2>/dev/null || true
    cp "$STAGING_DIR/nginx.staging.conf" "$STAGING_DIR/nginx.staging.conf.backup" 2>/dev/null || true
    cp "$STAGING_DIR/prometheus.staging.yml" "$STAGING_DIR/prometheus.staging.yml.backup" 2>/dev/null || true
    
    # Restore configuration files
    if [ -f "$temp_dir/.env.staging" ]; then
        cp "$temp_dir/.env.staging" "$STAGING_DIR/.env.staging"
        log "Environment configuration restored"
    fi
    
    if [ -f "$temp_dir/nginx.staging.conf" ]; then
        cp "$temp_dir/nginx.staging.conf" "$STAGING_DIR/nginx.staging.conf"
        log "Nginx configuration restored"
    fi
    
    if [ -f "$temp_dir/prometheus.staging.yml" ]; then
        cp "$temp_dir/prometheus.staging.yml" "$STAGING_DIR/prometheus.staging.yml"
        log "Prometheus configuration restored"
    fi
    
    # Clean up temporary directory
    rm -rf "$temp_dir"
    
    log "Configuration rollback completed successfully."
}

# Function to rollback Docker images
rollback_docker_images() {
    log "Rolling back Docker images..."
    
    # Check if we have a record of previous images
    local latest_config_backup=$(select_backup "config" "latest")
    
    if [ -n "$latest_config_backup" ] && [ -f "$latest_config_backup" ]; then
        local temp_dir="$BACKUP_DIR/temp_images_$TIMESTAMP"
        mkdir -p "$temp_dir"
        
        # Extract to get docker images list if available
        tar -xzf "$latest_config_backup" -C "$temp_dir" 2>/dev/null || true
        
        if [ -f "$temp_dir/docker_images.txt" ]; then
            log "Found previous Docker images list"
            # Note: Docker image rollback is complex and may require manual intervention
            warning "Docker image rollback may require manual intervention"
            warning "Please review docker_images.txt and pull required images manually"
        else
            warning "No previous Docker images list found"
        fi
        
        rm -rf "$temp_dir"
    fi
    
    log "Docker images rollback note completed."
}

# Function to restart services
restart_services() {
    log "Restarting services with rollback configuration..."
    
    # Change to staging directory
    cd "$STAGING_DIR"
    
    # Stop all services
    info "Stopping all services..."
    docker-compose -f docker-compose.staging.yml down || true
    
    # Start services
    info "Starting services..."
    docker-compose -f docker-compose.staging.yml up -d
    
    # Wait for services to be ready
    info "Waiting for services to be ready..."
    sleep 30
    
    log "Services restarted successfully."
}

# Function to verify rollback
verify_rollback() {
    log "Verifying rollback..."
    
    local verification_passed=0
    local verification_total=0
    
    # Check database connectivity
    ((verification_total++))
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log "✓ Database is accessible"
        ((verification_passed++))
    else
        error "✗ Database is not accessible"
    fi
    
    # Check service health
    local services=("auth-service" "core-service" "mcp-server" "analytics-service" "api-gateway" "nginx")
    for service in "${services[@]}"; do
        ((verification_total++))
        if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" ps "$service" | grep -q "Up"; then
            log "✓ $service is running"
            ((verification_passed++))
        else
            error "✗ $service is not running"
        fi
    done
    
    # Check HTTP endpoints
    ((verification_total++))
    if curl -f -s "http://localhost:8080/health" > /dev/null; then
        log "✓ HTTP health endpoint is responding"
        ((verification_passed++))
    else
        error "✗ HTTP health endpoint is not responding"
    fi
    
    log "Rollback verification completed: $verification_passed/$verification_total checks passed"
    
    if [ $verification_passed -eq $verification_total ]; then
        log "🎉 Rollback verification successful!"
        return 0
    else
        error "❌ Rollback verification failed!"
        return 1
    fi
}

# Function to generate rollback report
generate_rollback_report() {
    local backup_file="$1"
    local rollback_type="$2"
    
    log "Generating rollback report..."
    
    local report_file="$BACKUP_DIR/ROLLBACK_REPORT_$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Staging Rollback Report

**Rollback Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Environment:** Staging
**Rollback Type:** $rollback_type
**Backup Used:** $(basename "$backup_file")

## Rollback Summary

- **Backup File:** $(basename "$backup_file")
- **Rollback Type:** $rollback_type
- **Status:** Success

## Actions Performed

1. Created backup of current state
2. Stopped application services
3. Restored from backup
4. Restarted services
5. Verified rollback

## Verification Results

- Database connectivity: ✅
- Service status: ✅
- HTTP endpoints: ✅

## Access URLs

- **Frontend:** http://localhost:8080
- **API:** http://localhost:8080/api
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3000

## Next Steps

1. Verify application functionality
2. Run regression tests
3. Monitor system performance
4. Investigate root cause of rollback

## Logs

Rollback logs are available in: $LOG_FILE

EOF

    log "Rollback report generated: $report_file"
    echo "Rollback report: $report_file"
}

# Main rollback function
main() {
    log "Starting staging rollback procedure..."
    
    # Initialize log file
    echo "Staging Rollback Log - $(date)" > "$LOG_FILE"
    
    # Check prerequisites
    check_prerequisites
    
    # List available backups
    list_backups
    
    # Ask what to rollback
    echo ""
    echo "What would you like to rollback?"
    echo "1) Database only"
    echo "2) Configuration only"
    echo "3) Full rollback (database + configuration)"
    echo "4) List backups only"
    echo "5) Exit"
    echo ""
    
    read -p "Select option [1-5]: " option
    
    case "$option" in
        1)
            # Database rollback
            local db_backup=$(select_backup "db")
            create_current_backup
            rollback_database "$db_backup"
            restart_services
            if verify_rollback; then
                generate_rollback_report "$db_backup" "Database"
            else
                error "Rollback verification failed"
                exit 1
            fi
            ;;
        2)
            # Configuration rollback
            local config_backup=$(select_backup "config")
            create_current_backup
            rollback_configuration "$config_backup"
            restart_services
            if verify_rollback; then
                generate_rollback_report "$config_backup" "Configuration"
            else
                error "Rollback verification failed"
                exit 1
            fi
            ;;
        3)
            # Full rollback
            local db_backup=$(select_backup "db")
            local config_backup=$(select_backup "config")
            create_current_backup
            rollback_database "$db_backup"
            rollback_configuration "$config_backup"
            rollback_docker_images
            restart_services
            if verify_rollback; then
                generate_rollback_report "$db_backup (DB) + $config_backup (Config)" "Full"
            else
                error "Rollback verification failed"
                exit 1
            fi
            ;;
        4)
            # List backups only
            list_backups
            exit 0
            ;;
        5)
            # Exit
            log "Rollback cancelled by user."
            exit 0
            ;;
        *)
            error "Invalid option."
            exit 1
            ;;
    esac
    
    log "Staging rollback completed successfully! 🎉"
    echo ""
    echo "Access URLs:"
    echo "  Frontend: http://localhost:8080"
    echo "  API: http://localhost:8080/api"
    echo "  Prometheus: http://localhost:9090"
    echo "  Grafana: http://localhost:3000"
    echo ""
    echo "Next steps:"
    echo "  1. Verify application functionality"
    echo "  2. Run tests: bash test-staging.sh"
    echo "  3. Monitor system performance"
}

# Handle script arguments
case "${1:-interactive}" in
    interactive)
        main
        ;;
    db)
        check_prerequisites
        db_backup=$(select_backup "db" "latest")
        create_current_backup
        rollback_database "$db_backup"
        restart_services
        verify_rollback
        generate_rollback_report "$db_backup" "Database"
        ;;
    config)
        check_prerequisites
        config_backup=$(select_backup "config" "latest")
        create_current_backup
        rollback_configuration "$config_backup"
        restart_services
        verify_rollback
        generate_rollback_report "$config_backup" "Configuration"
        ;;
    full)
        check_prerequisites
        db_backup=$(select_backup "db" "latest")
        config_backup=$(select_backup "config" "latest")
        create_current_backup
        rollback_database "$db_backup"
        rollback_configuration "$config_backup"
        rollback_docker_images
        restart_services
        verify_rollback
        generate_rollback_report "$db_backup (DB) + $config_backup (Config)" "Full"
        ;;
    list)
        list_backups
        ;;
    *)
        echo "Usage: $0 {interactive|db|config|full|list}"
        echo "  interactive - Interactive rollback (default)"
        echo "  db         - Rollback database only (latest backup)"
        echo "  config     - Rollback configuration only (latest backup)"
        echo "  full       - Full rollback (latest backups)"
        echo "  list       - List available backups"
        exit 1
        ;;
esac