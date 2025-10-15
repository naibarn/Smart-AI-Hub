#!/bin/bash

# Deployment Validation Script
# This script performs comprehensive deployment validation and generates reports

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
REPORT_FILE="$TEST_RESULTS_DIR/STAGING_DEPLOYMENT_REPORT_$TIMESTAMP.md"

# Base URL for testing
BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api"

# Validation thresholds
MAX_RESPONSE_TIME=2000  # 2 seconds
MAX_ERROR_RATE=1  # 1%
MIN_SUCCESS_RATE=95  # 95%

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
setup_validation_environment() {
    log "Setting up deployment validation environment..."
    
    # Create test results directory
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Initialize deployment validation report
    cat > "$REPORT_FILE" << EOF
# Staging Deployment Validation Report

**Validation Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Environment:** Staging
**Base URL:** $BASE_URL

## Executive Summary

EOF

    log "Deployment validation environment setup completed."
}

# Function to validate services status
validate_services_status() {
    log "Validating services status..."
    
    echo "### Services Status" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local services_passed=0
    local services_total=0
    
    # Get service status from docker-compose
    local service_status=$(docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}" || echo "")
    
    echo "$service_status" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check each service
    local services=("postgres" "redis" "auth-service" "core-service" "mcp-server" "analytics-service" "api-gateway" "nginx" "prometheus" "grafana")
    
    for service in "${services[@]}"; do
        ((services_total++))
        if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" ps "$service" | grep -q "Up"; then
            echo "✓ $service is running" >> "$REPORT_FILE"
            ((services_passed++))
        else
            echo "✗ $service is not running" >> "$REPORT_FILE"
        fi
    done
    
    echo "" >> "$REPORT_FILE"
    echo "**Services Status:** $services_passed/$services_total services running" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Services status validation completed: $services_passed/$services_total running"
}

