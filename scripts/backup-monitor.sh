#!/bin/bash

#=============================================================================
# Smart AI Hub - Backup Monitoring Script
# Author: Development Team
# Description: Monitors backup status and sends alerts on failures
# Version: 1.0
#=============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
LOG_FILE="/var/log/backup.log"
MAX_BACKUP_AGE_HOURS=25
MIN_BACKUP_SIZE_MB=1
MAX_BACKUP_SIZE_MB=100

# Monitoring files
LAST_SUCCESS_FILE="$BACKUP_DIR/.last_backup_success"
LAST_SIZE_FILE="$BACKUP_DIR/.last_backup_size_mb"

# Email configuration
ADMIN_EMAILS="${ADMIN_EMAILS:-admin@example.com}"

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
# Monitoring Functions
#=============================================================================

check_last_backup_time() {
    log_info "Checking last backup time..."
    
    if [[ ! -f "$LAST_SUCCESS_FILE" ]]; then
        log_error "No backup success file found. No backups have been completed."
        return 1
    fi
    
    local last_backup_timestamp=$(cat "$LAST_SUCCESS_FILE" 2>/dev/null || echo "0")
    local current_timestamp=$(date +%s)
    local age_hours=$(( (current_timestamp - last_backup_timestamp) / 3600 ))
    
    log_info "Last backup was $age_hours hours ago"
    
    if [[ $age_hours -gt $MAX_BACKUP_AGE_HOURS ]]; then
        log_error "Last backup is too old: $age_hours hours (max: $MAX_BACKUP_AGE_HOURS hours)"
        return 1
    fi
    
    log_info "Last backup time check passed"
    return 0
}

check_backup_size() {
    log_info "Checking last backup size..."
    
    if [[ ! -f "$LAST_SIZE_FILE" ]]; then
        log_error "No backup size file found. No backups have been completed."
        return 1
    fi
    
    local last_size_mb=$(cat "$LAST_SIZE_FILE" 2>/dev/null || echo "0")
    
    log_info "Last backup size: ${last_size_mb}MB"
    
    if [[ $last_size_mb -lt $MIN_BACKUP_SIZE_MB ]]; then
        log_error "Last backup size too small: ${last_size_mb}MB (min: ${MIN_BACKUP_SIZE_MB}MB)"
        return 1
    fi
    
    if [[ $last_size_mb -gt $MAX_BACKUP_SIZE_MB ]]; then
        log_error "Last backup size too large: ${last_size_mb}MB (max: ${MAX_BACKUP_SIZE_MB}MB)"
        return 1
    fi
    
    log_info "Backup size check passed"
    return 0
}

