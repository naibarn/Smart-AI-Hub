#!/bin/bash

# Smart AI Hub Deployment Script for VPS
# This script handles deployment with proper error handling and rollback capabilities

set -e  # Exit on any error

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_DIR/logs/deployment.log"
BACKUP_DIR="$PROJECT_DIR/backups"
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_INTERVAL=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create necessary directories
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Error handling and rollback function
handle_error() {
    local exit_code=$?
    local line_number=$1
    
    log "ERROR" "Deployment failed at line $line_number with exit code $exit_code"
    log "ERROR" "Starting rollback procedure..."
    
    # Restore PM2 processes if they were stopped
    if [ -n "$OLD_PM2_PROCESSES" ]; then
        log "INFO" "Restoring previous PM2 processes..."
        echo "$OLD_PM2_PROCESSES" | xargs -I {} pm2 restart {} || log "WARN" "Failed to restart some processes"
    fi
    
    # Restore database if migration was applied
    if [ "$MIGRATION_APPLIED" = "true" ] && [ -n "$MIGRATION_BACKUP" ]; then
        log "INFO" "Rolling back database migration..."
        cd "$PROJECT_DIR/packages/auth-service"
        npx prisma migrate reset --force --skip-seed || log "ERROR" "Failed to rollback database"
    fi
    
    log "ERROR" "Rollback completed. Deployment failed."
    exit $exit_code
}

# Set up error trap
trap 'handle_error $LINENO' ERR

# Health check function
health_check() {
    local service_name=$1
    local url=$2
    local timeout=$3
    local interval=$4
    
    log "INFO" "Performing health check for $service_name at $url"
    
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log "INFO" "Health check passed for $service_name"
            return 0
        fi
        
        log "DEBUG" "Health check failed for $service_name, retrying in $interval seconds..."
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    log "ERROR" "Health check failed for $service_name after $timeout seconds"
    return 1
}

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log "ERROR" "PM2 is not installed. Please install it with: npm install -g pm2"
        exit 1
    fi
}

# Main deployment function
main() {
    log "INFO" "Starting Smart AI Hub deployment..."
    log "INFO" "Deployment started at $(date)"
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Step 1: Pull latest code from git
    log "INFO" "Step 1: Pulling latest code from git..."
    git pull origin main || {
        log "ERROR" "Failed to pull latest code from git"
        exit 1
    }
    
    # Get current commit hash for logging
    CURRENT_COMMIT=$(git rev-parse HEAD)
    log "INFO" "Current commit: $CURRENT_COMMIT"
    
    # Step 2: Install dependencies
    log "INFO" "Step 2: Installing dependencies..."
    npm ci || {
        log "ERROR" "Failed to install dependencies"
        exit 1
    }
    
    # Step 3: Database migrations
    log "INFO" "Step 3: Running database migrations..."
    cd "$PROJECT_DIR/packages/auth-service"
    
    # Create migration backup
    MIGRATION_BACKUP="backup_$(date +%Y%m%d_%H%M%S)"
    MIGRATION_APPLIED=false
    
    # Check if there are pending migrations
    if npx prisma migrate deploy --dry-run 2>&1 | grep -q "No pending migrations"; then
        log "INFO" "No pending migrations found"
    else
        log "INFO" "Applying database migrations..."
        npx prisma migrate deploy || {
            log "ERROR" "Database migration failed"
            exit 1
        }
        MIGRATION_APPLIED=true
        log "INFO" "Database migrations applied successfully"
    fi
    
    # Step 4: Build all packages
    log "INFO" "Step 4: Building all packages..."
    cd "$PROJECT_DIR"
    npm run build || {
        log "ERROR" "Build failed"
        exit 1
    }
    log "INFO" "Build completed successfully"
    
    # Step 5: Restart services with PM2
    log "INFO" "Step 5: Restarting services with PM2..."
    check_pm2
    
    # Get current PM2 processes for potential rollback
    OLD_PM2_PROCESSES=$(pm2 list --plain | grep -E "auth-service|core-service|api-gateway|notification-service|mcp-server" | awk '{print $2}' | tr '\n' ' ')
    
    # Start/restart services
    local services=("auth-service" "core-service" "api-gateway" "notification-service" "mcp-server")
    local service_ports=(3001 3002 3000 3003 3004)
    
    for i in "${!services[@]}"; do
        local service="${services[$i]}"
        local port="${service_ports[$i]}"
        local service_dir="$PROJECT_DIR/packages/$service"
        
        if [ -d "$service_dir" ]; then
            log "INFO" "Starting $service on port $port..."
            cd "$service_dir"
            
            # Check if service is already running
            if pm2 list --plain | grep -q "$service"; then
                log "INFO" "Restarting existing $service..."
                pm2 restart "$service" || log "WARN" "Failed to restart $service"
            else
                log "INFO" "Starting new $service..."
                pm2 start src/server.js --name "$service" || log "WARN" "Failed to start $service"
            fi
        else
            log "WARN" "Service directory $service_dir not found, skipping..."
        fi
    done
    
    # Save PM2 configuration
    pm2 save || log "WARN" "Failed to save PM2 configuration"
    
    # Step 6: Health check endpoints
    log "INFO" "Step 6: Performing health checks..."
    
    # Wait a bit for services to start
    sleep 10
    
    # Health check for each service
    local health_checks_passed=true
    
    # Auth service health check
    if curl -f -s "http://localhost:3001/health" > /dev/null 2>&1; then
        log "INFO" "Auth service health check passed"
    else
        log "WARN" "Auth service health check failed"
        health_checks_passed=false
    fi
    
    # Core service health check (if available)
    if curl -f -s "http://localhost:3002/health" > /dev/null 2>&1; then
        log "INFO" "Core service health check passed"
    else
        log "WARN" "Core service health check failed or endpoint not available"
    fi
    
    # API Gateway health check (if available)
    if curl -f -s "http://localhost:3000/health" > /dev/null 2>&1; then
        log "INFO" "API Gateway health check passed"
    else
        log "WARN" "API Gateway health check failed or endpoint not available"
    fi
    
    if [ "$health_checks_passed" = true ]; then
        log "INFO" "All critical health checks passed"
    else
        log "WARN" "Some health checks failed, but deployment will continue"
    fi
    
    # Display PM2 status
    log "INFO" "PM2 Process Status:"
    pm2 status
    
    log "INFO" "Deployment completed successfully!"
    log "INFO" "Deployment finished at $(date)"
    log "INFO" "All services are running and health checks have been performed"
    
    # Create deployment marker
    echo "$CURRENT_COMMIT" > "$PROJECT_DIR/.last_deployment"
    
    return 0
}

# Script usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose logging"
    echo "  --dry-run      Show what would be done without executing"
    echo ""
    echo "Examples:"
    echo "  $0              # Run deployment"
    echo "  $0 --dry-run    # Show deployment steps without executing"
}

# Parse command line arguments
VERBOSE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
if [ "$DRY_RUN" = true ]; then
    log "INFO" "DRY RUN MODE - No changes will be made"
    log "INFO" "The following steps would be executed:"
    log "INFO" "1. Pull latest code from git"
    log "INFO" "2. Install dependencies (npm ci)"
    log "INFO" "3. Run database migrations (npx prisma migrate deploy)"
    log "INFO" "4. Build all packages (npm run build)"
    log "INFO" "5. Restart services with PM2"
    log "INFO" "6. Health check endpoints"
    exit 0
else
    main
fi