# Function to validate health checks
validate_health_checks() {
    log "Validating health checks..."
    
    echo "### Health Check Results" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local health_passed=0
    local health_total=0
    
    # Test main health endpoint
    ((health_total++))
    local health_response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/health" || echo "000")
    if [ "$health_response" = "200" ]; then
        echo "✓ Main health endpoint" >> "$REPORT_FILE"
        ((health_passed++))
    else
        echo "✗ Main health endpoint (HTTP $health_response)" >> "$REPORT_FILE"
    fi
    
    # Test service health endpoints
    local endpoints=(
        "$API_URL/health:API Gateway"
        "$BASE_URL/auth/health:Auth Service"
        "$BASE_URL/core/health:Core Service"
        "$BASE_URL/mcp/health:MCP Server"
        "$BASE_URL/analytics/health:Analytics Service"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint="${endpoint_info%:*}"
        local service="${endpoint_info#*:}"
        
        ((health_total++))
        local response=$(curl -s -w "%{http_code}" -o /dev/null "$endpoint" || echo "000")
        if [ "$response" = "200" ]; then
            echo "✓ $service health endpoint" >> "$REPORT_FILE"
            ((health_passed++))
        else
            echo "✗ $service health endpoint (HTTP $response)" >> "$REPORT_FILE"
        fi
    done
    
    # Test monitoring endpoints
    ((health_total++))
    local prometheus_response=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:9090/-/healthy" || echo "000")
    if [ "$prometheus_response" = "200" ]; then
        echo "✓ Prometheus health endpoint" >> "$REPORT_FILE"
        ((health_passed++))
    else
        echo "✗ Prometheus health endpoint (HTTP $prometheus_response)" >> "$REPORT_FILE"
    fi
    
    ((health_total++))
    local grafana_response=$(curl -s -w "%{http_code}" -o /dev/null "http://localhost:3000/api/health" || echo "000")
    if [ "$grafana_response" = "200" ]; then
        echo "✓ Grafana health endpoint" >> "$REPORT_FILE"
        ((health_passed++))
    else
        echo "✗ Grafana health endpoint (HTTP $grafana_response)" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Health Checks:** $health_passed/$health_total endpoints healthy" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Health checks validation completed: $health_passed/$health_total healthy"
}

# Function to validate database status
validate_database_status() {
    log "Validating database status..."
    
    echo "### Database Status" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local db_passed=0
    local db_total=0
    
    # Check database connectivity
    ((db_total++))
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✓ Database is accessible" >> "$REPORT_FILE"
        ((db_passed++))
    else
        echo "✗ Database is not accessible" >> "$REPORT_FILE"
    fi
    
    # Check database exists
    ((db_total++))
    if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw smart_ai_hub_staging; then
        echo "✓ Database exists" >> "$REPORT_FILE"
        ((db_passed++))
    else
        echo "✗ Database does not exist" >> "$REPORT_FILE"
    fi
    
    # Check migrations
    ((db_total++))
    local migration_count=$(docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres psql -U postgres -d smart_ai_hub_staging -t -c "SELECT COUNT(*) FROM _prisma_migrations;" 2>/dev/null || echo "0")
    if [ "$migration_count" -gt 0 ]; then
        echo "✓ Database migrations applied ($migration_count migrations)" >> "$REPORT_FILE"
        ((db_passed++))
    else
        echo "✗ Database migrations not applied" >> "$REPORT_FILE"
    fi
    
    # Check tables exist
    ((db_total++))
    local table_count=$(docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres psql -U postgres -d smart_ai_hub_staging -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    if [ "$table_count" -gt 0 ]; then
        echo "✓ Database tables created ($table_count tables)" >> "$REPORT_FILE"
        ((db_passed++))
    else
        echo "✗ Database tables not created" >> "$REPORT_FILE"
    fi
    
    # Check database size
    local db_size=$(docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" exec -T postgres psql -U postgres -d smart_ai_hub_staging -t -c "SELECT pg_size_pretty(pg_database_size('smart_ai_hub_staging'));" 2>/dev/null || echo "unknown")
    echo "- Database size: $db_size" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    echo "**Database Status:** $db_passed/$db_total checks passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Database status validation completed: $db_passed/$db_total passed"
}

# Function to validate resource usage
validate_resource_usage() {
    log "Validating resource usage..."
    
    echo "### Resource Usage" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Get system resource usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 || echo "0")
    local memory_usage=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}' || echo "0")
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1 || echo "0")
    
    echo "- **CPU Usage:** ${cpu_usage}%" >> "$REPORT_FILE"
    echo "- **Memory Usage:** ${memory_usage}%" >> "$REPORT_FILE"
    echo "- **Disk Usage:** ${disk_usage}%" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Get Docker container resource usage
    echo "#### Docker Container Resource Usage" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if command -v docker &> /dev/null; then
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" >> "$REPORT_FILE" 2>/dev/null || echo "Failed to get Docker stats" >> "$REPORT_FILE"
    else
        echo "Docker not available" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    
    # Resource usage validation
    local resource_issues=0
    
    if [ "${cpu_usage%.*}" -gt 80 ]; then
        echo "⚠️ **WARNING:** High CPU usage (${cpu_usage}%)" >> "$REPORT_FILE"
        ((resource_issues++))
    fi
    
    if [ "${memory_usage%.*}" -gt 80 ]; then
        echo "⚠️ **WARNING:** High memory usage (${memory_usage}%)" >> "$REPORT_FILE"
        ((resource_issues++))
    fi
    
    if [ "${disk_usage%.*}" -gt 80 ]; then
        echo "⚠️ **WARNING:** High disk usage (${disk_usage}%)" >> "$REPORT_FILE"
        ((resource_issues++))
    fi
    
    if [ $resource_issues -eq 0 ]; then
        echo "✅ **All resource usage within normal limits**" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    
    log "Resource usage validation completed with $resource_issues issues"
}

# Function to validate monitoring stack
validate_monitoring_stack() {
    log "Validating monitoring stack..."
    
    echo "### Monitoring Stack Validation" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local monitoring_passed=0
    local monitoring_total=0
    
    # Check Prometheus
    ((monitoring_total++))
    if curl -s "http://localhost:9090/api/v1/query?query=up" | grep -q "result"; then
        echo "✓ Prometheus is collecting metrics" >> "$REPORT_FILE"
        ((monitoring_passed++))
    else
        echo "✗ Prometheus is not collecting metrics" >> "$REPORT_FILE"
    fi
    
    # Check Prometheus targets
    ((monitoring_total++))
    local prometheus_targets=$(curl -s "http://localhost:9090/api/v1/targets" | grep -o '"health":"up"' | wc -l || echo "0")
    echo "- Prometheus targets up: $prometheus_targets" >> "$REPORT_FILE"
    if [ "$prometheus_targets" -gt 0 ]; then
        ((monitoring_passed++))
    fi
    
    # Check Grafana
    ((monitoring_total++))
    if curl -s "http://localhost:3000/api/dashboards" | grep -q "\[\]"; then
        echo "✓ Grafana API is accessible" >> "$REPORT_FILE"
        ((monitoring_passed++))
    else
        echo "✗ Grafana API is not accessible" >> "$REPORT_FILE"
    fi
    
    # Check exporters
    local exporters=("postgres-exporter" "redis-exporter" "nginx-exporter")
    for exporter in "${exporters[@]}"; do
        ((monitoring_total++))
        if docker-compose -f "$STAGING_DIR/docker-compose.staging.yml" ps "$exporter" | grep -q "Up"; then
            echo "✓ $exporter is running" >> "$REPORT_FILE"
            ((monitoring_passed++))
        else
            echo "✗ $exporter is not running" >> "$REPORT_FILE"
        fi
    done
    
    echo "" >> "$REPORT_FILE"
    echo "**Monitoring Stack:** $monitoring_passed/$monitoring_total components working" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Monitoring stack validation completed: $monitoring_passed/$monitoring_total working"
}

# Function to run smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    echo "### Smoke Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local smoke_passed=0
    local smoke_total=0
    
    # Test basic API connectivity
    ((smoke_total++))
    local api_response=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/health" || echo "000")
    if [ "$api_response" = "200" ]; then
        echo "✓ API Gateway is responding" >> "$REPORT_FILE"
        ((smoke_passed++))
    else
        echo "✗ API Gateway is not responding (HTTP $api_response)" >> "$REPORT_FILE"
    fi
    
    # Test user registration
    ((smoke_total++))
    local register_response=$(curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"smoke@test.com","password":"TestPassword123!","name":"Smoke Test"}' || echo "")
    
    if echo "$register_response" | grep -q "token\|success\|created\|user"; then
        echo "✓ User registration is working" >> "$REPORT_FILE"
        ((smoke_passed++))
    else
        echo "✗ User registration is not working" >> "$REPORT_FILE"
    fi
    
    # Test user login
    ((smoke_total++))
    local login_response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"smoke@test.com","password":"TestPassword123!"}' || echo "")
    
    if echo "$login_response" | grep -q "token\|success"; then
        echo "✓ User login is working" >> "$REPORT_FILE"
        ((smoke_passed++))
    else
        echo "✗ User login is not working" >> "$REPORT_FILE"
    fi
    
    # Test credit balance endpoint
    ((smoke_total++))
    local token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
    if [ -n "$token" ]; then
        local balance_response=$(curl -s -X GET "$API_URL/credits/balance" \
            -H "Authorization: Bearer $token" || echo "")
        
        if echo "$balance_response" | grep -q "balance\|credits"; then
            echo "✓ Credit balance endpoint is working" >> "$REPORT_FILE"
            ((smoke_passed++))
        else
            echo "✗ Credit balance endpoint is not working" >> "$REPORT_FILE"
        fi
    else
        echo "✗ Credit balance test skipped (no token)" >> "$REPORT_FILE"
    fi
    
    # Test MCP models endpoint
    ((smoke_total++))
    if [ -n "$token" ]; then
        local models_response=$(curl -s -X GET "$API_URL/mcp/models" \
            -H "Authorization: Bearer $token" || echo "")
        
        if echo "$models_response" | grep -q "models\|gpt\|claude"; then
            echo "✓ MCP models endpoint is working" >> "$REPORT_FILE"
            ((smoke_passed++))
        else
            echo "✗ MCP models endpoint is not working" >> "$REPORT_FILE"
        fi
    else
        echo "✗ MCP models test skipped (no token)" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Smoke Tests:** $smoke_passed/$smoke_total tests passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Smoke tests completed: $smoke_passed/$smoke_total passed"
}

