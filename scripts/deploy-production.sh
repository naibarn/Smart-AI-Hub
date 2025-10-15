#!/bin/bash

# Smart AI Hub Production Deployment Script
# This script automates the deployment process to production environment

set -e  # Exit on any error

# Configuration
ENVIRONMENT="production"
BACKUP_DIR="/backups"
LOG_FILE="/var/log/smartaihub-deploy.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Function to verify environment
verify_environment() {
    log "Verifying production environment..."
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        error ".env.production file not found. Please create it from the template."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker service."
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose is not installed. Please install it first."
        exit 1
    fi
    
    # Check if SSL certificates exist
    if [ ! -d "ssl" ]; then
        warning "SSL directory not found. Creating self-signed certificates for testing."
        mkdir -p ssl
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    fi
    
    log "Environment verification completed successfully."
}

# Function to create backups
create_backups() {
    log "Creating backups..."
    
    # Create backup directory if it doesn't exist
    mkdir -p $BACKUP_DIR
    
    # Backup database
    if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
        log "Creating database backup..."
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres smart_ai_hub | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
        log "Database backup created: $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
    fi
    
    # Backup current configuration
    tar -czf "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" .env.production nginx.prod.conf docker-compose.prod.yml
    log "Configuration backup created: $BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz"
    
    # Clean old backups (keep last 7 days)
    find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
    log "Old backups cleaned up."
}

# Function to update application code
update_code() {
    log "Updating application code..."
    
    # Pull latest changes
    git pull origin main
    
    # Install dependencies
    npm ci --production
    
    # Build packages
    npm run build
    
    log "Application code updated successfully."
}

# Function to deploy services
deploy_services() {
    log "Deploying services to production..."
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose -f docker-compose.prod.yml down
    
    # Build new images
    log "Building new Docker images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    log "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    log "Services deployed successfully."
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 30
    
    # Run migrations
    docker-compose -f docker-compose.prod.yml exec core-service npm run db:migrate
    
    log "Database migrations completed."
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if all services are running
    services=("postgres" "redis" "nginx" "api-gateway" "auth-service" "core-service" "mcp-server" "frontend")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps $service | grep -q "Up"; then
            log "$service is running."
        else
            error "$service is not running. Deployment failed."
            exit 1
        fi
    done
    
    # Check health endpoints
    sleep 10
    
    # Check API Gateway
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log "API Gateway health check passed."
    else
        error "API Gateway health check failed."
        exit 1
    fi
    
    # Check Auth Service
    if curl -f http://localhost/auth/health > /dev/null 2>&1; then
        log "Auth Service health check passed."
    else
        error "Auth Service health check failed."
        exit 1
    fi
    
    # Check Core Service
    if curl -f http://localhost/core/health > /dev/null 2>&1; then
        log "Core Service health check passed."
    else
        error "Core Service health check failed."
        exit 1
    fi
    
    # Check MCP Server
    if curl -f http://localhost/mcp/health > /dev/null 2>&1; then
        log "MCP Server health check passed."
    else
        error "MCP Server health check failed."
        exit 1
    fi
    
    log "Deployment verification completed successfully."
}

# Function to setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create monitoring directory if it doesn't exist
    mkdir -p monitoring
    
    # Setup log rotation
    cat > /etc/logrotate.d/smartaihub << EOF
/var/log/smartaihub-deploy.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF
    
    log "Monitoring setup completed."
}

# Function to display deployment summary
display_summary() {
    log "Deployment completed successfully!"
    log "Deployment timestamp: $TIMESTAMP"
    log "Backup location: $BACKUP_DIR"
    log "Log file: $LOG_FILE"
    
    echo ""
    echo "=== Production Deployment Summary ==="
    echo "Status: Success"
    echo "Timestamp: $TIMESTAMP"
    echo "Environment: $ENVIRONMENT"
    echo ""
    echo "Service URLs:"
    echo "  Frontend: https://yourdomain.com"
    echo "  API Gateway: https://yourdomain.com/api"
    echo "  Auth Service: https://yourdomain.com/auth"
    echo "  Core Service: https://yourdomain.com/core"
    echo "  MCP Server: https://yourdomain.com/mcp"
    echo ""
    echo "To check service status: docker-compose -f docker-compose.prod.yml ps"
    echo "To view logs: docker-compose -f docker-compose.prod.yml logs -f [service-name]"
    echo "To stop services: docker-compose -f docker-compose.prod.yml down"
    echo ""
}

# Main deployment function
main() {
    log "Starting Smart AI Hub production deployment..."
    log "Deployment timestamp: $TIMESTAMP"
    
    # Run deployment steps
    check_root
    verify_environment
    create_backups
    update_code
    deploy_services
    run_migrations
    verify_deployment
    setup_monitoring
    display_summary
    
    log "Production deployment completed successfully!"
}

# Handle script interruption
trap 'error "Deployment interrupted. Please check the logs: $LOG_FILE"' INT

# Run main function
main "$@"