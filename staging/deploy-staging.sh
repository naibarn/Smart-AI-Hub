#!/bin/bash

# Staging Deployment Script
# This script automates the deployment process to the staging environment

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
LOG_FILE="$STAGING_DIR/deployment.log"
BACKUP_DIR="$PROJECT_DIR/backups/staging"
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
    log "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose is not installed or not in PATH."
        exit 1
    fi
    
    # Check if .env.staging exists
    if [ ! -f "$STAGING_DIR/.env.staging" ]; then
        error ".env.staging file not found. Please create it first."
        exit 1
    fi
    
    # Check if SSL certificates exist
    if [ ! -f "$STAGING_DIR/ssl/cert.pem" ] || [ ! -f "$STAGING_DIR/ssl/key.pem" ]; then
        warning "SSL certificates not found. Generating self-signed certificates..."
        bash "$STAGING_DIR/generate-ssl.sh"
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    log "Prerequisites check completed."
}

# Function to backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    # Backup database
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" ps postgres | grep -q "Up"; then
        docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres pg_dump -U postgres smart_ai_hub_staging > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
        log "Database backup created: $BACKUP_DIR/db_backup_$TIMESTAMP.sql"
    fi
    
    # Backup configuration files
    tar -czf "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" -C "$STAGING_DIR" .env.staging nginx.staging.conf prometheus.staging.yml
    log "Configuration backup created: $BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz"
    
    log "Backup completed."
}

# Function to build and deploy services
build_and_deploy() {
    log "Building and deploying services..."
    
    # Change to staging directory
    cd "$STAGING_DIR"
    
    # Stop existing services
    info "Stopping existing services..."
    docker-compose -f docker-compose.staging.yml down || true
    
    # Pull latest images
    info "Pulling latest images..."
    docker-compose -f docker-compose.staging.yml pull
    
    # Build services
    info "Building services..."
    docker-compose -f docker-compose.staging.yml build --no-cache
    
    # Start services
    info "Starting services..."
    docker-compose -f docker-compose.staging.yml up -d
    
    log "Services deployment completed."
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    info "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    
    # Run migrations
    cd "$PROJECT_DIR/packages/core-service"
    if [ -f "package.json" ] && [ -d "prisma" ]; then
        npx prisma migrate deploy
        log "Database migrations completed."
    else
        warning "No migrations found or core-service not available."
    fi
}

# Function to perform health checks
health_checks() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check each service
    services=("postgres" "redis" "auth-service" "core-service" "mcp-server" "analytics-service" "api-gateway" "nginx")
    
    for service in "${services[@]}"; do
        if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" ps "$service" | grep -q "Up"; then
            log "✓ $service is running"
        else
            error "✗ $service is not running"
            return 1
        fi
    done
    
    # Check HTTP endpoints
    endpoints=(
        "http://localhost:8080/health"
        "http://localhost:8080/api/health"
        "http://localhost:8080/auth/health"
        "http://localhost:8080/core/health"
        "http://localhost:8080/mcp/health"
        "http://localhost:8080/analytics/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "$endpoint" > /dev/null; then
            log "✓ $endpoint is responding"
        else
            warning "✗ $endpoint is not responding"
        fi
    done
    
    log "Health checks completed."
}

# Function to generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    REPORT_FILE="$STAGING_DIR/DEPLOYMENT_REPORT_$TIMESTAMP.md"
    
    cat > "$REPORT_FILE" << EOF
# Staging Deployment Report

**Deployment Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Environment:** Staging
**Status:** Success

## Services Status

| Service | Status | Container | Port |
|----------|--------|-----------|------|
$(docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" ps --format "table {{.Service}}\t{{.Status}}\t{{.Name}}\t{{.Ports}}" | sed 's/^/| /' | sed 's/$/ |/')

## Health Check Results

$(docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" ps --format "table {{.Service}}\t{{.State}}" | sed 's/^/| /' | sed 's/$/ |/')

## Access URLs

- **Frontend:** http://localhost:8080
- **API Gateway:** http://localhost:8080/api
- **Auth Service:** http://localhost:8080/auth
- **Core Service:** http://localhost:8080/core
- **MCP Server:** http://localhost:8080/mcp
- **Analytics Service:** http://localhost:8080/analytics
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3000 (admin/admin123)

## Backup Files

- Database: $BACKUP_DIR/db_backup_$TIMESTAMP.sql
- Configuration: $BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz

## Next Steps

1. Run integration tests: \`bash test-staging.sh\`
2. Run performance tests: \`bash performance-test.sh\`
3. Run security tests: \`bash security-test.sh\`
4. Validate monitoring stack
5. Review deployment results

## Logs

Deployment logs are available in: $LOG_FILE

EOF

    log "Deployment report generated: $REPORT_FILE"
}

# Main deployment function
main() {
    log "Starting staging deployment..."
    
    # Initialize log file
    echo "Staging Deployment Log - $(date)" > "$LOG_FILE"
    
    # Run deployment steps
    check_prerequisites
    backup_current_deployment
    build_and_deploy
    run_migrations
    health_checks
    generate_report
    
    log "Staging deployment completed successfully! 🎉"
    echo ""
    echo "Access URLs:"
    echo "  Frontend: http://localhost:8080"
    echo "  API: http://localhost:8080/api"
    echo "  Prometheus: http://localhost:9090"
    echo "  Grafana: http://localhost:3000 (admin/admin123)"
    echo ""
    echo "Next steps:"
    echo "  1. Run tests: bash test-staging.sh"
    echo "  2. View report: cat $REPORT_FILE"
}

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    backup)
        check_prerequisites
        backup_current_deployment
        ;;
    health)
        health_checks
        ;;
    rollback)
        bash "$STAGING_DIR/rollback-staging.sh"
        ;;
    *)
        echo "Usage: $0 {deploy|backup|health|rollback}"
        echo "  deploy  - Full deployment (default)"
        echo "  backup  - Backup current deployment"
        echo "  health  - Run health checks"
        echo "  rollback - Rollback to previous version"
        exit 1
        ;;
esac