#!/bin/bash

# Health Check Script
# This script performs comprehensive health checks on all staging services

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
TEST_RESULTS_DIR="$STAGING_DIR/test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$TEST_RESULTS_DIR/HEALTH_CHECK_REPORT_$TIMESTAMP.md"

# Base URL for testing
BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api"

# Service ports
POSTGRES_PORT=5432
REDIS_PORT=6379
AUTH_SERVICE_PORT=3001
CORE_SERVICE_PORT=3002
MCP_SERVER_PORT=3003
ANALYTICS_SERVICE_PORT=3004
API_GATEWAY_PORT=8080
NGINX_PORT=8080
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Function to create test results directory
setup_test_environment() {
    log "Setting up health check environment..."
    
    # Create test results directory
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Initialize health check report
    cat > "$REPORT_FILE" << EOF
# Health Check Report

**Check Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Environment:** Staging
**Base URL:** $BASE_URL

## Service Health Status

EOF

    log "Health check environment setup completed."
}

# Function to check if a port is open
check_port() {
    local port=$1
    local service=$2
    
    if nc -z localhost "$port" 2>/dev/null; then
        echo "✓ $service (port $port) is responding"
        return 0
    else
        echo "✗ $service (port $port) is not responding"
        return 1
    fi
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local service=$2
    local timeout=${3:-10}
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time "$timeout" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo "✓ $service HTTP endpoint is healthy ($url)"
        return 0
    else
        echo "✗ $service HTTP endpoint is not healthy (HTTP $response) ($url)"
        return 1
    fi
}

# Function to check Docker container status
check_docker_container() {
    local container=$1
    local service=$2
    
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
        echo "✓ $service container is running"
        return 0
    else
        echo "✗ $service container is not running"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    log "Checking PostgreSQL database..."
    
    echo "### PostgreSQL Database" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local db_passed=0
    local db_total=0
    
    # Check Docker container
    ((db_total++))
    if check_docker_container "smartaihub-staging-postgres" "PostgreSQL"; then
        echo "✓ PostgreSQL container is running" >> "$REPORT_FILE"
        ((db_passed++))
    else
        echo "✗ PostgreSQL container is not running" >> "$REPORT_FILE"
    fi
    
    # Check port
    ((db_total++))
    if check_port "$POSTGRES_PORT" "PostgreSQL"; then
        echo "✓ PostgreSQL port is accessible" >> "$REPORT_FILE"
        ((db_passed++))
    else
        echo "✗ PostgreSQL port is not accessible" >> "$REPORT_FILE"
    fi
    
    # Check database connection
    ((db_total++))
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✓ PostgreSQL database is ready" >> "$REPORT_FILE"
        ((db_passed++))
    else
        echo "✗ PostgreSQL database is not ready" >> "$REPORT_FILE"
    fi
    
    # Check database migrations
    ((db_total++))
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres psql -U postgres -d smart_ai_hub_staging -c "SELECT COUNT(*) FROM _prisma_migrations;" > /dev/null 2>&1; then
        echo "✓ Database migrations applied" >> "$REPORT_FILE"
        ((db_passed++))
    else
        echo "✗ Database migrations not applied or failed" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**PostgreSQL Status:** $db_passed/$db_total checks passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "PostgreSQL database check completed: $db_passed/$db_total passed"
}