check_backup_files() {
    log_info "Checking backup files in directory..."
    
    local backup_count=$(find "$BACKUP_DIR" -name "critical_backup_*.tar.gz" -type f 2>/dev/null | wc -l)
    
    log_info "Found $backup_count backup files"
    
    if [[ $backup_count -eq 0 ]]; then
        log_error "No backup files found in $BACKUP_DIR"
        return 1
    fi
    
    # Check the most recent backup file
    local latest_backup=$(find "$BACKUP_DIR" -name "critical_backup_*.tar.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -n "$latest_backup" ]]; then
        log_info "Latest backup file: $(basename "$latest_backup")"
        
        # Verify the latest backup file integrity
        if ! gzip -t "$latest_backup" 2>/dev/null; then
            log_error "Latest backup file integrity check failed: $latest_backup"
            return 1
        fi
        
        if ! tar -tzf "$latest_backup" >/dev/null 2>&1; then
            log_error "Latest backup archive verification failed: $latest_backup"
            return 1
        fi
        
        log_info "Latest backup file integrity verified"
    fi
    
    log_info "Backup files check passed"
    return 0
}

check_disk_space() {
    log_info "Checking disk space..."
    
    local available_mb=$(df "$BACKUP_DIR" | awk 'NR==2 {print int($4/1024)}')
    local required_mb=200  # Minimum 200MB required for health
    
    log_info "Available disk space: ${available_mb}MB"
    
    if [[ $available_mb -lt $required_mb ]]; then
        log_error "Low disk space: ${available_mb}MB available (minimum: ${required_mb}MB)"
        return 1
    fi
    
    log_info "Disk space check passed"
    return 0
}

check_database_connectivity() {
    log_info "Checking database connectivity..."
    
    local db_host="${POSTGRES_HOST:-postgres}"
    local db_port="${POSTGRES_PORT:-5432}"
    local db_user="${POSTGRES_USER:-postgres}"
    local db_name="${POSTGRES_DB:-smart_ai_hub}"
    local db_password="${POSTGRES_PASSWORD:-}"
    
    if [[ -z "$db_password" ]]; then
        log_warn "POSTGRES_PASSWORD not set, skipping database connectivity check"
        return 0
    fi
    
    if ! PGPASSWORD="$db_password" pg_isready -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" >/dev/null 2>&1; then
        log_error "Database connectivity check failed"
        return 1
    fi
    
    log_info "Database connectivity check passed"
    return 0
}

#=============================================================================
# Alert Functions
#=============================================================================

send_monitoring_alert() {
    local alert_type="$1"
    local alert_message="$2"
    
    log_info "Sending monitoring alert: $alert_type"
    
    # Create alert email
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S %Z')
    local hostname=$(hostname 2>/dev/null || echo "backup-service")
    
    local body_file="/tmp/monitoring_alert_$$.html"
    
    cat > "$body_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background-color: #dc3545; color: white; padding: 15px; border-radius: 5px; text-align: center; }
        .content { padding: 20px 0; }
        .alert-box { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; color: #721c24; }
        .action-box { background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 15px 0; }
        .code-block { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; }
        .footer { border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px; font-size: 12px; color: #666; }
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Smart AI Hub Backup Alert</h1>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <h3>Alert Details</h3>
                <table>
                    <tr><th>Alert Time</th><td>$timestamp</td></tr>
                    <tr><th>Alert Type</th><td>$alert_type</td></tr>
                    <tr><th>Hostname</th><td>$hostname</td></tr>
                    <tr><th>Message</th><td>$alert_message</td></tr>
                </table>
            </div>
            
            <div class="action-box">
                <h3>🔍 Recommended Actions</h3>
                <ol>
                    <li><strong>Check backup service status:</strong>
                        <div class="code-block">docker ps | grep backup-service
docker logs backup-service</div>
                    </li>
                    <li><strong>Review backup logs:</strong>
                        <div class="code-block">docker exec backup-service tail -50 /var/log/backup.log</div>
                    </li>
                    <li><strong>Check backup directory:</strong>
                        <div class="code-block">docker exec backup-service ls -la /backups/</div>
                    </li>
                    <li><strong>Verify disk space:</strong>
                        <div class="code-block">docker exec backup-service df -h /backups</div>
                    </li>
                    <li><strong>Test database connectivity:</strong>
                        <div class="code-block">docker exec backup-service pg_isready -h postgres -U postgres</div>
                    </li>
                </ol>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated monitoring alert from Smart AI Hub Backup Service.<br>
            Please investigate and resolve this issue promptly.</p>
        </div>
    </div>
</body>
</html>
EOF
    
    # Send alert email
    local subject="🚨 ALERT: Smart AI Hub Backup - $alert_type - $(date '+%Y-%m-%d')"
    
    if /scripts/send-backup-email.sh "FAILURE" "monitoring_alert_$(date +%Y%m%d_%H%M%S)" "$alert_message" 2>/dev/null; then
        log_info "Monitoring alert sent successfully"
        rm -f "$body_file"
        return 0
    else
        log_error "Failed to send monitoring alert"
        rm -f "$body_file"
        return 1
    fi
}

#=============================================================================
# Health Check Functions
#=============================================================================

run_health_checks() {
    log_info "Running backup health checks..."
    
    local checks_passed=0
    local checks_failed=0
    local failed_checks=()
    
    # Check 1: Last backup time
    if check_last_backup_time; then
        ((checks_passed++))
    else
        ((checks_failed++))
        failed_checks+=("Last backup time")
    fi
    
    # Check 2: Backup size
    if check_backup_size; then
        ((checks_passed++))
    else
        ((checks_failed++))
        failed_checks+=("Backup size")
    fi
    
    # Check 3: Backup files
    if check_backup_files; then
        ((checks_passed++))
    else
        ((checks_failed++))
        failed_checks+=("Backup files")
    fi
    
    # Check 4: Disk space
    if check_disk_space; then
        ((checks_passed++))
    else
        ((checks_failed++))
        failed_checks+=("Disk space")
    fi
    
    # Check 5: Database connectivity
    if check_database_connectivity; then
        ((checks_passed++))
    else
        ((checks_failed++))
        failed_checks+=("Database connectivity")
    fi
    
    log_info "Health check summary: $checks_passed passed, $checks_failed failed"
    
    if [[ $checks_failed -gt 0 ]]; then
        local failed_list=$(IFS=', '; echo "${failed_checks[*]}")
        local alert_message="Health check failed: $failed_list"
        send_monitoring_alert "Health Check Failed" "$alert_message"
        return 1
    fi
    
    log_info "All health checks passed"
    return 0
}

get_backup_status() {
    log_info "Getting backup status summary..."
    
    # Last backup info
    local last_backup_time="Unknown"
    local last_backup_size="Unknown"
    local backup_count=0
    
    if [[ -f "$LAST_SUCCESS_FILE" ]]; then
        local timestamp=$(cat "$LAST_SUCCESS_FILE" 2>/dev/null || echo "0")
        if [[ $timestamp != "0" ]]; then
            last_backup_time=$(date -d "@$timestamp" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "Invalid")
        fi
    fi
    
    if [[ -f "$LAST_SIZE_FILE" ]]; then
        local size_mb=$(cat "$LAST_SIZE_FILE" 2>/dev/null || echo "0")
        if [[ $size_mb != "0" ]]; then
            last_backup_size="${size_mb}MB"
        fi
    fi
    
    backup_count=$(find "$BACKUP_DIR" -name "critical_backup_*.tar.gz" -type f 2>/dev/null | wc -l)
    
    # Disk space
    local available_space=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}' 2>/dev/null || echo "Unknown")
    
    echo "=== Backup Status Summary ==="
    echo "Last successful backup: $last_backup_time"
    echo "Last backup size: $last_backup_size"
    echo "Total backup files: $backup_count"
    echo "Available disk space: $available_space"
    echo "Backup directory: $BACKUP_DIR"
    echo "============================"
}

#=============================================================================
# Main Function
#=============================================================================

main() {
    local command="${1:-health-check}"
    
    case "$command" in
        "health-check"|"healthcheck")
            log_info "=== Starting backup health check ==="
            if run_health_checks; then
                log_info "Health check completed successfully"
                exit 0
            else
                log_error "Health check failed"
                exit 1
            fi
            ;;
        "status")
            get_backup_status
            exit 0
            ;;
        "test-alert")
            log_info "Sending test monitoring alert..."
            send_monitoring_alert "Test Alert" "This is a test monitoring alert from backup service"
            exit 0
            ;;
        "check-time")
            if check_last_backup_time; then
                exit 0
            else
                exit 1
            fi
            ;;
        "check-size")
            if check_backup_size; then
                exit 0
            else
                exit 1
            fi
            ;;
        "check-files")
            if check_backup_files; then
                exit 0
            else
                exit 1
            fi
            ;;
        "check-disk")
            if check_disk_space; then
                exit 0
            else
                exit 1
            fi
            ;;
        "check-db")
            if check_database_connectivity; then
                exit 0
            else
                exit 1
            fi
            ;;
        *)
            echo "Usage: $0 [health-check|status|test-alert|check-time|check-size|check-files|check-disk|check-db]"
            echo ""
            echo "Commands:"
            echo "  health-check  - Run all health checks (default)"
            echo "  status        - Show backup status summary"
            echo "  test-alert    - Send test monitoring alert"
            echo "  check-time    - Check last backup time only"
            echo "  check-size    - Check last backup size only"
            echo "  check-files   - Check backup files only"
            echo "  check-disk    - Check disk space only"
            echo "  check-db      - Check database connectivity only"
            exit 1
            ;;
    esac
}

#=============================================================================
# Script Entry Point
#=============================================================================

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi