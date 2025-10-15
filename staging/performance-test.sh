#!/bin/bash

# Performance Testing Suite
# This script runs performance tests on the staging environment

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
REPORT_FILE="$TEST_RESULTS_DIR/PERFORMANCE_REPORT_$TIMESTAMP.md"

# Base URL for testing
BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api"

# Performance thresholds
MAX_RESPONSE_TIME_P95=2000  # 2 seconds
MAX_ERROR_RATE=1  # 1%
MIN_THROUGHPUT=100  # requests per second

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

# Function to check if autocannon is installed
check_autocannon() {
    if ! command -v autocannon &> /dev/null; then
        log "Installing autocannon..."
        npm install -g autocannon
    fi
}

# Function to create test results directory
setup_test_environment() {
    log "Setting up performance test environment..."
    
    # Create test results directory
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Initialize performance report
    cat > "$REPORT_FILE" << EOF
# Performance Test Report

**Test Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Environment:** Staging
**Base URL:** $BASE_URL

## Performance Benchmarks

- **Max Response Time (p95):** ${MAX_RESPONSE_TIME_P95}ms
- **Max Error Rate:** ${MAX_ERROR_RATE}%
- **Min Throughput:** ${MIN_THROUGHPUT} req/s

## Test Results

EOF

    log "Performance test environment setup completed."
}

# Function to run load test on an endpoint
run_load_test() {
    local endpoint="$1"
    local test_name="$2"
    local duration="${3:-30}"
    local connections="${4:-100}"
    
    log "Running load test for $test_name..."
    
    # Create temporary file for results
    local result_file="$TEST_RESULTS_DIR/${test_name}_results.json"
    
    # Run autocannon
    autocannon -c "$connections" -d "$duration" -j "$endpoint" > "$result_file" 2>&1 || true
    
    # Parse results
    if [ -f "$result_file" ]; then
        local avg_response_time=$(cat "$result_file" | grep -o '"latency":{"average":[0-9]*' | cut -d':' -f2 || echo "0")
        local p95_response_time=$(cat "$result_file" | grep -o '"latency":{"p95":[0-9]*' | cut -d':' -f2 || echo "0")
        local p99_response_time=$(cat "$result_file" | grep -o '"latency":{"p99":[0-9]*' | cut -d':' -f2 || echo "0")
        local throughput=$(cat "$result_file" | grep -o '"throughput":{"average":[0-9]*' | cut -d':' -f2 || echo "0")
        local error_rate=$(cat "$result_file" | grep -o '"errors":[0-9]*' | cut -d':' -f2 || echo "0")
        local total_requests=$(cat "$result_file" | grep -o '"requests":{"total":[0-9]*' | cut -d':' -f2 || echo "0")
        
        # Calculate error rate percentage
        if [ "$total_requests" -gt 0 ]; then
            error_rate=$((error_rate * 100 / total_requests))
        fi
        
        # Add to report
        echo "### $test_name" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "- **Endpoint:** $endpoint" >> "$REPORT_FILE"
        echo "- **Duration:** ${duration}s" >> "$REPORT_FILE"
        echo "- **Connections:** $connections" >> "$REPORT_FILE"
        echo "- **Total Requests:** $total_requests" >> "$REPORT_FILE"
        echo "- **Average Response Time:** ${avg_response_time}ms" >> "$REPORT_FILE"
        echo "- **95th Percentile Response Time:** ${p95_response_time}ms" >> "$REPORT_FILE"
        echo "- **99th Percentile Response Time:** ${p99_response_time}ms" >> "$REPORT_FILE"
        echo "- **Throughput:** ${throughput} req/s" >> "$REPORT_FILE"
        echo "- **Error Rate:** ${error_rate}%" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        # Check against benchmarks
        local test_passed=true
        
        if [ "$p95_response_time" -gt "$MAX_RESPONSE_TIME_P95" ]; then
            echo "❌ **FAILED:** Response time exceeds threshold (${p95_response_time}ms > ${MAX_RESPONSE_TIME_P95}ms)" >> "$REPORT_FILE"
            test_passed=false
        else
            echo "✅ **PASSED:** Response time within threshold (${p95_response_time}ms <= ${MAX_RESPONSE_TIME_P95}ms)" >> "$REPORT_FILE"
        fi
        
        if [ "$error_rate" -gt "$MAX_ERROR_RATE" ]; then
            echo "❌ **FAILED:** Error rate exceeds threshold (${error_rate}% > ${MAX_ERROR_RATE}%)" >> "$REPORT_FILE"
            test_passed=false
        else
            echo "✅ **PASSED:** Error rate within threshold (${error_rate}% <= ${MAX_ERROR_RATE}%)" >> "$REPORT_FILE"
        fi
        
        if [ "$throughput" -lt "$MIN_THROUGHPUT" ]; then
            echo "⚠️ **WARNING:** Throughput below minimum (${throughput} req/s < ${MIN_THROUGHPUT} req/s)" >> "$REPORT_FILE"
        else
            echo "✅ **PASSED:** Throughput meets minimum (${throughput} req/s >= ${MIN_THROUGHPUT} req/s)" >> "$REPORT_FILE"
        fi
        
        echo "" >> "$REPORT_FILE"
        
        # Log result
        if [ "$test_passed" = true ]; then
            log "✅ $test_name test passed"
        else
            error "❌ $test_name test failed"
        fi
        
        # Return test result
        if [ "$test_passed" = true ]; then
            return 0
        else
            return 1
        fi
    else
        error "Failed to run load test for $test_name"
        return 1
    fi
}

# Function to test API endpoints
test_api_performance() {
    log "Testing API endpoints performance..."
    
    echo "## API Endpoints Performance" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local api_passed=0
    local api_total=0
    
    # Test health endpoint
    ((api_total++))
    if run_load_test "$BASE_URL/health" "health_endpoint" 30 50; then
        ((api_passed++))
    fi
    
    # Test API gateway
    ((api_total++))
    if run_load_test "$API_URL/health" "api_gateway" 30 50; then
        ((api_passed++))
    fi
    
    # Test authentication endpoint
    ((api_total++))
    if run_load_test "$API_URL/auth/login" "auth_login" 30 30; then
        ((api_passed++))
    fi
    
    # Test user profile endpoint
    ((api_total++))
    if run_load_test "$API_URL/users/profile" "user_profile" 30 30; then
        ((api_passed++))
    fi
    
    # Test credits endpoint
    ((api_total++))
    if run_load_test "$API_URL/credits/balance" "credits_balance" 30 30; then
        ((api_passed++))
    fi
    
    # Test MCP models endpoint
    ((api_total++))
    if run_load_test "$API_URL/mcp/models" "mcp_models" 30 20; then
        ((api_passed++))
    fi
    
    # Test analytics endpoint
    ((api_total++))
    if run_load_test "$API_URL/analytics/dashboard" "analytics_dashboard" 30 20; then
        ((api_passed++))
    fi
    
    echo "**API Performance Summary:** $api_passed/$api_total tests passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "API performance tests completed: $api_passed/$api_total passed"
}

# Function to test database performance
test_database_performance() {
    log "Testing database performance..."
    
    echo "## Database Performance" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Test database connection pool
    log "Testing database connection pool..."
    
    local db_tests=0
    local db_passed=0
    
    # Run concurrent database queries
    ((db_tests++))
    if run_load_test "$API_URL/credits/balance" "db_concurrent_queries" 30 50; then
        ((db_passed++))
    fi
    
    # Test database write operations
    ((db_tests++))
    if run_load_test "$API_URL/analytics/track" "db_write_operations" 30 30; then
        ((db_passed++))
    fi
    
    echo "**Database Performance Summary:** $db_passed/$db_tests tests passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Database performance tests completed: $db_passed/$db_tests passed"
}

# Function to test Redis caching performance
test_redis_performance() {
    log "Testing Redis caching performance..."
    
    echo "## Redis Caching Performance" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local redis_tests=0
    local redis_passed=0
    
    # Test cache read operations
    ((redis_tests++))
    if run_load_test "$API_URL/cache/test" "cache_read" 30 100; then
        ((redis_passed++))
    fi
    
    # Test cache write operations
    ((redis_tests++))
    if run_load_test "$API_URL/cache/write" "cache_write" 30 50; then
        ((redis_passed++))
    fi
    
    echo "**Redis Performance Summary:** $redis_passed/$redis_tests tests passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Redis performance tests completed: $redis_passed/$redis_tests passed"
}

# Function to test concurrent user load
test_concurrent_users() {
    log "Testing concurrent user load..."
    
    echo "## Concurrent User Load Test" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Test with 100 concurrent users for 30 seconds
    if run_load_test "$BASE_URL/health" "concurrent_users_100" 30 100; then
        echo "✅ **PASSED:** System handles 100 concurrent users" >> "$REPORT_FILE"
    else
        echo "❌ **FAILED:** System cannot handle 100 concurrent users" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    
    # Test with 200 concurrent users for 30 seconds
    if run_load_test "$BASE_URL/health" "concurrent_users_200" 30 200; then
        echo "✅ **PASSED:** System handles 200 concurrent users" >> "$REPORT_FILE"
    else
        echo "⚠️ **WARNING:** System struggles with 200 concurrent users" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    
    log "Concurrent user load test completed."
}

# Function to identify bottlenecks
identify_bottlenecks() {
    log "Identifying performance bottlenecks..."
    
    echo "## Performance Bottlenecks Analysis" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check system resources
    log "Checking system resource usage..."
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 || echo "0")
    echo "- **Current CPU Usage:** ${cpu_usage}%" >> "$REPORT_FILE"
    
    # Memory usage
    local memory_usage=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}' || echo "0")
    echo "- **Current Memory Usage:** ${memory_usage}%" >> "$REPORT_FILE"
    
    # Disk usage
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1 || echo "0")
    echo "- **Current Disk Usage:** ${disk_usage}%" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    
    # Docker container stats
    log "Checking Docker container stats..."
    echo "### Docker Container Resource Usage" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if command -v docker &> /dev/null; then
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" >> "$REPORT_FILE" 2>/dev/null || echo "Failed to get Docker stats" >> "$REPORT_FILE"
    else
        echo "Docker not available" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    
    # Recommendations
    echo "### Recommendations" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if [ "${cpu_usage%.*}" -gt 80 ]; then
        echo "- ⚠️ **High CPU Usage:** Consider scaling horizontally or optimizing CPU-intensive operations" >> "$REPORT_FILE"
    fi
    
    if [ "${memory_usage%.*}" -gt 80 ]; then
        echo "- ⚠️ **High Memory Usage:** Consider adding more memory or optimizing memory usage" >> "$REPORT_FILE"
    fi
    
    if [ "${disk_usage%.*}" -gt 80 ]; then
        echo "- ⚠️ **High Disk Usage:** Consider cleaning up old logs and data" >> "$REPORT_FILE"
    fi
    
    echo "- 📊 **Monitoring:** Set up alerts for resource usage thresholds" >> "$REPORT_FILE"
    echo "- 🔄 **Load Balancing:** Consider implementing load balancing for high traffic" >> "$REPORT_FILE"
    echo "- 💾 **Caching:** Implement caching strategies for frequently accessed data" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    
    log "Bottleneck analysis completed."
}

# Function to generate performance summary
generate_performance_summary() {
    log "Generating performance summary..."
    
    # Calculate total tests passed
    local total_tests=$(grep -c "PASSED\|FAILED" "$REPORT_FILE" || echo "0")
    local passed_tests=$(grep -c "PASSED" "$REPORT_FILE" || echo "0")
    local failed_tests=$(grep -c "FAILED" "$REPORT_FILE" || echo "0")
    local success_rate=0
    
    if [ $total_tests -gt 0 ]; then
        success_rate=$((passed_tests * 100 / total_tests))
    fi
    
    # Add summary to report
    cat >> "$REPORT_FILE" << EOF

## Performance Test Summary

- **Total Tests:** $total_tests
- **Passed:** $passed_tests
- **Failed:** $failed_tests
- **Success Rate:** $success_rate%

## Overall Performance Assessment

EOF

    if [ $success_rate -ge 90 ]; then
        echo "🚀 **EXCELLENT** - Performance meets all benchmarks!" >> "$REPORT_FILE"
        log "🚀 EXCELLENT - Performance meets all benchmarks!"
    elif [ $success_rate -ge 75 ]; then
        echo "✅ **GOOD** - Performance is acceptable with minor issues." >> "$REPORT_FILE"
        log "✅ GOOD - Performance is acceptable with minor issues."
    elif [ $success_rate -ge 50 ]; then
        echo "⚠️ **NEEDS OPTIMIZATION** - Performance issues detected." >> "$REPORT_FILE"
        log "⚠️ NEEDS OPTIMIZATION - Performance issues detected."
    else
        echo "❌ **CRITICAL** - Major performance issues require immediate attention." >> "$REPORT_FILE"
        log "❌ CRITICAL - Major performance issues require immediate attention."
    fi
    
    cat >> "$REPORT_FILE" << EOF

## Production Readiness

EOF

    if [ $success_rate -ge 75 ]; then
        echo "✅ **Ready for Production** - Performance is within acceptable limits." >> "$REPORT_FILE"
    else
        echo "❌ **Not Ready for Production** - Performance optimization required before deployment." >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << EOF

## Next Steps

- Review failed tests and optimize accordingly
- Implement performance monitoring in production
- Set up automated performance testing in CI/CD
- Consider load testing with higher concurrency
- Monitor resource usage during peak traffic

EOF

    log "Performance summary generated."
}

# Main performance test function
main() {
    log "Starting performance test suite..."
    
    # Check dependencies
    check_autocannon
    
    # Setup test environment
    setup_test_environment
    
    # Run performance tests
    test_api_performance
    test_database_performance
    test_redis_performance
    test_concurrent_users
    identify_bottlenecks
    
    # Generate summary
    generate_performance_summary
    
    log "Performance test suite completed! 🎉"
    echo ""
    echo "Performance report: $REPORT_FILE"
    echo "View results: cat $REPORT_FILE"
}

# Handle script arguments
case "${1:-all}" in
    all)
        main
        ;;
    api)
        check_autocannon
        setup_test_environment
        test_api_performance
        ;;
    database)
        check_autocannon
        setup_test_environment
        test_database_performance
        ;;
    redis)
        check_autocannon
        setup_test_environment
        test_redis_performance
        ;;
    concurrent)
        check_autocannon
        setup_test_environment
        test_concurrent_users
        ;;
    bottlenecks)
        setup_test_environment
        identify_bottlenecks
        ;;
    *)
        echo "Usage: $0 {all|api|database|redis|concurrent|bottlenecks}"
        echo "  all        - Run all performance tests (default)"
        echo "  api        - Test API endpoints performance"
        echo "  database   - Test database performance"
        echo "  redis      - Test Redis caching performance"
        echo "  concurrent - Test concurrent user load"
        echo "  bottlenecks - Identify performance bottlenecks"
        exit 1
        ;;
esac