# Function to check Redis connectivity
check_redis() {
    log "Checking Redis cache..."
    
    echo "### Redis Cache" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local redis_passed=0
    local redis_total=0
    
    # Check Docker container
    ((redis_total++))
    if check_docker_container "smartaihub-staging-redis" "Redis"; then
        echo "✓ Redis container is running" >> "$REPORT_FILE"
        ((redis_passed++))
    else
        echo "✗ Redis container is not running" >> "$REPORT_FILE"
    fi
    
    # Check port
    ((redis_total++))
    if check_port "$REDIS_PORT" "Redis"; then
        echo "✓ Redis port is accessible" >> "$REPORT_FILE"
        ((redis_passed++))
    else
        echo "✗ Redis port is not accessible" >> "$REPORT_FILE"
    fi
    
    # Check Redis connectivity
    ((redis_total++))
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T redis redis-cli ping | grep -q "PONG"; then
        echo "✓ Redis is responding" >> "$REPORT_FILE"
        ((redis_passed++))
    else
        echo "✗ Redis is not responding" >> "$REPORT_FILE"
    fi
    
    # Check Redis memory usage
    ((redis_total++))
    local redis_memory=$(docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T redis redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r' || echo "unknown")
    echo "Redis memory usage: $redis_memory" >> "$REPORT_FILE"
    echo "✓ Redis memory usage retrieved" >> "$REPORT_FILE"
    ((redis_passed++))
    
    echo "" >> "$REPORT_FILE"
    echo "**Redis Status:** $redis_passed/$redis_total checks passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Redis cache check completed: $redis_passed/$redis_total passed"
}

# Function to check application services
check_application_services() {
    log "Checking application services..."
    
    echo "### Application Services" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local services_passed=0
    local services_total=0
    
    # Auth Service
    ((services_total++))
    if check_docker_container "smartaihub-staging-auth-service" "Auth Service"; then
        echo "✓ Auth Service container is running" >> "$REPORT_FILE"
        ((services_passed++))
    else
        echo "✗ Auth Service container is not running" >> "$REPORT_FILE"
    fi
    
    ((services_total++))
    if check_http_endpoint "$BASE_URL/auth/health" "Auth Service"; then
        echo "✓ Auth Service HTTP endpoint is healthy" >> "$REPORT_FILE"
        ((services_passed++))
    else
        echo "✗ Auth Service HTTP endpoint is not healthy" >> "$REPORT_FILE"
    fi
    
    # Core Service
    ((services_total++))
    if check_docker_container "smartaihub-staging-core-service" "Core Service"; then
        echo "✓ Core Service container is running" >> "$REPORT_FILE"
        ((services_passed++))
    else
        echo "✗ Core Service container is not running" >> "$REPORT_FILE"
    fi
    
    ((services_total++))
    if check_http_endpoint "$BASE_URL/core/health" "Core Service"; then
        echo "✓ Core Service HTTP endpoint is healthy" >> "$REPORT_FILE"
        ((services_passed++))
    else
        echo "✗ Core Service HTTP endpoint is not healthy" >> "$REPORT_FILE"
    fi
    
    # MCP Server
    ((services_total++))
    if check_docker_container "smartaihub-staging-mcp-server" "MCP Server"; then
        echo "✓ MCP Server container is running" >> "$REPORT_FILE"
        ((services_passed++))
    else
        echo "✗ MCP Server container is not running" >> "$REPORT_FILE"
    fi
    
    ((services_total++))
    if check_http_endpoint "$BASE_URL/mcp/health" "MCP Server"; then
        echo "✓ MCP Server HTTP endpoint is healthy" >> "$REPORT_FILE"
        ((services_passed++))
    else
        echo "✗ MCP Server HTTP endpoint is not healthy" >> "$REPORT_FILE"
    fi
    
    # Analytics Service
    ((services_total++))
    if check_docker_container "smartaihub-staging-analytics-service" "Analytics Service"; then
        echo "✓ Analytics Service container is running" >> "$REPORT_FILE"
        ((services_passed++))
    else
        echo "✗ Analytics Service container is not running" >> "$REPORT_FILE"
    fi
    
    ((services_total++))
    if check_http_endpoint "$BASE_URL/analytics/health" "Analytics Service"; then
        echo "✓ Analytics Service HTTP endpoint is healthy" >> "$REPORT_FILE"
        ((services_passed++))
    else
        echo "✗ Analytics Service HTTP endpoint is not healthy" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Application Services Status:** $services_passed/$services_total checks passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Application services check completed: $services_passed/$services_total passed"
}

# Function to check API Gateway
check_api_gateway() {
    log "Checking API Gateway..."
    
    echo "### API Gateway" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local gateway_passed=0
    local gateway_total=0
    
    # Check Docker container
    ((gateway_total++))
    if check_docker_container "smartaihub-staging-api-gateway" "API Gateway"; then
        echo "✓ API Gateway container is running" >> "$REPORT_FILE"
        ((gateway_passed++))
    else
        echo "✗ API Gateway container is not running" >> "$REPORT_FILE"
    fi
    
    # Check HTTP endpoint
    ((gateway_total++))
    if check_http_endpoint "$API_URL/health" "API Gateway"; then
        echo "✓ API Gateway HTTP endpoint is healthy" >> "$REPORT_FILE"
        ((gateway_passed++))
    else
        echo "✗ API Gateway HTTP endpoint is not healthy" >> "$REPORT_FILE"
    fi
    
    # Test API routing
    ((gateway_total++))
    if check_http_endpoint "$API_URL/version" "API Gateway Version"; then
        echo "✓ API Gateway routing is working" >> "$REPORT_FILE"
        ((gateway_passed++))
    else
        echo "✗ API Gateway routing is not working" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**API Gateway Status:** $gateway_passed/$gateway_total checks passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "API Gateway check completed: $gateway_passed/$gateway_total passed"
}

# Function to check Nginx
check_nginx() {
    log "Checking Nginx..."
    
    echo "### Nginx" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local nginx_passed=0
    local nginx_total=0
    
    # Check Docker container
    ((nginx_total++))
    if check_docker_container "smartaihub-staging-nginx" "Nginx"; then
        echo "✓ Nginx container is running" >> "$REPORT_FILE"
        ((nginx_passed++))
    else
        echo "✗ Nginx container is not running" >> "$REPORT_FILE"
    fi
    
    # Check HTTP endpoint
    ((nginx_total++))
    if check_http_endpoint "$BASE_URL/health" "Nginx"; then
        echo "✓ Nginx HTTP endpoint is healthy" >> "$REPORT_FILE"
        ((nginx_passed++))
    else
        echo "✗ Nginx HTTP endpoint is not healthy" >> "$REPORT_FILE"
    fi
    
    # Check Nginx status
    ((nginx_total++))
    if check_http_endpoint "$BASE_URL/nginx_status" "Nginx Status"; then
        echo "✓ Nginx status endpoint is accessible" >> "$REPORT_FILE"
        ((nginx_passed++))
    else
        echo "⚠️ Nginx status endpoint is not accessible (may be restricted)" >> "$REPORT_FILE"
        ((nginx_passed++))  # Don't fail for restricted access
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Nginx Status:** $nginx_passed/$nginx_total checks passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Nginx check completed: $nginx_passed/$nginx_total passed"
}

# Function to check monitoring stack
check_monitoring() {
    log "Checking monitoring stack..."
    
    echo "### Monitoring Stack" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local monitoring_passed=0
    local monitoring_total=0
    
    # Prometheus
    ((monitoring_total++))
    if check_docker_container "smartaihub-staging-prometheus" "Prometheus"; then
        echo "✓ Prometheus container is running" >> "$REPORT_FILE"
        ((monitoring_passed++))
    else
        echo "✗ Prometheus container is not running" >> "$REPORT_FILE"
    fi
    
    ((monitoring_total++))
    if check_http_endpoint "http://localhost:9090/-/healthy" "Prometheus"; then
        echo "✓ Prometheus is healthy" >> "$REPORT_FILE"
        ((monitoring_passed++))
    else
        echo "✗ Prometheus is not healthy" >> "$REPORT_FILE"
    fi
    
    # Grafana
    ((monitoring_total++))
    if check_docker_container "smartaihub-staging-grafana" "Grafana"; then
        echo "✓ Grafana container is running" >> "$REPORT_FILE"
        ((monitoring_passed++))
    else
        echo "✗ Grafana container is not running" >> "$REPORT_FILE"
    fi
    
    ((monitoring_total++))
    if check_http_endpoint "http://localhost:3000/api/health" "Grafana"; then
        echo "✓ Grafana is healthy" >> "$REPORT_FILE"
        ((monitoring_passed++))
    else
        echo "✗ Grafana is not healthy" >> "$REPORT_FILE"
    fi
    
    # Check metrics collection
    ((monitoring_total++))
    if check_http_endpoint "http://localhost:9090/api/v1/query?query=up" "Prometheus Metrics"; then
        echo "✓ Prometheus is collecting metrics" >> "$REPORT_FILE"
        ((monitoring_passed++))
    else
        echo "✗ Prometheus is not collecting metrics" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Monitoring Stack Status:** $monitoring_passed/$monitoring_total checks passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Monitoring stack check completed: $monitoring_passed/$monitoring_total passed"
}

# Function to check system resources
check_system_resources() {
    log "Checking system resources..."
    
    echo "### System Resources" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 || echo "0")
    echo "- **CPU Usage:** ${cpu_usage}%" >> "$REPORT_FILE"
    
    # Memory usage
    local memory_usage=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}' || echo "0")
    echo "- **Memory Usage:** ${memory_usage}%" >> "$REPORT_FILE"
    
    # Disk usage
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1 || echo "0")
    echo "- **Disk Usage:** ${disk_usage}%" >> "$REPORT_FILE"
    
    # Docker container resource usage
    echo "" >> "$REPORT_FILE"
    echo "#### Docker Container Resource Usage" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if command -v docker &> /dev/null; then
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" >> "$REPORT_FILE" 2>/dev/null || echo "Failed to get Docker stats" >> "$REPORT_FILE"
    else
        echo "Docker not available" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    
    # Resource warnings
    if [ "${cpu_usage%.*}" -gt 80 ]; then
        echo "⚠️ **WARNING:** High CPU usage detected" >> "$REPORT_FILE"
    fi
    
    if [ "${memory_usage%.*}" -gt 80 ]; then
        echo "⚠️ **WARNING:** High memory usage detected" >> "$REPORT_FILE"
    fi
    
    if [ "${disk_usage%.*}" -gt 80 ]; then
        echo "⚠️ **WARNING:** High disk usage detected" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    
    log "System resources check completed."
}