# Function to collect test results
collect_test_results() {
    log "Collecting test results..."
    
    echo "### Test Results Summary" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check if test results exist
    local integration_test="$TEST_RESULTS_DIR/TEST_REPORT_$(ls -t "$TEST_RESULTS_DIR"/TEST_REPORT_*.md 2>/dev/null | head -1 | xargs basename | sed 's/TEST_REPORT_//' | sed 's/\.md$//' || echo "")"
    local performance_test="$TEST_RESULTS_DIR/PERFORMANCE_REPORT_$(ls -t "$TEST_RESULTS_DIR"/PERFORMANCE_REPORT_*.md 2>/dev/null | head -1 | xargs basename | sed 's/PERFORMANCE_REPORT_//' | sed 's/\.md$//' || echo "")"
    local security_test="$TEST_RESULTS_DIR/SECURITY_REPORT_$(ls -t "$TEST_RESULTS_DIR"/SECURITY_REPORT_*.md 2>/dev/null | head -1 | xargs basename | sed 's/SECURITY_REPORT_//' | sed 's/\.md$//' || echo "")"
    local health_test="$TEST_RESULTS_DIR/HEALTH_CHECK_REPORT_$(ls -t "$TEST_RESULTS_DIR"/HEALTH_CHECK_REPORT_*.md 2>/dev/null | head -1 | xargs basename | sed 's/HEALTH_CHECK_REPORT_//' | sed 's/\.md$//' || echo "")"
    
    # Integration Tests
    if [ -n "$integration_test" ] && [ -f "$TEST_RESULTS_DIR/TEST_REPORT_$integration_test.md" ]; then
        local integration_success=$(grep -c "✓" "$TEST_RESULTS_DIR/TEST_REPORT_$integration_test.md" || echo "0")
        local integration_total=$(grep -c "✓\|✗" "$TEST_RESULTS_DIR/TEST_REPORT_$integration_test.md" || echo "0")
        echo "- **Integration Tests:** $integration_success/$integration_total passed" >> "$REPORT_FILE"
    else
        echo "- **Integration Tests:** Not run" >> "$REPORT_FILE"
    fi
    
    # Performance Tests
    if [ -n "$performance_test" ] && [ -f "$TEST_RESULTS_DIR/PERFORMANCE_REPORT_$performance_test.md" ]; then
        local performance_success=$(grep -c "✅\|✓" "$TEST_RESULTS_DIR/PERFORMANCE_REPORT_$performance_test.md" || echo "0")
        local performance_total=$(grep -c "✅\|✓\|❌\|✗" "$TEST_RESULTS_DIR/PERFORMANCE_REPORT_$performance_test.md" || echo "0")
        echo "- **Performance Tests:** $performance_success/$performance_total passed" >> "$REPORT_FILE"
    else
        echo "- **Performance Tests:** Not run" >> "$REPORT_FILE"
    fi
    
    # Security Tests
    if [ -n "$security_test" ] && [ -f "$TEST_RESULTS_DIR/SECURITY_REPORT_$security_test.md" ]; then
        local security_success=$(grep -c "✓" "$TEST_RESULTS_DIR/SECURITY_REPORT_$security_test.md" || echo "0")
        local security_total=$(grep -c "✓\|✗" "$TEST_RESULTS_DIR/SECURITY_REPORT_$security_test.md" || echo "0")
        echo "- **Security Tests:** $security_success/$security_total passed" >> "$REPORT_FILE"
    else
        echo "- **Security Tests:** Not run" >> "$REPORT_FILE"
    fi
    
    # Health Checks
    if [ -n "$health_test" ] && [ -f "$TEST_RESULTS_DIR/HEALTH_CHECK_REPORT_$health_test.md" ]; then
        local health_success=$(grep -c "✓" "$TEST_RESULTS_DIR/HEALTH_CHECK_REPORT_$health_test.md" || echo "0")
        local health_total=$(grep -c "✓\|✗" "$TEST_RESULTS_DIR/HEALTH_CHECK_REPORT_$health_test.md" || echo "0")
        echo "- **Health Checks:** $health_success/$health_total passed" >> "$REPORT_FILE"
    else
        echo "- **Health Checks:** Not run" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    
    log "Test results collection completed."
}

