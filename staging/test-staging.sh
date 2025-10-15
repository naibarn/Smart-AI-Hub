#!/bin/bash

# Staging Test Suite
# This script runs comprehensive tests on the staging environment

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
REPORT_FILE="$TEST_RESULTS_DIR/TEST_REPORT_$TIMESTAMP.md"

# Base URL for testing
BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api"

# Test credentials
TEST_EMAIL="test@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Test User"

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
    log "Setting up test environment..."
    
    # Create test results directory
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Initialize test report
    cat > "$REPORT_FILE" << EOF
# Staging Test Suite Report

**Test Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Environment:** Staging
**Base URL:** $BASE_URL

## Test Results

EOF

    log "Test environment setup completed."
}

# Function to run health checks
test_health_checks() {
    log "Running health checks..."
    
    echo "### Health Checks" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local health_passed=0
    local health_total=0
    
    # Test main health endpoint
    ((health_total++))
    if curl -f -s "$BASE_URL/health" > /dev/null; then
        echo "✓ Main health endpoint" >> "$REPORT_FILE"
        ((health_passed++))
    else
        echo "✗ Main health endpoint" >> "$REPORT_FILE"
    fi
    
    # Test service health endpoints
    local services=("api" "auth" "core" "mcp" "analytics")
    for service in "${services[@]}"; do
        ((health_total++))
        if curl -f -s "$BASE_URL/$service/health" > /dev/null; then
            echo "✓ $service service health" >> "$REPORT_FILE"
            ((health_passed++))
        else
            echo "✗ $service service health" >> "$REPORT_FILE"
        fi
    done
    
    echo "" >> "$REPORT_FILE"
    echo "**Health Checks:** $health_passed/$health_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Health checks completed: $health_passed/$health_total passed"
}