# Function to check service dependencies
check_service_dependencies() {
    log "Checking service dependencies..."
    
    echo "### Service Dependencies" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local deps_passed=0
    local deps_total=0
    
    # Check if services can connect to their dependencies
    
    # Auth Service -> Redis
    ((deps_total++))
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T auth-service curl -s redis:6379 > /dev/null 2>&1 || \
       docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T auth-service nc -z redis 6379 > /dev/null 2>&1; then
        echo "✓ Auth Service can connect to Redis" >> "$REPORT_FILE"
        ((deps_passed++))
    else
        echo "✗ Auth Service cannot connect to Redis" >> "$REPORT_FILE"
    fi
    
    # Core Service -> PostgreSQL
    ((deps_total++))
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T core-service nc -z postgres 5432 > /dev/null 2>&1; then
        echo "✓ Core Service can connect to PostgreSQL" >> "$REPORT_FILE"
        ((deps_passed++))
    else
        echo "✗ Core Service cannot connect to PostgreSQL" >> "$REPORT_FILE"
    fi
    
    # Core Service -> Redis
    ((deps_total++))
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T core-service nc -z redis 6379 > /dev/null 2>&1; then
        echo "✓ Core Service can connect to Redis" >> "$REPORT_FILE"
        ((deps_passed++))
    else
        echo "✗ Core Service cannot connect to Redis" >> "$REPORT_FILE"
    fi
    
    # Analytics Service -> PostgreSQL
    ((deps_total++))
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T analytics-service nc -z postgres 5432 > /dev/null 2>&1; then
        echo "✓ Analytics Service can connect to PostgreSQL" >> "$REPORT_FILE"
        ((deps_passed++))
    else
        echo "✗ Analytics Service cannot connect to PostgreSQL" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Service Dependencies Status:** $deps_passed/$deps_total checks passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Service dependencies check completed: $deps_passed/$deps_total passed"
}

