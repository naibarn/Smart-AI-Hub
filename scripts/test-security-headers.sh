#!/bin/bash

# Security Headers Test Script for Smart AI Hub
# Tests all security headers implementation and CSP functionality

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default settings
BASE_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"
VERBOSE=false
SKIP_EXTERNAL=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --frontend-url)
      FRONTEND_URL="$2"
      shift 2
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --skip-external)
      SKIP_EXTERNAL=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --base-url URL       Base URL for API testing (default: http://localhost:3000)"
      echo "  --frontend-url URL   Frontend URL for testing (default: http://localhost:5173)"
      echo "  --verbose, -v        Enable verbose output"
      echo "  --skip-external      Skip external security testing services"
      echo "  --help, -h           Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Test results counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[PASS]${NC} $1"
  ((TESTS_PASSED++))
}

log_error() {
  echo -e "${RED}[FAIL]${NC} $1"
  ((TESTS_FAILED++))
}

log_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_test() {
  echo -e "${BLUE}[TEST]${NC} $1"
  ((TESTS_TOTAL++))
}

# Function to check if a header exists in response
check_header() {
  local headers="$1"
  local header_name="$2"
  local expected_value="$3"
  
  if echo "$headers" | grep -qi "^$header_name:"; then
    local actual_value=$(echo "$headers" | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r')
    
    if [ -z "$expected_value" ]; then
      log_success "$header_name header is present: $actual_value"
      return 0
    elif echo "$actual_value" | grep -qi "$expected_value"; then
      log_success "$header_name header is present with expected value: $actual_value"
      return 0
    else
      log_error "$header_name header has unexpected value: $actual_value (expected: $expected_value)"
      return 1
    fi
  else
    log_error "$header_name header is missing"
    return 1
  fi
}

# Function to test HTTP response headers
test_headers() {
  local url="$1"
  local service_name="$2"
  
  log_info "Testing security headers for $service_name at $url"
  
  # Get response headers
  local headers
  if ! headers=$(curl -s -I -L "$url" 2>/dev/null); then
    log_error "Failed to connect to $url"
    return 1
  fi
  
  if [ "$VERBOSE" = true ]; then
    echo "Response headers:"
    echo "$headers"
    echo ""
  fi
  
  # Test each required security header
  log_test "X-Content-Type-Options header"
  check_header "$headers" "X-Content-Type-Options" "nosniff"
  
  log_test "X-Frame-Options header"
  check_header "$headers" "X-Frame-Options" "DENY"
  
  log_test "X-XSS-Protection header"
  check_header "$headers" "X-XSS-Protection" "1; mode=block"
  
  log_test "Referrer-Policy header"
  check_header "$headers" "Referrer-Policy" "strict-origin-when-cross-origin"
  
  log_test "X-DNS-Prefetch-Control header"
  check_header "$headers" "X-DNS-Prefetch-Control" "off"
  
  log_test "X-Download-Options header"
  check_header "$headers" "X-Download-Options" "noopen"
  
  log_test "X-Permitted-Cross-Domain-Policies header"
  check_header "$headers" "X-Permitted-Cross-Domain-Policies" "none"
  
  log_test "Permissions-Policy header"
  check_header "$headers" "Permissions-Policy" ""
  
  log_test "Content-Security-Policy header"
  if echo "$headers" | grep -qi "^Content-Security-Policy:"; then
    local csp_value=$(echo "$headers" | grep -i "^Content-Security-Policy:" | cut -d' ' -f2- | tr -d '\r')
    log_success "CSP header is present: $csp_value"
    
    # Check CSP directives
    if echo "$csp_value" | grep -q "default-src"; then
      log_success "CSP contains default-src directive"
    else
      log_error "CSP missing default-src directive"
    fi
    
    if echo "$csp_value" | grep -q "script-src"; then
      log_success "CSP contains script-src directive"
    else
      log_error "CSP missing script-src directive"
    fi
    
    if echo "$csp_value" | grep -q "report-uri\|report-to"; then
      log_success "CSP contains reporting directive"
    else
      log_warning "CSP missing reporting directive"
    fi
  else
    log_error "Content-Security-Policy header is missing"
  fi
  
  # Check HTTPS-related headers for HTTPS connections
  if [[ "$url" == https://* ]]; then
    log_test "Strict-Transport-Security header"
    check_header "$headers" "Strict-Transport-Security" "max-age=31536000"
  fi
  
  echo ""
}

# Function to test CSP violation reporting
test_csp_reporting() {
  local api_url="$1"
  
  log_info "Testing CSP violation reporting"
  
  # Create a test CSP violation report
  local violation_report='{
    "csp-report": {
      "document-uri": "'$FRONTEND_URL'",
      "referrer": "'$FRONTEND_URL'",
      "violated-directive": "script-src",
      "effective-directive": "script-src",
      "original-policy": "default-src \"self\"; script-src \"self\"",
      "disposition": "report",
      "blocked-uri": "https://evil.com/bad.js",
      "line-number": 1,
      "column-number": 1,
      "source-file": "'$FRONTEND_URL'",
      "status-code": 200,
      "script-sample": "console.log(\"test\");"
    }
  }'
  
  # Send violation report
  local response
  if response=$(curl -s -X POST \
    -H "Content-Type: application/csp-report" \
    -d "$violation_report" \
    "$api_url/api/v1/security/csp-report" 2>/dev/null); then
    
    if echo "$response" | grep -q "success\|received\|processed"; then
      log_success "CSP violation reporting endpoint is working"
    else
      log_warning "CSP violation reporting endpoint responded unexpectedly: $response"
    fi
  else
    log_error "CSP violation reporting endpoint is not accessible"
  fi
  
  echo ""
}

# Function to test security status endpoint
test_security_status() {
  local api_url="$1"
  
  log_info "Testing security status endpoint"
  
  local response
  if response=$(curl -s "$api_url/api/v1/security/status" 2>/dev/null); then
    if echo "$response" | grep -q "headers\|score\|violations"; then
      log_success "Security status endpoint is working"
      
      if [ "$VERBOSE" = true ]; then
        echo "Security status response:"
        echo "$response" | jq . 2>/dev/null || echo "$response"
      fi
    else
      log_error "Security status endpoint returned unexpected response"
    fi
  else
    log_error "Security status endpoint is not accessible"
  fi
  
  echo ""
}

# Function to test external security services
test_external_services() {
  local test_url="$1"
  
  if [ "$SKIP_EXTERNAL" = true ]; then
    log_info "Skipping external security services testing"
    return
  fi
  
  log_info "Testing with external security services (this may take a while)..."
  
  # Test with securityheaders.com
  log_test "Testing with securityheaders.com"
  local security_headers_result
  if command -v curl &> /dev/null; then
    # Note: This would require API access to securityheaders.com
    # For now, we'll just provide instructions
    log_info "To test with securityheaders.com:"
    echo "  1. Visit https://securityheaders.com/"
    echo "  2. Enter your URL: $test_url"
    echo "  3. Expected result: A+ rating"
    echo ""
  fi
  
  # Test with Mozilla Observatory
  log_test "Testing with Mozilla Observatory"
  if command -v curl &> /dev/null; then
    # Note: This would require API access to Mozilla Observatory
    # For now, we'll just provide instructions
    log_info "To test with Mozilla Observatory:"
    echo "  1. Visit https://observatory.mozilla.org/"
    echo "  2. Enter your URL: $test_url"
    echo "  3. Expected result: 90+ score"
    echo ""
  fi
  
  # Test with SSL Labs (for HTTPS)
  if [[ "$test_url" == https://* ]] && [ "$SKIP_EXTERNAL" = false ]; then
    log_test "Testing with SSL Labs"
    log_info "To test SSL configuration with SSL Labs:"
    echo "  1. Visit https://www.ssllabs.com/ssltest/"
    echo "  2. Enter your domain"
    echo "  3. Expected result: A+ rating"
    echo ""
  fi
}

# Function to test browser compatibility
test_browser_compatibility() {
  local test_url="$1"
  
  log_info "Testing browser compatibility"
  
  # Check if the site works without security headers issues
  log_test "Testing basic page load"
  
  if command -v curl &> /dev/null; then
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -L "$test_url" 2>/dev/null)
    
    if [ "$http_code" = "200" ]; then
      log_success "Page loads successfully (HTTP $http_code)"
    else
      log_error "Page failed to load (HTTP $http_code)"
    fi
  else
    log_warning "curl not available for browser compatibility testing"
  fi
  
  echo ""
}

# Function to generate test report
generate_report() {
  echo ""
  echo "======================================"
  echo "SECURITY HEADERS TEST REPORT"
  echo "======================================"
  echo "Total tests: $TESTS_TOTAL"
  echo "Passed: $TESTS_PASSED"
  echo "Failed: $TESTS_FAILED"
  echo ""
  
  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All security headers tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test with external services (securityheaders.com, Mozilla Observatory)"
    echo "2. Verify CSP violations are being reported correctly"
    echo "3. Test in different browsers"
    exit 0
  else
    echo -e "${RED}✗ Some security headers tests failed!${NC}"
    echo ""
    echo "Please review the failed tests and fix the issues."
    exit 1
  fi
}

# Main execution
main() {
  echo "======================================"
  echo "SECURITY HEADERS TEST SCRIPT"
  echo "======================================"
  echo "Testing URL: $BASE_URL"
  echo "Frontend URL: $FRONTEND_URL"
  echo "Verbose: $VERBOSE"
  echo "Skip External: $SKIP_EXTERNAL"
  echo ""
  
  # Test API services
  test_headers "$BASE_URL/api/health" "Auth Service API"
  test_headers "$BASE_URL/core/health" "Core Service API"
  test_headers "$BASE_URL/mcp/health" "MCP Server API"
  test_headers "$BASE_URL/webhook/health" "Webhook Service API"
  test_headers "$BASE_URL/analytics/health" "Analytics Service API"
  
  # Test frontend
  test_headers "$FRONTEND_URL" "Frontend"
  
  # Test CSP functionality
  test_csp_reporting "$BASE_URL"
  test_security_status "$BASE_URL"
  
  # Test browser compatibility
  test_browser_compatibility "$FRONTEND_URL"
  
  # Test with external services
  test_external_services "$FRONTEND_URL"
  
  # Generate final report
  generate_report
}

# Check dependencies
if ! command -v curl &> /dev/null; then
  echo "Error: curl is required but not installed."
  exit 1
fi

# Run main function
main "$@"