# Function to generate deployment summary
generate_deployment_summary() {
    log "Generating deployment summary..."
    
    # Calculate overall success rate
    local total_checks=$(grep -c "✓\|✗" "$REPORT_FILE" || echo "0")
    local passed_checks=$(grep -c "✓" "$REPORT_FILE" || echo "0")
    local success_rate=0
    
    if [ $total_checks -gt 0 ]; then
        success_rate=$((passed_checks * 100 / total_checks))
    fi
    
    # Add executive summary
    cat >> "$REPORT_FILE" << EOF

## Executive Summary

### Deployment Status

EOF

    if [ $success_rate -ge 95 ]; then
        echo "🟢 **SUCCESSFUL** - Deployment is healthy and ready for production!" >> "$REPORT_FILE"
    elif [ $success_rate -ge 85 ]; then
        echo "🟡 **MOSTLY SUCCESSFUL** - Deployment is good with minor issues." >> "$REPORT_FILE"
    elif [ $success_rate -ge 70 ]; then
        echo "🟠 **NEEDS ATTENTION** - Deployment has issues that should be addressed." >> "$REPORT_FILE"
    else
        echo "🔴 **FAILED** - Deployment has major issues and is not ready." >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << EOF

### Key Metrics

- **Overall Success Rate:** $success_rate%
- **Total Checks:** $total_checks
- **Passed:** $passed_checks
- **Failed:** $((total_checks - passed_checks))

### Performance Metrics

- **Response Time:** Target < ${MAX_RESPONSE_TIME}ms
- **Error Rate:** Target < ${MAX_ERROR_RATE}%
- **Success Rate:** Target > ${MIN_SUCCESS_RATE}%

### Access URLs

- **Frontend:** http://localhost:8080
- **API Gateway:** http://localhost:8080/api
- **Auth Service:** http://localhost:8080/auth
- **Core Service:** http://localhost:8080/core
- **MCP Server:** http://localhost:8080/mcp
- **Analytics Service:** http://localhost:8080/analytics
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3000 (admin/admin123)

## Issues and Recommendations

EOF

    # Check for any failed checks
    local failed_issues=$(grep -c "✗" "$REPORT_FILE" || echo "0")
    if [ $failed_issues -gt 0 ]; then
        echo "### Identified Issues ($failed_issues)" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        grep "✗" "$REPORT_FILE" | sed 's/^✗/- /' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
    
    # Add recommendations
    echo "### Recommendations" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if [ $success_rate -ge 95 ]; then
        echo "✅ **Ready for Production Deployment**" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "- All systems are healthy and performing well" >> "$REPORT_FILE"
        echo "- No critical issues detected" >> "$REPORT_FILE"
        echo "- Monitoring is fully functional" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**Next Steps:**" >> "$REPORT_FILE"
        echo "1. Proceed with production deployment planning" >> "$REPORT_FILE"
        echo "2. Schedule production deployment window" >> "$REPORT_FILE"
        echo "3. Prepare production deployment checklist" >> "$REPORT_FILE"
    elif [ $success_rate -ge 85 ]; then
        echo "⚠️ **Proceed with Caution**" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "- Minor issues detected but should not block production" >> "$REPORT_FILE"
        echo "- Consider addressing issues before production deployment" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**Next Steps:**" >> "$REPORT_FILE"
        echo "1. Address minor issues if time permits" >> "$REPORT_FILE"
        echo "2. Monitor affected systems closely" >> "$REPORT_FILE"
        echo "3. Document known issues for production" >> "$REPORT_FILE"
    else
        echo "❌ **Do Not Deploy to Production**" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "- Significant issues detected that must be resolved" >> "$REPORT_FILE"
        echo "- Deployment is not ready for production" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**Next Steps:**" >> "$REPORT_FILE"
        echo "1. Address all critical issues immediately" >> "$REPORT_FILE"
        echo "2. Re-run validation after fixes" >> "$REPORT_FILE"
        echo "3. Only proceed to production after all issues are resolved" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << EOF

## Production Deployment Checklist

- [ ] All health checks passing
- [ ] Integration tests passing (>95%)
- [ ] Performance tests meeting benchmarks
- [ ] Security tests passing (>85%)
- [ ] Monitoring dashboards functional
- [ ] Backup and recovery procedures tested
- [ ] Rollback procedure validated
- [ ] Documentation complete
- [ ] Team notification sent
- [ ] Production deployment window scheduled

## Report Generation

**Report Generated:** $(date +"%Y-%m-%d %H:%M:%S")
**Report Location:** $REPORT_FILE
**Validation Duration:** $((SECONDS)) seconds

EOF

    log "Deployment summary generated."
}

# Main validation function
main() {
    log "Starting comprehensive deployment validation..."
    
    # Setup validation environment
    setup_validation_environment
    
    # Run validation checks
    validate_services_status
    validate_health_checks
    validate_database_status
    validate_resource_usage
    validate_monitoring_stack
    run_smoke_tests
    collect_test_results
    
    # Generate summary
    generate_deployment_summary
    
    log "Deployment validation completed! 🎉"
    echo ""
    echo "Deployment validation report: $REPORT_FILE"
    echo "View results: cat $REPORT_FILE"
}

# Handle script arguments
case "${1:-all}" in
    all)
        main
        ;;
    services)
        setup_validation_environment
        validate_services_status
        ;;
    health)
        setup_validation_environment
        validate_health_checks
        ;;
    database)
        setup_validation_environment
        validate_database_status
        ;;
    resources)
        setup_validation_environment
        validate_resource_usage
        ;;
    monitoring)
        setup_validation_environment
        validate_monitoring_stack
        ;;
    smoke)
        setup_validation_environment
        run_smoke_tests
        ;;
    collect)
        setup_validation_environment
        collect_test_results
        ;;
    *)
        echo "Usage: $0 {all|services|health|database|resources|monitoring|smoke|collect}"
        echo "  all       - Run all validation checks (default)"
        echo "  services  - Validate services status"
        echo "  health    - Validate health checks"
        echo "  database  - Validate database status"
        echo "  resources - Validate resource usage"
        echo "  monitoring - Validate monitoring stack"
        echo "  smoke     - Run smoke tests"
        echo "  collect   - Collect test results"
        exit 1
        ;;
esac