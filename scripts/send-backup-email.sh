#!/bin/bash

#=============================================================================
# Smart AI Hub - Backup Email Delivery Script
# Author: Development Team
# Description: Sends backup files and alerts via email
# Version: 1.0
#=============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
LOG_FILE="/var/log/backup.log"
MAX_ATTACHMENT_SIZE_MB=25
RETRY_COUNT=3
RETRY_DELAY=30

# Email configuration
SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER}"
SMTP_PASS="${SMTP_PASS}"
SMTP_FROM="${SMTP_FROM:-${SMTP_USER}}"
ADMIN_EMAILS="${ADMIN_EMAILS}"

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
# Validation Functions
#=============================================================================

validate_email_config() {
    log_info "Validating email configuration..."
    
    if [[ -z "${SMTP_USER:-}" ]]; then
        log_error "SMTP_USER environment variable is required"
        exit 1
    fi
    
    if [[ -z "${SMTP_PASS:-}" ]]; then
        log_error "SMTP_PASS environment variable is required"
        exit 1
    fi
    
    if [[ -z "${ADMIN_EMAILS:-}" ]]; then
        log_error "ADMIN_EMAILS environment variable is required"
        exit 1
    fi
    
    log_info "Email configuration validation completed"
}

#=============================================================================
# Email Templates
#=============================================================================