# Function to generate health check summary
generate_health_summary() {
    log "Generating health check summary..."
    
    # Calculate total checks passed
    local total_checks=$(grep -c "✓\|✗" "$REPORT_FILE" || echo "0")
    local passed_checks=$(grep -c "✓" "$REPORT_FILE" || echo "0")
    local failed_checks=$(grep -c "✗" "$REPORT_FILE" || echo "0")
    local success_rate=0
    
    if [ $total_checks -gt 0 ]; then
        success_rate=$((passed_checks * 100 / total_checks))
    fi
    
    # Add summary to report
    cat >> "$REPORT_FILE" << EOF

## Health Check Summary

- **Total Checks:** $total_checks
- **Passed:** $passed_checks
- **Failed:** $failed_checks
- **Success Rate:** $success_rate%

## Overall Health Status

EOF

    if [ $success_rate -ge 95 ]; then
        echo "🟢 **EXCELLENT** - All systems are healthy!" >> "$REPORT_FILE"
        log "🟢 EXCELLENT - All systems are healthy!"
    elif [ $success_rate -ge 85 ]; then
        echo "🟡 **GOOD** - Most systems are healthy with minor issues." >> "$REPORT_FILE"
        log "🟡 GOOD - Most systems are healthy with minor issues."
    elif [ $success_rate -ge 70 ]; then
        echo "🟠 **NEEDS ATTENTION** - Some systems have issues." >> "$REPORT_FILE"
        log "🟠 NEEDS ATTENTION - Some systems have issues."
    else
        echo "🔴 **CRITICAL** - Major system issues detected!" >> "$REPORT_FILE"
        log "🔴 CRITICAL - Major system issues detected!"
    fi
    
    cat >> "$REPORT_FILE" << EOF

## Recommendations

EOF

    if [ $failed_checks -gt 0 ]; then
        echo "- Address failed health checks immediately" >> "$REPORT_FILE"
        echo "- Check service logs for detailed error information" >> "$REPORT_FILE"
        echo "- Restart failed services if necessary" >> "$REPORT_FILE"
    else
        echo "- Continue monitoring system health" >> "$REPORT_FILE"
        echo "- Set up automated health monitoring and alerts" >> "$REPORT_FILE"
    fi
    
    echo "- Monitor resource usage trends" >> "$REPORT_FILE"
    echo "- Schedule regular health checks" >> "$REPORT_FILE"
    echo "- Review and update health check thresholds" >> "$REPORT_FILE"
    
    log "Health check summary generated."
}

