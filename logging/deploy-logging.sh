#!/bin/bash

# Smart AI Hub Logging Infrastructure Deployment Script
# This script deploys the Loki logging stack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="/var/log/smart-ai-hub"
COMPOSE_FILE="docker-compose.logging.yml"
NETWORK_NAME="logging"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    log_info "Docker and Docker Compose are available"
}

create_directories() {
    log_info "Creating log directories..."
    
    # Create log directories for each service
    sudo mkdir -p "${LOG_DIR}/auth-service"
    sudo mkdir -p "${LOG_DIR}/core-service"
    sudo mkdir -p "${LOG_DIR}/mcp-server"
    sudo mkdir -p "${LOG_DIR}/analytics-service"
    sudo mkdir -p "${LOG_DIR}/webhook-service"
    sudo mkdir -p "${LOG_DIR}/api-gateway"
    
    # Set permissions
    sudo chown -R $USER:$USER "${LOG_DIR}"
    chmod -R 755 "${LOG_DIR}"
    
    log_info "Log directories created successfully"
}

create_network() {
    log_info "Creating Docker network..."
    
    if ! docker network ls | grep -q "${NETWORK_NAME}"; then
        docker network create "${NETWORK_NAME}"
        log_info "Docker network created"
    else
        log_info "Docker network already exists"
    fi
}

deploy_services() {
    log_info "Deploying logging services..."
    
    # Pull latest images
    docker-compose -f "${COMPOSE_FILE}" pull
    
    # Start services
    docker-compose -f "${COMPOSE_FILE}" up -d
    
    log_info "Services deployed successfully"
}

wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # Wait for Loki
    log_info "Waiting for Loki..."
    for i in {1..30}; do
        if curl -s http://localhost:3100/ready > /dev/null 2>&1; then
            log_info "Loki is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Loki failed to start within 30 seconds"
            exit 1
        fi
        sleep 1
    done
    
    # Wait for Promtail
    log_info "Waiting for Promtail..."
    for i in {1..30}; do
        if curl -s http://localhost:9080/ready > /dev/null 2>&1; then
            log_info "Promtail is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Promtail failed to start within 30 seconds"
            exit 1
        fi
        sleep 1
    done
    
    # Wait for Grafana
    log_info "Waiting for Grafana..."
    for i in {1..60}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            log_info "Grafana is ready"
            break
        fi
        if [ $i -eq 60 ]; then
            log_error "Grafana failed to start within 60 seconds"
            exit 1
        fi
        sleep 1
    done
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check container status
    if ! docker-compose -f "${COMPOSE_FILE}" ps | grep -q "Up"; then
        log_error "Some containers are not running"
        docker-compose -f "${COMPOSE_FILE}" ps
        exit 1
    fi
    
    # Test Loki API
    if ! curl -s http://localhost:3100/loki/api/v1/labels > /dev/null 2>&1; then
        log_error "Loki API is not responding"
        exit 1
    fi
    
    # Test Grafana API
    if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        log_error "Grafana API is not responding"
        exit 1
    fi
    
    log_info "Deployment verified successfully"
}

show_info() {
    log_info "Logging infrastructure deployed successfully!"
    echo
    echo "Services are available at:"
    echo "  Loki:      http://localhost:3100"
    echo "  Promtail:  http://localhost:9080"
    echo "  Grafana:   http://localhost:3000"
    echo "  Alertmanager: http://localhost:9093"
    echo
    echo "Grafana Credentials:"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo
    echo "Log directories:"
    echo "  ${LOG_DIR}/"
    echo
    echo "Useful commands:"
    echo "  View logs: docker-compose -f ${COMPOSE_FILE} logs -f [service]"
    echo "  Stop services: docker-compose -f ${COMPOSE_FILE} down"
    echo "  Restart services: docker-compose -f ${COMPOSE_FILE} restart"
    echo
    log_warn "Remember to configure your services to write logs to ${LOG_DIR}/[service-name]/"
}

cleanup() {
    log_info "Cleaning up old containers..."
    docker-compose -f "${COMPOSE_FILE}" down -v --remove-orphans 2>/dev/null || true
    docker system prune -f
}

# Main execution
main() {
    echo "Smart AI Hub Logging Infrastructure Deployment"
    echo "=============================================="
    echo
    
    # Check if cleanup is requested
    if [ "$1" = "--cleanup" ]; then
        cleanup
        exit 0
    fi
    
    # Check if we're in the right directory
    if [ ! -f "${COMPOSE_FILE}" ]; then
        log_error "docker-compose.logging.yml not found in current directory"
        log_error "Please run this script from the logging directory"
        exit 1
    fi
    
    # Run deployment steps
    check_docker
    create_directories
    create_network
    deploy_services
    wait_for_services
    verify_deployment
    show_info
    
    log_info "Deployment completed successfully!"
}

# Run main function with all arguments
main "$@"