generate_success_email_body() {
    local backup_file="$1"
    local backup_path="$BACKUP_DIR/$backup_file"
    local file_size_mb=$(du -m "$backup_path" 2>/dev/null | cut -f1 || echo "0")
    local file_size_human=$(du -h "$backup_path" 2>/dev/null | cut -f1 || echo "0")
    local backup_date=$(date '+%Y-%m-%d %H:%M:%S %Z')
    
    cat << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background-color: #4CAF50; color: white; padding: 15px; border-radius: 5px; text-align: center; }
        .content { padding: 20px 0; }
        .info-box { background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 15px; margin: 15px 0; }
        .warning-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
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
            <h1>✅ Smart AI Hub Backup Successful</h1>
        </div>
        
        <div class="content">
            <div class="info-box">
                <h3>Backup Summary</h3>
                <table>
                    <tr><th>Backup Date</th><td>$backup_date</td></tr>
                    <tr><th>Backup File</th><td>$backup_file</td></tr>
                    <tr><th>File Size</th><td>$file_size_human ($file_size_mb MB)</td></tr>
                    <tr><th>Backup Type</th><td>Lightweight (Critical Data Only)</td></tr>
                    <tr><th>Status</th><td><strong style="color: #4CAF50;">SUCCESS</strong></td></tr>
                </table>
            </div>
            
            <h3>📋 Backup Contents</h3>
            <ul>
                <li><strong>Database Tables:</strong> users, user_roles, organizations, agencies, referrals, exchange_rates, system_settings, roles, permissions, role_permissions</li>
                <li><strong>Recent Transactions:</strong> Last 3 months of credit_transactions, point_transactions, purchases</li>
                <li><strong>Configuration Files:</strong> .env.production, docker-compose.prod.yml, nginx.prod.conf</li>
                <li><strong>SSL Certificates:</strong> SSL certificates and keys</li>
                <li><strong>Backup Information:</strong> BACKUP_INFO.txt with restore instructions</li>
            </ul>
            
EOF

    # Add attachment or download link info
    if [[ $file_size_mb -lt $MAX_ATTACHMENT_SIZE_MB ]]; then
        cat << EOF
            <div class="info-box">
                <h3>📎 Backup File Attached</h3>
                <p>The backup file is attached to this email. You can save it to a secure location for future use.</p>
            </div>
EOF
    else
        cat << EOF
            <div class="warning-box">
                <h3>🔗 Download Link Required</h3>
                <p>The backup file ($file_size_human) exceeds the email attachment limit (${MAX_ATTACHMENT_SIZE_MB}MB). Please access the backup file directly from the server:</p>
                <div class="code-block">Server Path: $backup_path</div>
            </div>
EOF
    fi

    cat << EOF
            
            <h3>🔧 Quick Restore Instructions</h3>
            <div class="code-block"># 1. Extract backup
tar -xzf $backup_file

# 2. Restore database
for sql_file in database/*.sql; do
    psql -U postgres smart_ai_hub < "\$sql_file"
done

# 3. Restore transactions
psql -U postgres smart_ai_hub -c "\COPY credit_transactions FROM 'database/credit_transactions.csv' CSV HEADER"
psql -U postgres smart_ai_hub -c "\COPY point_transactions FROM 'database/point_transactions.csv' CSV HEADER"
psql -U postgres smart_ai_hub -c "\COPY purchases FROM 'database/purchases.csv' CSV HEADER"

# 4. Restore configuration
cp config/.env.production /path/to/project/
cp config/docker-compose.prod.yml /path/to/project/
cp config/nginx.prod.conf /path/to/project/
cp -r config/ssl /path/to/project/

# 5. Restart services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d</div>
            
            <div class="info-box">
                <h3>ℹ️ Important Notes</h3>
                <ul>
                    <li>This backup contains <strong>critical data only</strong> for faster recovery</li>
                    <li>Backup retention period: 30 days</li>
                    <li>For detailed restore instructions, see BACKUP_INFO.txt in the backup archive</li>
                    <li>Next backup scheduled: Tomorrow at 2:00 AM</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated backup notification from Smart AI Hub.<br>
            If you have questions about this backup, please contact the development team.</p>
        </div>
    </div>
</body>
</html>
EOF
}

generate_failure_email_body() {
    local backup_file="$1"
    local error_message="$2"
    local failure_date=$(date '+%Y-%m-%d %H:%M:%S %Z')
    
    cat << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background-color: #dc3545; color: white; padding: 15px; border-radius: 5px; text-align: center; }
        .content { padding: 20px 0; }
        .error-box { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; color: #721c24; }
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
            <h1>❌ Smart AI Hub Backup Failed</h1>
        </div>
        
        <div class="content">
            <div class="error-box">
                <h3>🚨 Backup Failure Details</h3>
                <table>
                    <tr><th>Failure Date</th><td>$failure_date</td></tr>
                    <tr><th>Intended Backup File</th><td>$backup_file</td></tr>
                    <tr><th>Status</th><td><strong style="color: #dc3545;">FAILED</strong></td></tr>
                    <tr><th>Error Message</th><td>$error_message</td></tr>
                </table>
            </div>
            
            <div class="action-box">
                <h3>🔍 Immediate Actions Required</h3>
                <ol>
                    <li><strong>Check backup service status:</strong>
                        <div class="code-block">docker ps | grep backup-service
docker logs backup-service</div>
                    </li>
                    <li><strong>Verify database connectivity:</strong>
                        <div class="code-block">docker exec backup-service pg_isready -h postgres -U postgres</div>
                    </li>
                    <li><strong>Check disk space:</strong>
                        <div class="code-block">df -h /backups</div>
                    </li>
                    <li><strong>Review backup logs:</strong>
                        <div class="code-block">docker exec backup-service tail -50 /var/log/backup.log</div>
                    </li>
                    <li><strong>Trigger manual backup (if issue resolved):</strong>
                        <div class="code-block">docker exec backup-service /scripts/backup-lightweight.sh</div>
                    </li>
                </ol>
            </div>
            
            <div class="error-box">
                <h3>⚠️ Risk Assessment</h3>
                <ul>
                    <li><strong>Data Loss Risk:</strong> High - No recent backup available</li>
                    <li><strong>Recovery Impact:</strong> System restore may not be possible without backup</li>
                    <li><strong>Next Attempt:</strong> Automatic retry scheduled for tomorrow at 2:00 AM</li>
                </ul>
            </div>
            
            <div class="action-box">
                <h3>📞 Contact Information</h3>
                <p>For immediate assistance, contact the development team or system administrators.</p>
                <p><strong>Priority:</strong> HIGH - Requires immediate attention</p>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated failure alert from Smart AI Hub Backup Service.<br>
            Please address this issue as soon as possible to ensure data protection.</p>
        </div>
    </div>
</body>
</html>
EOF
}

#=============================================================================
# Email Sending Functions
#=============================================================================

send_email_with_retry() {
    local to_emails="$1"
    local subject="$2"
    local body_file="$3"
    local attachment_file="$4"
    
    local attempt=1
    
    while [[ $attempt -le $RETRY_COUNT ]]; do
        log_info "Email sending attempt $attempt/$RETRY_COUNT"
        
        if send_email "$to_emails" "$subject" "$body_file" "$attachment_file"; then
            log_info "Email sent successfully on attempt $attempt"
            return 0
        else
            log_warn "Email sending failed on attempt $attempt"
            
            if [[ $attempt -lt $RETRY_COUNT ]]; then
                log_info "Waiting $RETRY_DELAY seconds before retry..."
                sleep $RETRY_DELAY
            fi
        fi
        
        ((attempt++))
    done
    
    log_error "Email sending failed after $RETRY_COUNT attempts"
    return 1
}

send_email() {
    local to_emails="$1"
    local subject="$2"
    local body_file="$3"
    local attachment_file="$4"
    
    # Create temporary mail command file
    local mail_cmd_file="/tmp/mail_cmd_$$"
    
    # Convert comma-separated emails to space-separated
    local recipients=$(echo "$to_emails" | sed 's/,/ /g')
    
    # Create mail command
    if [[ -n "$attachment_file" && -f "$attachment_file" ]]; then
        # With attachment
        echo "To: $to_emails" > "$mail_cmd_file"
        echo "Subject: $subject" >> "$mail_cmd_file"
        echo "Content-Type: multipart/mixed; boundary=\"boundary123\"" >> "$mail_cmd_file"
        echo "" >> "$mail_cmd_file"
        echo "--boundary123" >> "$mail_cmd_file"
        echo "Content-Type: text/html; charset=UTF-8" >> "$mail_cmd_file"
        echo "" >> "$mail_cmd_file"
        cat "$body_file" >> "$mail_cmd_file"
        echo "" >> "$mail_cmd_file"
        echo "--boundary123" >> "$mail_cmd_file"
        echo "Content-Type: application/gzip" >> "$mail_cmd_file"
        echo "Content-Disposition: attachment; filename=\"$(basename "$attachment_file")\"" >> "$mail_cmd_file"
        echo "Content-Transfer-Encoding: base64" >> "$mail_cmd_file"
        echo "" >> "$mail_cmd_file"
        base64 "$attachment_file" >> "$mail_cmd_file"
        echo "" >> "$mail_cmd_file"
        echo "--boundary123--" >> "$mail_cmd_file"
    else
        # Without attachment
        echo "To: $to_emails" > "$mail_cmd_file"
        echo "Subject: $subject" >> "$mail_cmd_file"
        echo "Content-Type: text/html; charset=UTF-8" >> "$mail_cmd_file"
        echo "" >> "$mail_cmd_file"
        cat "$body_file" >> "$mail_cmd_file"
    fi
    
    # Send email using ssmtp
    if ssmtp $recipients < "$mail_cmd_file"; then
        rm -f "$mail_cmd_file"
        return 0
    else
        rm -f "$mail_cmd_file"
        return 1
    fi
}

#=============================================================================
# Main Email Functions
#=============================================================================

send_success_email() {
    local backup_file="$1"
    local backup_path="$BACKUP_DIR/$backup_file"
    
    log_info "Preparing success email for backup: $backup_file"
    
    # Check if backup file exists
    if [[ ! -f "$backup_path" ]]; then
        log_error "Backup file not found: $backup_path"
        return 1
    fi
    
    # Get file size
    local file_size_mb=$(du -m "$backup_path" | cut -f1)
    
    # Generate email body
    local body_file="/tmp/backup_success_email_$$.html"
    generate_success_email_body "$backup_file" > "$body_file"
    
    # Determine if we should attach the file
    local attachment_file=""
    local subject_prefix="✅"
    
    if [[ $file_size_mb -lt $MAX_ATTACHMENT_SIZE_MB ]]; then
        attachment_file="$backup_path"
        subject_prefix="✅📎"
        log_info "Backup file will be attached (${file_size_mb}MB < ${MAX_ATTACHMENT_SIZE_MB}MB)"
    else
        log_info "Backup file will not be attached (${file_size_mb}MB ≥ ${MAX_ATTACHMENT_SIZE_MB}MB)"
    fi
    
    # Send email
    local subject="$subject_prefix Smart AI Hub Backup Successful - $(date '+%Y-%m-%d')"
    
    if send_email_with_retry "$ADMIN_EMAILS" "$subject" "$body_file" "$attachment_file"; then
        log_info "Success email sent to: $ADMIN_EMAILS"
        rm -f "$body_file"
        return 0
    else
        log_error "Failed to send success email"
        rm -f "$body_file"
        return 1
    fi
}

send_failure_email() {
    local backup_file="$1"
    local error_message="$2"
    
    log_info "Preparing failure email for backup: $backup_file"
    
    # Generate email body
    local body_file="/tmp/backup_failure_email_$$.html"
    generate_failure_email_body "$backup_file" "$error_message" > "$body_file"
    
    # Send email
    local subject="❌ URGENT: Smart AI Hub Backup Failed - $(date '+%Y-%m-%d')"
    
    if send_email_with_retry "$ADMIN_EMAILS" "$subject" "$body_file" ""; then
        log_info "Failure email sent to: $ADMIN_EMAILS"
        rm -f "$body_file"
        return 0
    else
        log_error "Failed to send failure email"
        rm -f "$body_file"
        return 1
    fi
}

#=============================================================================
# Main Function
#=============================================================================

main() {
    local email_type="${1:-}"
    local backup_file="${2:-}"
    local error_message="${3:-}"
    
    # Validate arguments
    if [[ -z "$email_type" ]]; then
        log_error "Usage: $0 <SUCCESS|FAILURE> <backup_file> [error_message]"
        exit 1
    fi
    
    if [[ -z "$backup_file" ]]; then
        log_error "Backup file name is required"
        exit 1
    fi
    
    # Validate email configuration
    validate_email_config
    
    # Send appropriate email
    case "$email_type" in
        "SUCCESS")
            log_info "Sending backup success email..."
            if send_success_email "$backup_file"; then
                log_info "Success email sent successfully"
                exit 0
            else
                log_error "Failed to send success email"
                exit 1
            fi
            ;;
        "FAILURE")
            log_info "Sending backup failure email..."
            if [[ -z "$error_message" ]]; then
                error_message="Backup process failed - check logs for details"
            fi
            if send_failure_email "$backup_file" "$error_message"; then
                log_info "Failure email sent successfully"
                exit 0
            else
                log_error "Failed to send failure email"
                exit 1
            fi
            ;;
        *)
            log_error "Invalid email type: $email_type (must be SUCCESS or FAILURE)"
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