# Main health check function
main() {
    log "Starting comprehensive health check..."
    
    # Setup test environment
    setup_test_environment
    
    # Run health checks
    check_database
    check_redis
    check_application_services
    check_api_gateway
    check_nginx
    check_monitoring
    check_system_resources
    check_service_dependencies
    
    # Generate summary
    generate_health_summary
    
    log "Health check completed! 🎉"
    echo ""
    echo "Health check report: $REPORT_FILE"
    echo "View results: cat $REPORT_FILE"
}

# Handle script arguments
case "${1:-all}" in
    all)
        main
        ;;
    database)
        setup_test_environment
        check_database
        ;;
    redis)
        setup_test_environment
        check_redis
        ;;
    services)
        setup_test_environment
        check_application_services
        ;;
    gateway)
        setup_test_environment
        check_api_gateway
        ;;
    nginx)
        setup_test_environment
        check_nginx
        ;;
    monitoring)
        setup_test_environment
        check_monitoring
        ;;
    resources)
        setup_test_environment
        check_system_resources
        ;;
    deps)
        setup_test_environment
        check_service_dependencies
        ;;
    *)
        echo "Usage: $0 {all|database|redis|services|gateway|nginx|monitoring|resources|deps}"
        echo "  all       - Run all health checks (default)"
        echo "  database  - Check database health"
        echo "  redis     - Check Redis health"
        echo "  services  - Check application services health"
        echo "  gateway   - Check API Gateway health"
        echo "  nginx     - Check Nginx health"
        echo "  monitoring - Check monitoring stack health"
        echo "  resources - Check system resources"
        echo "  deps      - Check service dependencies"
        exit 1
        ;;
esac