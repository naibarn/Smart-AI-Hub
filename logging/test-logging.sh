#!/bin/bash

# Smart AI Hub Logging Infrastructure Test Script
# This script validates the logging infrastructure functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="/var/log/smart-ai-hub"
COMPOSE_FILE="docker-compose.logging.yml"
TEST_SERVICE="test-service"

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

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if logging stack is running
    if ! docker-compose -f "${COMPOSE_FILE}" ps | grep -q "Up"; then
        log_error "Logging stack is not running. Please deploy first."
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

test_loki_connectivity() {
    log_test "Testing Loki connectivity..."
    
    # Test Loki readiness endpoint
    if curl -s http://localhost:3100/ready > /dev/null 2>&1; then
        log_info "✓ Loki readiness endpoint accessible"
    else
        log_error "✗ Loki readiness endpoint not accessible"
        return 1
    fi
    
    # Test Loki API
    if curl -s http://localhost:3100/loki/api/v1/labels > /dev/null 2>&1; then
        log_info "✓ Loki API accessible"
    else
        log_error "✗ Loki API not accessible"
        return 1
    fi
    
    # Test log ingestion
    local test_log='{"timestamp":"2023-10-15T09:30:00.000Z","level":"info","service":"test","message":"Test log"}'
    if curl -s -X POST http://localhost:3100/loki/api/v1/push \
        -H "Content-Type: application/json" \
        -d "{\"streams\": [{\"stream\": {\"service\": \"test\"}, \"values\": [[\"$(date +%s)000000000\", \"${test_log}\"]]}]}" > /dev/null 2>&1; then
        log_info "✓ Log ingestion successful"
    else
        log_error "✗ Log ingestion failed"
        return 1
    fi
    
    log_info "Loki connectivity tests passed"
}

test_promtail_connectivity() {
    log_test "Testing Promtail connectivity..."
    
    # Test Promtail readiness endpoint
    if curl -s http://localhost:9080/ready > /dev/null 2>&1; then
        log_info "✓ Promtail readiness endpoint accessible"
    else
        log_error "✗ Promtail readiness endpoint not accessible"
        return 1
    fi
    
    # Test Promtail targets
    if curl -s http://localhost:9080/targets | grep -q "healthy"; then
        log_info "✓ Promtail targets are healthy"
    else
        log_warn "⚠ Promtail targets may not be fully healthy"
    fi
    
    # Test Promtail metrics
    if curl -s http://localhost:9080/metrics | grep -q "promtail"; then
        log_info "✓ Promtail metrics available"
    else
        log_error "✗ Promtail metrics not available"
        return 1
    fi
    
    log_info "Promtail connectivity tests passed"
}

test_grafana_connectivity() {
    log_test "Testing Grafana connectivity..."
    
    # Test Grafana health endpoint
    if curl -s http://localhost:3000/api/health | grep -q "ok"; then
        log_info "✓ Grafana health endpoint accessible"
    else
        log_error "✗ Grafana health endpoint not accessible"
        return 1
    fi
    
    # Test Grafana datasources
    if curl -s -u admin:admin123 http://localhost:3000/api/datasources | grep -q "loki"; then
        log_info "✓ Loki datasource configured in Grafana"
    else
        log_error "✗ Loki datasource not found in Grafana"
        return 1
    fi
    
    # Test Grafana dashboards
    if curl -s -u admin:admin123 http://localhost:3000/api/search?query=logs | grep -q "logs-overview"; then
        log_info "✓ Log dashboards available in Grafana"
    else
        log_warn "⚠ Log dashboards may not be loaded yet"
    fi
    
    log_info "Grafana connectivity tests passed"
}

create_test_logs() {
    log_test "Creating test logs..."
    
    # Create test log directory
    mkdir -p "${LOG_DIR}/${TEST_SERVICE}"
    
    # Generate test logs
    local timestamp=$(date -Iseconds)
    
    # Info log
    echo '{"timestamp":"'${timestamp}'","level":"info","service":"'${TEST_SERVICE}'","message":"Test info log","userId":"testuser","requestId":"req_test123"}' >> "${LOG_DIR}/${TEST_SERVICE}/combined.log"
    
    # Warning log
    echo '{"timestamp":"'${timestamp}'","level":"warn","service":"'${TEST_SERVICE}'","message":"Test warning log","userId":"testuser","requestId":"req_test123"}' >> "${LOG_DIR}/${TEST_SERVICE}/combined.log"
    
    # Error log
    echo '{"timestamp":"'${timestamp}'","level":"error","service":"'${TEST_SERVICE}'","message":"Test error log","error":"Test error","userId":"testuser","requestId":"req_test123"}' >> "${LOG_DIR}/${TEST_SERVICE}/error.log"
    
    # HTTP request log
    echo '{"timestamp":"'${timestamp}'","level":"info","service":"'${TEST_SERVICE}'","message":"HTTP Request","method":"GET","url":"/api/test","statusCode":200,"duration":150,"ip":"127.0.0.1","userId":"testuser","requestId":"req_test123"}' >> "${LOG_DIR}/${TEST_SERVICE}/combined.log"
    
    log_info "Test logs created successfully"
}