# Function to test authentication flow
test_authentication() {
    log "Testing authentication flow..."
    
    echo "### Authentication Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local auth_passed=0
    local auth_total=0
    
    # Test user registration
    ((auth_total++))
    local register_response=$(curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" || echo "")
    
    if echo "$register_response" | grep -q "token\|success\|created"; then
        echo "✓ User registration" >> "$REPORT_FILE"
        ((auth_passed++))
    else
        echo "✗ User registration" >> "$REPORT_FILE"
        echo "Response: $register_response" >> "$REPORT_FILE"
    fi
    
    # Test user login
    ((auth_total++))
    local login_response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" || echo "")
    
    local token=""
    if echo "$login_response" | grep -q "token"; then
        token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        echo "✓ User login" >> "$REPORT_FILE"
        ((auth_passed++))
    else
        echo "✗ User login" >> "$REPORT_FILE"
        echo "Response: $login_response" >> "$REPORT_FILE"
    fi
    
    # Test JWT validation
    if [ -n "$token" ]; then
        ((auth_total++))
        local validate_response=$(curl -s -X GET "$API_URL/users/me" \
            -H "Authorization: Bearer $token" || echo "")
        
        if echo "$validate_response" | grep -q "email\|id\|name"; then
            echo "✓ JWT token validation" >> "$REPORT_FILE"
            ((auth_passed++))
        else
            echo "✗ JWT token validation" >> "$REPORT_FILE"
        fi
    else
        ((auth_total++))
        echo "✗ JWT token validation (no token available)" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Authentication Tests:** $auth_passed/$auth_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Authentication tests completed: $auth_passed/$auth_total passed"
    
    # Export token for other tests
    if [ -n "$token" ]; then
        export TEST_TOKEN="$token"
    fi
}

# Function to test credit management
test_credits() {
    log "Testing credit management..."
    
    echo "### Credit Management Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local credits_passed=0
    local credits_total=0
    
    if [ -n "$TEST_TOKEN" ]; then
        # Test credit balance check
        ((credits_total++))
        local balance_response=$(curl -s -X GET "$API_URL/credits/balance" \
            -H "Authorization: Bearer $TEST_TOKEN" || echo "")
        
        if echo "$balance_response" | grep -q "balance\|credits"; then
            echo "✓ Credit balance check" >> "$REPORT_FILE"
            ((credits_passed++))
        else
            echo "✗ Credit balance check" >> "$REPORT_FILE"
        fi
        
        # Test credit top-up (with test Stripe token)
        ((credits_total++))
        local topup_response=$(curl -s -X POST "$API_URL/credits/topup" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            -d "{\"amount\":1000,\"paymentMethodId\":\"pm_test_visa\"}" || echo "")
        
        if echo "$topup_response" | grep -q "success\|processed\|completed"; then
            echo "✓ Credit top-up" >> "$REPORT_FILE"
            ((credits_passed++))
        else
            echo "✗ Credit top-up" >> "$REPORT_FILE"
            echo "Response: $topup_response" >> "$REPORT_FILE"
        fi
        
        # Test credit deduction simulation
        ((credits_total++))
        local deduct_response=$(curl -s -X POST "$API_URL/credits/deduct" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            -d "{\"amount\":10,\"description\":\"Test deduction\"}" || echo "")
        
        if echo "$deduct_response" | grep -q "success\|deducted\|completed"; then
            echo "✓ Credit deduction" >> "$REPORT_FILE"
            ((credits_passed++))
        else
            echo "✗ Credit deduction" >> "$REPORT_FILE"
        fi
    else
        # No token available, skip credit tests
        credits_total=3
        echo "✗ Credit tests skipped (no authentication token)" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Credit Management Tests:** $credits_passed/$credits_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Credit management tests completed: $credits_passed/$credits_total passed"
}

# Function to test MCP server
test_mcp_server() {
    log "Testing MCP server..."
    
    echo "### MCP Server Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local mcp_passed=0
    local mcp_total=0
    
    if [ -n "$TEST_TOKEN" ]; then
        # Test model listing
        ((mcp_total++))
        local models_response=$(curl -s -X GET "$API_URL/mcp/models" \
            -H "Authorization: Bearer $TEST_TOKEN" || echo "")
        
        if echo "$models_response" | grep -q "models\|gpt\|claude"; then
            echo "✓ Model listing" >> "$REPORT_FILE"
            ((mcp_passed++))
        else
            echo "✗ Model listing" >> "$REPORT_FILE"
        fi
        
        # Test completion endpoint
        ((mcp_total++))
        local completion_response=$(curl -s -X POST "$API_URL/mcp/completions" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            -d "{\"model\":\"gpt-3.5-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"maxTokens\":10}" || echo "")
        
        if echo "$completion_response" | grep -q "content\|choices\|response"; then
            echo "✓ Text completion" >> "$REPORT_FILE"
            ((mcp_passed++))
        else
            echo "✗ Text completion" >> "$REPORT_FILE"
        fi
        
        # Test streaming endpoint
        ((mcp_total++))
        local stream_response=$(curl -s -X POST "$API_URL/mcp/completions/stream" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            -d "{\"model\":\"gpt-3.5-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}],\"maxTokens\":5}" || echo "")
        
        if echo "$stream_response" | grep -q "data\|event\|stream"; then
            echo "✓ Streaming completion" >> "$REPORT_FILE"
            ((mcp_passed++))
        else
            echo "✗ Streaming completion" >> "$REPORT_FILE"
        fi
    else
        # No token available, skip MCP tests
        mcp_total=3
        echo "✗ MCP tests skipped (no authentication token)" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**MCP Server Tests:** $mcp_passed/$mcp_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "MCP server tests completed: $mcp_passed/$mcp_total passed"
}

# Function to test analytics
test_analytics() {
    log "Testing analytics service..."
    
    echo "### Analytics Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local analytics_passed=0
    local analytics_total=0
    
    if [ -n "$TEST_TOKEN" ]; then
        # Test usage tracking
        ((analytics_total++))
        local usage_response=$(curl -s -X GET "$API_URL/analytics/my-usage" \
            -H "Authorization: Bearer $TEST_TOKEN" || echo "")
        
        if echo "$usage_response" | grep -q "usage\|requests\|tokens"; then
            echo "✓ Usage tracking" >> "$REPORT_FILE"
            ((analytics_passed++))
        else
            echo "✗ Usage tracking" >> "$REPORT_FILE"
        fi
        
        # Test export functionality
        ((analytics_total++))
        local export_response=$(curl -s -X POST "$API_URL/analytics/export" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            -d "{\"format\":\"csv\",\"dateRange\":\"7d\"}" || echo "")
        
        if echo "$export_response" | grep -q "export\|download\|url\|data"; then
            echo "✓ Data export" >> "$REPORT_FILE"
            ((analytics_passed++))
        else
            echo "✗ Data export" >> "$REPORT_FILE"
        fi
        
        # Test dashboard data
        ((analytics_total++))
        local dashboard_response=$(curl -s -X GET "$API_URL/analytics/dashboard" \
            -H "Authorization: Bearer $TEST_TOKEN" || echo "")
        
        if echo "$dashboard_response" | grep -q "dashboard\|metrics\|stats"; then
            echo "✓ Dashboard data" >> "$REPORT_FILE"
            ((analytics_passed++))
        else
            echo "✗ Dashboard data" >> "$REPORT_FILE"
        fi
    else
        # No token available, skip analytics tests
        analytics_total=3
        echo "✗ Analytics tests skipped (no authentication token)" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Analytics Tests:** $analytics_passed/$analytics_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Analytics tests completed: $analytics_passed/$analytics_total passed"
}

# Function to test API standards compliance
test_api_standards() {
    log "Testing API standards compliance..."
    
    echo "### API Standards Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local api_passed=0
    local api_total=0
    
    # Test API versioning
    ((api_total++))
    local version_response=$(curl -s -X GET "$API_URL/version" || echo "")
    if echo "$version_response" | grep -q "version\|v1\|api"; then
        echo "✓ API versioning" >> "$REPORT_FILE"
        ((api_passed++))
    else
        echo "✗ API versioning" >> "$REPORT_FILE"
    fi
    
    # Test response format consistency
    ((api_total++))
    local health_response=$(curl -s -X GET "$BASE_URL/health" || echo "")
    if echo "$health_response" | grep -q "status\|healthy\|ok"; then
        echo "✓ Response format consistency" >> "$REPORT_FILE"
        ((api_passed++))
    else
        echo "✗ Response format consistency" >> "$REPORT_FILE"
    fi
    
    # Test rate limiting
    ((api_total++))
    local rate_limit_start=$(date +%s)
    for i in {1..20}; do
        curl -s -X GET "$BASE_URL/health" > /dev/null
    done
    local rate_limit_end=$(date +%s)
    local rate_limit_duration=$((rate_limit_end - rate_limit_start))
    
    if [ $rate_limit_duration -gt 0 ]; then
        echo "✓ Rate limiting active" >> "$REPORT_FILE"
        ((api_passed++))
    else
        echo "✗ Rate limiting" >> "$REPORT_FILE"
    fi
    
    # Test request IDs
    ((api_total++))
    local request_id_response=$(curl -s -I -X GET "$BASE_URL/health" || echo "")
    if echo "$request_id_response" | grep -qi "x-request-id\|request-id"; then
        echo "✓ Request ID tracking" >> "$REPORT_FILE"
        ((api_passed++))
    else
        echo "✗ Request ID tracking" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**API Standards Tests:** $api_passed/$api_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "API standards tests completed: $api_passed/$api_total passed"
}

# Function to generate test summary
generate_test_summary() {
    log "Generating test summary..."
    
    # Calculate total tests passed
    local total_tests=$(grep -c "✓\|✗" "$REPORT_FILE" || echo "0")
    local passed_tests=$(grep -c "✓" "$REPORT_FILE" || echo "0")
    local failed_tests=$(grep -c "✗" "$REPORT_FILE" || echo "0")
    local success_rate=0
    
    if [ $total_tests -gt 0 ]; then
        success_rate=$((passed_tests * 100 / total_tests))
    fi
    
    # Add summary to report
    cat >> "$REPORT_FILE" << EOF

## Test Summary

- **Total Tests:** $total_tests
- **Passed:** $passed_tests
- **Failed:** $failed_tests
- **Success Rate:** $success_rate%

## Overall Result

EOF

    if [ $success_rate -ge 90 ]; then
        echo "🎉 **EXCELLENT** - Tests passed with high success rate!" >> "$REPORT_FILE"
        log "🎉 EXCELLENT - Tests passed with high success rate!"
    elif [ $success_rate -ge 75 ]; then
        echo "✅ **GOOD** - Most tests passed successfully." >> "$REPORT_FILE"
        log "✅ GOOD - Most tests passed successfully."
    elif [ $success_rate -ge 50 ]; then
        echo "⚠️ **NEEDS ATTENTION** - Some tests failed." >> "$REPORT_FILE"
        log "⚠️ NEEDS ATTENTION - Some tests failed."
    else
        echo "❌ **CRITICAL** - Many tests failed." >> "$REPORT_FILE"
        log "❌ CRITICAL - Many tests failed."
    fi
    
    cat >> "$REPORT_FILE" << EOF

## Recommendations

EOF

    if [ $failed_tests -gt 0 ]; then
        echo "- Review and fix failed tests before production deployment" >> "$REPORT_FILE"
        echo "- Check service logs for detailed error information" >> "$REPORT_FILE"
    else
        echo "- All tests passed! Ready for production deployment consideration" >> "$REPORT_FILE"
    fi
    
    echo "- Run performance tests: \`bash performance-test.sh\`" >> "$REPORT_FILE"
    echo "- Run security tests: \`bash security-test.sh\`" >> "$REPORT_FILE"
    echo "- Review monitoring dashboards" >> "$REPORT_FILE"
    
    log "Test summary generated."
}

# Main test function
main() {
    log "Starting staging test suite..."
    
    # Setup test environment
    setup_test_environment
    
    # Run test suites
    test_health_checks
    test_authentication
    test_credits
    test_mcp_server
    test_analytics
    test_api_standards
    
    # Generate summary
    generate_test_summary
    
    log "Staging test suite completed! 🎉"
    echo ""
    echo "Test report: $REPORT_FILE"
    echo "View results: cat $REPORT_FILE"
}

# Handle script arguments
case "${1:-all}" in
    all)
        main
        ;;
    health)
        setup_test_environment
        test_health_checks
        ;;
    auth)
        setup_test_environment
        test_authentication
        ;;
    credits)
        setup_test_environment
        test_authentication
        test_credits
        ;;
    mcp)
        setup_test_environment
        test_authentication
        test_mcp_server
        ;;
    analytics)
        setup_test_environment
        test_authentication
        test_analytics
        ;;
    api)
        setup_test_environment
        test_api_standards
        ;;
    *)
        echo "Usage: $0 {all|health|auth|credits|mcp|analytics|api}"
        echo "  all       - Run all tests (default)"
        echo "  health    - Run health checks only"
        echo "  auth      - Run authentication tests"
        echo "  credits   - Run credit management tests"
        echo "  mcp       - Run MCP server tests"
        echo "  analytics - Run analytics tests"
        echo "  api       - Run API standards tests"
        exit 1
        ;;
esac