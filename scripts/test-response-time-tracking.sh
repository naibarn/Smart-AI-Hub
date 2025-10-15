#!/bin/bash

# Response Time Tracking Test Script
# This script tests the response time tracking implementation with realistic load

set -e

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:3001}"
CORE_SERVICE_URL="${CORE_SERVICE_URL:-http://localhost:3002}"
MCP_SERVICE_URL="${MCP_SERVICE_URL:-http://localhost:3003}"
WEBHOOK_SERVICE_URL="${WEBHOOK_SERVICE_URL:-http://localhost:3005}"

# Test credentials
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"
TEST_TOKEN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if service is healthy
check_service_health() {
    local url=$1
    local service_name=$2
    
    log_info "Checking $service_name health..."
    
    if curl -f -s "$url/health" > /dev/null; then
        log_info "$service_name is healthy"
        return 0
    else
        log_error "$service_name is not responding"
        return 1
    fi
}

# Function to check response time header
check_response_time_header() {
    local url=$1
    local endpoint_name=$2
    
    log_info "Testing response time header for $endpoint_name..."
    
    response=$(curl -s -I "$url")
    response_time_header=$(echo "$response" | grep -i "x-response-time")
    
    if [[ -n "$response_time_header" ]]; then
        log_info "$endpoint_name includes response time header: $response_time_header"
        return 0
    else
        log_error "$endpoint_name missing response time header"
        return 1
    fi
}

# Function to register a test user
register_test_user() {
    log_info "Registering test user..."
    
    response=$(curl -s -X POST "$AUTH_SERVICE_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\",
            \"firstName\": \"Test\",
            \"lastName\": \"User\"
        }")
    
    if echo "$response" | grep -q "token"; then
        TEST_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        log_info "Test user registered successfully"
        return 0
    else
        # User might already exist, try to login
        login_test_user
        return $?
    fi
}

# Function to login test user
login_test_user() {
    log_info "Logging in test user..."
    
    response=$(curl -s -X POST "$AUTH_SERVICE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")
    
    if echo "$response" | grep -q "token"; then
        TEST_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        log_info "Test user logged in successfully"
        return 0
    else
        log_error "Failed to login test user"
        return 1
    fi
}

# Function to test endpoint load
test_endpoint_load() {
    local url=$1
    local endpoint_name=$2
    local requests=${3:-10}
    local concurrency=${4:-2}
    
    log_info "Testing $endpoint_name with $requests requests (concurrency: $concurrency)..."
    
    # Create a temporary file to store results
    temp_file=$(mktemp)
    
    # Run load test
    for i in $(seq 1 $requests); do
        (
            start_time=$(date +%s%N)
            response=$(curl -s -w "%{http_code}" "$url")
            end_time=$(date +%s%N)
            
            response_time=$(((end_time - start_time) / 1000000)) # Convert to milliseconds
            http_code="${response: -3}"
            
            echo "$response_time,$http_code" >> "$temp_file"
        ) &
        
        # Control concurrency
        if [[ $((i % concurrency)) -eq 0 ]]; then
            wait
        fi
    done
    
    wait
    
    # Analyze results
    avg_response_time=$(awk -F',' '{sum+=$1; count++} END {print sum/count}' "$temp_file")
    max_response_time=$(awk -F',' 'BEGIN{max=0} {if($1>max) max=$1} END {print max}' "$temp_file")
    success_count=$(awk -F',' '$2=="200" {count++} END {print count}' "$temp_file")
    
    success_rate=$((success_count * 100 / requests))
    
    log_info "$endpoint_name results:"
    log_info "  Average response time: ${avg_response_time}ms"
    log_info "  Max response time: ${max_response_time}ms"
    log_info "  Success rate: ${success_rate}%"
    
    # Clean up
    rm "$temp_file"
    
    # Check if success rate is acceptable
    if [[ $success_rate -lt 95 ]]; then
        log_error "$endpoint_name has low success rate: ${success_rate}%"
        return 1
    fi
    
    return 0
}

# Function to test metrics endpoint
test_metrics_endpoint() {
    local url=$1
    local service_name=$2
    
    log_info "Testing metrics endpoint for $service_name..."
    
    response=$(curl -s "$url/metrics")
    
    if echo "$response" | grep -q "http_response_time_milliseconds"; then
        log_info "$service_name metrics endpoint includes response time metrics"
        return 0
    else
        log_error "$service_name metrics endpoint missing response time metrics"
        return 1
    fi
}

# Function to test monitoring API endpoints
test_monitoring_api() {
    log_info "Testing monitoring API endpoints..."
    
    # Test overview endpoint
    response=$(curl -s -H "Authorization: Bearer $TEST_TOKEN" "$CORE_SERVICE_URL/api/v1/monitoring/response-time/overview")
    
    if echo "$response" | grep -q "averageResponseTime"; then
        log_info "Overview API endpoint working"
    else
        log_error "Overview API endpoint not working"
        return 1
    fi
    
    # Test endpoints endpoint
    response=$(curl -s -H "Authorization: Bearer $TEST_TOKEN" "$CORE_SERVICE_URL/api/v1/monitoring/response-time/endpoints")
    
    if echo "$response" | grep -q "endpoints"; then
        log_info "Endpoints API endpoint working"
    else
        log_error "Endpoints API endpoint not working"
        return 1
    fi
    
    # Test trends endpoint
    response=$(curl -s -H "Authorization: Bearer $TEST_TOKEN" "$CORE_SERVICE_URL/api/v1/monitoring/response-time/trends")
    
    if echo "$response" | grep -q "trends"; then
        log_info "Trends API endpoint working"
    else
        log_error "Trends API endpoint not working"
        return 1
    fi
    
    return 0
}

# Function to test Grafana dashboard
test_grafana_dashboard() {
    log_info "Testing Grafana dashboard..."
    
    # Check if Grafana is accessible
    if curl -f -s "http://localhost:3001/api/health" > /dev/null; then
        log_info "Grafana is accessible"
        
        # Check if dashboard exists
        response=$(curl -s -u admin:admin123 "http://localhost:3001/api/dashboards/uid/smart-ai-hub-response-time")
        
        if echo "$response" | grep -q "smart-ai-hub-response-time"; then
            log_info "Response time dashboard exists in Grafana"
            return 0
        else
            log_error "Response time dashboard not found in Grafana"
            return 1
        fi
    else
        log_error "Grafana is not accessible"
        return 1
    fi
}

# Function to generate realistic load
generate_realistic_load() {
    log_info "Generating realistic load pattern..."
    
    # Test various endpoints with different load patterns
    test_endpoint_load "$AUTH_SERVICE_URL/api/v1/auth/login" "Login endpoint" 50 5
    test_endpoint_load "$CORE_SERVICE_URL/api/v1/users/profile" "Profile endpoint" 30 3
    test_endpoint_load "$CORE_SERVICE_URL/api/v1/analytics/usage" "Analytics endpoint" 20 2
    
    # Test some endpoints that might be slower
    test_endpoint_load "$CORE_SERVICE_URL/api/v1/analytics/reports" "Reports endpoint" 10 1
    
    log_info "Realistic load test completed"
}

# Main test execution
main() {
    log_info "Starting Response Time Tracking Implementation Test"
    log_info "=================================================="
    
    # Check if all services are healthy
    check_service_health "$AUTH_SERVICE_URL" "Auth Service"
    check_service_health "$CORE_SERVICE_URL" "Core Service"
    check_service_health "$MCP_SERVICE_URL" "MCP Service"
    check_service_health "$WEBHOOK_SERVICE_URL" "Webhook Service"
    
    # Check response time headers
    check_response_time_header "$AUTH_SERVICE_URL/api/v1/auth/login" "Auth Service"
    check_response_time_header "$CORE_SERVICE_URL/api/v1/users/profile" "Core Service"
    check_response_time_header "$MCP_SERVICE_URL/api/v1/mcp/status" "MCP Service"
    
    # Register/login test user
    register_test_user
    
    # Test metrics endpoints
    test_metrics_endpoint "$AUTH_SERVICE_URL" "Auth Service"
    test_metrics_endpoint "$CORE_SERVICE_URL" "Core Service"
    test_metrics_endpoint "$MCP_SERVICE_URL" "MCP Service"
    test_metrics_endpoint "$WEBHOOK_SERVICE_URL" "Webhook Service"
    
    # Test monitoring API
    test_monitoring_api
    
    # Test Grafana dashboard
    test_grafana_dashboard
    
    # Generate realistic load
    generate_realistic_load
    
    log_info "=================================================="
    log_info "Response Time Tracking Implementation Test Complete"
    log_info ""
    log_info "Next steps:"
    log_info "1. Check the Grafana dashboard at http://localhost:3001/d/smart-ai-hub-response-time"
    log_info "2. Check the UI dashboard at http://localhost:3000/admin/monitoring/response-time"
    log_info "3. Monitor Prometheus alerts at http://localhost:9090/alerts"
    log_info "4. Review the performance metrics after a few minutes of data collection"
}

# Run the main function
main "$@"