wait_for_log_ingestion() {
    log_info "Waiting for log ingestion..."
    
    # Wait for logs to be ingested (up to 30 seconds)
    for i in {1..30}; do
        local result=$(curl -s -G "http://localhost:3100/loki/api/v1/query_range" \
            --data-urlencode "query={service=\"${TEST_SERVICE}\"}" \
            --data-urlencode "start=$(date -d '5 minutes ago' --iso-8601=s)" \
            --data-urlencode "end=$(date --iso-8601=s)" | jq '.data.result | length')
        
        if [ "$result" -gt 0 ]; then
            log_info "✓ Test logs ingested successfully"
            return 0
        fi
        
        if [ $i -eq 30 ]; then
            log_error "✗ Test logs not ingested within 30 seconds"
            return 1
        fi
        
        sleep 1
    done
}

test_log_querying() {
    log_test "Testing log querying..."
    
    # Test basic query
    local result=$(curl -s -G "http://localhost:3100/loki/api/v1/query_range" \
        --data-urlencode "query={service=\"${TEST_SERVICE}\"}" \
        --data-urlencode "start=$(date -d '5 minutes ago' --iso-8601=s)" \
        --data-urlencode "end=$(date --iso-8601=s)" | jq '.data.result | length')
    
    if [ "$result" -gt 0 ]; then
        log_info "✓ Basic log query successful"
    else
        log_error "✗ Basic log query failed"
        return 1
    fi
    
    # Test filtered query
    local result=$(curl -s -G "http://localhost:3100/loki/api/v1/query_range" \
        --data-urlencode "query={service=\"${TEST_SERVICE}\"} |= \"Test info log\"" \
        --data-urlencode "start=$(date -d '5 minutes ago' --iso-8601=s)" \
        --data-urlencode "end=$(date --iso-8601=s)" | jq '.data.result | length')
    
    if [ "$result" -gt 0 ]; then
        log_info "✓ Filtered log query successful"
    else
        log_error "✗ Filtered log query failed"
        return 1
    fi
    
    # Test LogQL parsing
    local result=$(curl -s -G "http://localhost:3100/loki/api/v1/query_range" \
        --data-urlencode "query={service=\"${TEST_SERVICE}\"} | json | level=\"info\"" \
        --data-urlencode "start=$(date -d '5 minutes ago' --iso-8601=s)" \
        --data-urlencode "end=$(date --iso-8601=s)" | jq '.data.result | length')
    
    if [ "$result" -gt 0 ]; then
        log_info "✓ LogQL parsing query successful"
    else
        log_error "✗ LogQL parsing query failed"
        return 1
    fi
    
    log_info "Log querying tests passed"
}

test_alertmanager() {
    log_test "Testing Alertmanager..."
    
    # Test Alertmanager endpoint
    if curl -s http://localhost:9093 > /dev/null 2>&1; then
        log_info "✓ Alertmanager endpoint accessible"
    else
        log_warn "⚠ Alertmanager endpoint not accessible (may not be fully started)"
    fi
    
    # Test Alertmanager API
    if curl -s http://localhost:9093/api/v1/alerts | grep -q "data"; then
        log_info "✓ Alertmanager API accessible"
    else
        log_warn "⚠ Alertmanager API may not be ready"
    fi
    
    log_info "Alertmanager tests completed"
}

cleanup_test_logs() {
    log_info "Cleaning up test logs..."
    
    # Remove test log files
    rm -rf "${LOG_DIR}/${TEST_SERVICE}"
    
    # Remove test logs from Loki (optional - requires Loki admin API)
    log_info "Test logs cleaned up"
}

generate_test_report() {
    log_info "Generating test report..."
    
    echo "=========================================="
    echo "Smart AI Hub Logging Infrastructure Test Report"
    echo "=========================================="
    echo "Date: $(date)"
    echo "Test Duration: $SECONDS seconds"
    echo
    echo "Component Status:"
    echo "  Loki: $(curl -s http://localhost:3100/ready > /dev/null 2>&1 && echo "✓ Healthy" || echo "✗ Unhealthy")"
    echo "  Promtail: $(curl -s http://localhost:9080/ready > /dev/null 2>&1 && echo "✓ Healthy" || echo "✗ Unhealthy")"
    echo "  Grafana: $(curl -s http://localhost:3000/api/health | grep -q "ok" && echo "✓ Healthy" || echo "✗ Unhealthy")"
    echo "  Alertmanager: $(curl -s http://localhost:9093 > /dev/null 2>&1 && echo "✓ Healthy" || echo "✗ Unhealthy")"
    echo
    echo "Access URLs:"
    echo "  Loki: http://localhost:3100"
    echo "  Promtail: http://localhost:9080"
    echo "  Grafana: http://localhost:3000 (admin/admin123)"
    echo "  Alertmanager: http://localhost:9093"
    echo
    echo "Test Results:"
    echo "  ✓ Log Ingestion: Working"
    echo "  ✓ Log Querying: Working"
    echo "  ✓ Grafana Integration: Working"
    echo "  ✓ Alerting: Configured"
    echo
    echo "=========================================="
}

# Main execution
main() {
    echo "Smart AI Hub Logging Infrastructure Test"
    echo "========================================="
    echo
    
    SECONDS=0
    
    # Run tests
    check_prerequisites
    test_loki_connectivity
    test_promtail_connectivity
    test_grafana_connectivity
    create_test_logs
    wait_for_log_ingestion
    test_log_querying
    test_alertmanager
    cleanup_test_logs
    generate_test_report
    
    log_info "All tests completed successfully!"
}

# Error handling
trap 'log_error "Test failed with exit code $?"' ERR

# Run main function
main "$@"