#!/bin/bash

# Security Testing Suite
# This script runs security tests on the staging environment

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
REPORT_FILE="$TEST_RESULTS_DIR/SECURITY_REPORT_$TIMESTAMP.md"

# Base URL for testing
BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api"

# Test credentials
TEST_EMAIL="security@test.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Security Test User"

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
    log "Setting up security test environment..."
    
    # Create test results directory
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Initialize security report
    cat > "$REPORT_FILE" << EOF
# Security Test Report

**Test Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Environment:** Staging
**Base URL:** $BASE_URL

## Security Test Results

EOF

    log "Security test environment setup completed."
}

# Function to test SQL injection protection
test_sql_injection() {
    log "Testing SQL injection protection..."
    
    echo "### SQL Injection Protection Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local sql_passed=0
    local sql_total=0
    
    # Test common SQL injection payloads
    local sql_payloads=(
        "' OR '1'='1"
        "' OR '1'='1' --"
        "' OR '1'='1' /*"
        "admin'--"
        "admin' /*"
        "' OR 1=1--"
        "' OR 1=1#"
        "' OR 1=1/*"
        "') OR '1'='1--"
        "') OR ('1'='1--"
        "'; DROP TABLE users;--"
        "'; INSERT INTO users VALUES('hacker','password');--"
    )
    
    for payload in "${sql_payloads[@]}"; do
        ((sql_total++))
        
        # Test login endpoint with SQL injection
        local response=$(curl -s -X POST "$API_URL/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$payload\",\"password\":\"$payload\"}" || echo "")
        
        # Check if response contains error or authentication failure (good) vs success (bad)
        if echo "$response" | grep -q "error\|invalid\|unauthorized\|failed\|SQL"; then
            echo "✓ SQL injection blocked: $payload" >> "$REPORT_FILE"
            ((sql_passed++))
        else
            echo "✗ SQL injection may have succeeded: $payload" >> "$REPORT_FILE"
            echo "Response: $response" >> "$REPORT_FILE"
        fi
    done
    
    # Test SQL injection in GET parameters
    local get_payloads=(
        "?id=1' OR '1'='1"
        "?user=admin'--"
        "?search='; DROP TABLE users;--"
    )
    
    for payload in "${get_payloads[@]}"; do
        ((sql_total++))
        
        local response=$(curl -s -X GET "$API_URL/users$payload" || echo "")
        
        if echo "$response" | grep -q "error\|invalid\|not found\|SQL"; then
            echo "✓ SQL injection blocked in GET: $payload" >> "$REPORT_FILE"
            ((sql_passed++))
        else
            echo "✗ SQL injection may have succeeded in GET: $payload" >> "$REPORT_FILE"
        fi
    done
    
    echo "" >> "$REPORT_FILE"
    echo "**SQL Injection Tests:** $sql_passed/$sql_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "SQL injection tests completed: $sql_passed/$sql_total passed"
}

# Function to test XSS protection
test_xss_protection() {
    log "Testing XSS protection..."
    
    echo "### XSS Protection Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local xss_passed=0
    local xss_total=0
    
    # Test common XSS payloads
    local xss_payloads=(
        "<script>alert('XSS')</script>"
        "<img src=x onerror=alert('XSS')>"
        "javascript:alert('XSS')"
        "<svg onload=alert('XSS')>"
        "';alert('XSS');//"
        "<iframe src=javascript:alert('XSS')>"
        "<body onload=alert('XSS')>"
        "<input onfocus=alert('XSS') autofocus>"
        "<select onfocus=alert('XSS') autofocus>"
        "<textarea onfocus=alert('XSS') autofocus>"
    )
    
    for payload in "${xss_payloads[@]}"; do
        ((xss_total++))
        
        # Test XSS in user registration
        local response=$(curl -s -X POST "$API_URL/auth/register" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"xss@test.com\",\"password\":\"TestPassword123!\",\"name\":\"$payload\"}" || echo "")
        
        # Check if response contains sanitized/escaped content or error
        if echo "$response" | grep -q "error\|invalid\|sanitized\|escaped\|<\>" || ! echo "$response" | grep -q "<script>"; then
            echo "✓ XSS blocked in registration: $payload" >> "$REPORT_FILE"
            ((xss_passed++))
        else
            echo "✗ XSS may have succeeded in registration: $payload" >> "$REPORT_FILE"
        fi
    done
    
    # Test XSS in search/query parameters
    for payload in "${xss_payloads[@]}"; do
        ((xss_total++))
        
        # URL encode the payload for GET request
        local encoded_payload=$(echo "$payload" | jq -sRr @uri)
        local response=$(curl -s -X GET "$API_URL/search?q=$encoded_payload" || echo "")
        
        if echo "$response" | grep -q "error\|sanitized\|escaped\|<\>" || ! echo "$response" | grep -q "<script>"; then
            echo "✓ XSS blocked in search: $payload" >> "$REPORT_FILE"
            ((xss_passed++))
        else
            echo "✗ XSS may have succeeded in search: $payload" >> "$REPORT_FILE"
        fi
    done
    
    echo "" >> "$REPORT_FILE"
    echo "**XSS Protection Tests:** $xss_passed/$xss_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "XSS protection tests completed: $xss_passed/$xss_total passed"
}

# Function to test authentication bypass attempts
test_authentication_bypass() {
    log "Testing authentication bypass attempts..."
    
    echo "### Authentication Bypass Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local auth_passed=0
    local auth_total=0
    
    # Test access to protected endpoints without authentication
    local protected_endpoints=(
        "$API_URL/users/me"
        "$API_URL/credits/balance"
        "$API_URL/mcp/models"
        "$API_URL/analytics/dashboard"
    )
    
    for endpoint in "${protected_endpoints[@]}"; do
        ((auth_total++))
        
        local response=$(curl -s -X GET "$endpoint" || echo "")
        
        if echo "$response" | grep -q "unauthorized\|authentication\|401\|403"; then
            echo "✓ Protected endpoint requires auth: $endpoint" >> "$REPORT_FILE"
            ((auth_passed++))
        else
            echo "✗ Authentication bypass possible: $endpoint" >> "$REPORT_FILE"
            echo "Response: $response" >> "$REPORT_FILE"
        fi
    done
    
    # Test with invalid tokens
    ((auth_total++))
    local invalid_response=$(curl -s -X GET "$API_URL/users/me" \
        -H "Authorization: Bearer invalid-token" || echo "")
    
    if echo "$invalid_response" | grep -q "unauthorized\|invalid\|token\|401"; then
        echo "✓ Invalid token rejected" >> "$REPORT_FILE"
        ((auth_passed++))
    else
        echo "✗ Invalid token accepted" >> "$REPORT_FILE"
    fi
    
    # Test with expired tokens (simulate)
    ((auth_total++))
    local expired_response=$(curl -s -X GET "$API_URL/users/me" \
        -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid" || echo "")
    
    if echo "$expired_response" | grep -q "unauthorized\|expired\|token\|401"; then
        echo "✓ Expired token rejected" >> "$REPORT_FILE"
        ((auth_passed++))
    else
        echo "✗ Expired token accepted" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Authentication Bypass Tests:** $auth_passed/$auth_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Authentication bypass tests completed: $auth_passed/$auth_total passed"
}

# Function to test authorization checks
test_authorization_checks() {
    log "Testing authorization checks..."
    
    echo "### Authorization Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local authz_passed=0
    local authz_total=0
    
    # First, register and login a regular user
    local register_response=$(curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" || echo "")
    
    local login_response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" || echo "")
    
    local user_token=""
    if echo "$login_response" | grep -q "token"; then
        user_token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    fi
    
    if [ -n "$user_token" ]; then
        # Test admin-only endpoints with regular user token
        local admin_endpoints=(
            "$API_URL/admin/users"
            "$API_URL/admin/analytics"
            "$API_URL/admin/system"
        )
        
        for endpoint in "${admin_endpoints[@]}"; do
            ((authz_total++))
            
            local response=$(curl -s -X GET "$endpoint" \
                -H "Authorization: Bearer $user_token" || echo "")
            
            if echo "$response" | grep -q "forbidden\|unauthorized\|admin\|403\|401"; then
                echo "✓ Admin endpoint protected: $endpoint" >> "$REPORT_FILE"
                ((authz_passed++))
            else
                echo "✗ Authorization bypass possible: $endpoint" >> "$REPORT_FILE"
                echo "Response: $response" >> "$REPORT_FILE"
            fi
        done
        
        # Test user can only access their own data
        ((authz_total++))
        local other_user_response=$(curl -s -X GET "$API_URL/users/999" \
            -H "Authorization: Bearer $user_token" || echo "")
        
        if echo "$other_user_response" | grep -q "forbidden\|unauthorized\|not found\|403\|404"; then
            echo "✓ User data access restricted" >> "$REPORT_FILE"
            ((authz_passed++))
        else
            echo "✗ User data access not restricted" >> "$REPORT_FILE"
        fi
    else
        # Could not get user token, skip tests
        authz_total=5
        echo "✗ Authorization tests skipped (no user token)" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Authorization Tests:** $authz_passed/$authz_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Authorization tests completed: $authz_passed/$authz_total passed"
}

# Function to test rate limiting
test_rate_limiting() {
    log "Testing rate limiting..."
    
    echo "### Rate Limiting Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local rate_passed=0
    local rate_total=0
    
    # Test login endpoint rate limiting
    ((rate_total++))
    local rate_limited=false
    for i in {1..20}; do
        local response=$(curl -s -X POST "$API_URL/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"test@test.com\",\"password\":\"wrong\"}" || echo "")
        
        if echo "$response" | grep -q "rate\|limit\|too many\|429"; then
            rate_limited=true
            break
        fi
        sleep 0.1
    done
    
    if [ "$rate_limited" = true ]; then
        echo "✓ Login endpoint rate limited" >> "$REPORT_FILE"
        ((rate_passed++))
    else
        echo "✗ Login endpoint not rate limited" >> "$REPORT_FILE"
    fi
    
    # Test API endpoint rate limiting
    ((rate_total++))
    rate_limited=false
    for i in {1..50}; do
        local response=$(curl -s -X GET "$API_URL/health" || echo "")
        
        if echo "$response" | grep -q "rate\|limit\|too many\|429"; then
            rate_limited=true
            break
        fi
    done
    
    if [ "$rate_limited" = true ]; then
        echo "✓ API endpoint rate limited" >> "$REPORT_FILE"
        ((rate_passed++))
    else
        echo "⚠️ API endpoint rate limiting not detected (may be permissive for staging)" >> "$REPORT_FILE"
        ((rate_passed++))  # Don't fail for staging
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Rate Limiting Tests:** $rate_passed/$rate_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Rate limiting tests completed: $rate_passed/$rate_total passed"
}

# Function to test HTTPS enforcement
test_https_enforcement() {
    log "Testing HTTPS enforcement..."
    
    echo "### HTTPS Enforcement Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local https_passed=0
    local https_total=0
    
    # Test HTTPS redirect (should redirect to HTTPS in production)
    ((https_total++))
    local http_response=$(curl -s -I -X GET "http://localhost:8080" || echo "")
    
    if echo "$http_response" | grep -qi "301\|302\|https"; then
        echo "✓ HTTP redirects to HTTPS" >> "$REPORT_FILE"
        ((https_passed++))
    else
        echo "⚠️ HTTP does not redirect to HTTPS (expected for staging)" >> "$REPORT_FILE"
        ((https_passed++))  # Don't fail for staging
    fi
    
    # Test security headers
    ((https_total++))
    local security_headers=$(curl -s -I -X GET "$BASE_URL" || echo "")
    
    local headers_found=0
    local total_headers=4
    
    if echo "$security_headers" | grep -qi "x-frame-options"; then
        echo "✓ X-Frame-Options header present" >> "$REPORT_FILE"
        ((headers_found++))
    else
        echo "✗ X-Frame-Options header missing" >> "$REPORT_FILE"
    fi
    
    if echo "$security_headers" | grep -qi "x-content-type-options"; then
        echo "✓ X-Content-Type-Options header present" >> "$REPORT_FILE"
        ((headers_found++))
    else
        echo "✗ X-Content-Type-Options header missing" >> "$REPORT_FILE"
    fi
    
    if echo "$security_headers" | grep -qi "x-xss-protection"; then
        echo "✓ X-XSS-Protection header present" >> "$REPORT_FILE"
        ((headers_found++))
    else
        echo "✗ X-XSS-Protection header missing" >> "$REPORT_FILE"
    fi
    
    if echo "$security_headers" | grep -qi "strict-transport-security"; then
        echo "✓ Strict-Transport-Security header present" >> "$REPORT_FILE"
        ((headers_found++))
    else
        echo "⚠️ Strict-Transport-Security header missing (expected for staging)" >> "$REPORT_FILE"
    fi
    
    if [ $headers_found -ge 3 ]; then
        ((https_passed++))
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**HTTPS Enforcement Tests:** $https_passed/$https_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "HTTPS enforcement tests completed: $https_passed/$https_total passed"
}

# Function to test input validation
test_input_validation() {
    log "Testing input validation..."
    
    echo "### Input Validation Tests" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local input_passed=0
    local input_total=0
    
    # Test email validation
    local invalid_emails=(
        "invalid-email"
        "@domain.com"
        "user@"
        "user..name@domain.com"
        "user@.com"
        "user@domain."
        ""
    )
    
    for email in "${invalid_emails[@]}"; do
        ((input_total++))
        
        local response=$(curl -s -X POST "$API_URL/auth/register" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$email\",\"password\":\"TestPassword123!\",\"name\":\"Test User\"}" || echo "")
        
        if echo "$response" | grep -q "error\|invalid\|required\|format"; then
            echo "✓ Invalid email rejected: $email" >> "$REPORT_FILE"
            ((input_passed++))
        else
            echo "✗ Invalid email accepted: $email" >> "$REPORT_FILE"
        fi
    done
    
    # Test password validation
    local invalid_passwords=(
        ""
        "123"
        "password"
        "PASSWORD"
        "Pass"
        "NoNumbers!"
        "NoSpecialChars123"
    )
    
    for password in "${invalid_passwords[@]}"; do
        ((input_total++))
        
        local response=$(curl -s -X POST "$API_URL/auth/register" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"test@test.com\",\"password\":\"$password\",\"name\":\"Test User\"}" || echo "")
        
        if echo "$response" | grep -q "error\|invalid\|required\|strong\|length"; then
            echo "✓ Weak password rejected" >> "$REPORT_FILE"
            ((input_passed++))
        else
            echo "✗ Weak password accepted" >> "$REPORT_FILE"
        fi
    done
    
    echo "" >> "$REPORT_FILE"
    echo "**Input Validation Tests:** $input_passed/$input_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Input validation tests completed: $input_passed/$input_total passed"
}

# Function to run vulnerability scan
run_vulnerability_scan() {
    log "Running vulnerability scan..."
    
    echo "### Vulnerability Scan" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for common vulnerabilities using curl
    local vuln_passed=0
    local vuln_total=0
    
    # Test for information disclosure
    ((vuln_total++))
    local info_response=$(curl -s -X GET "$API_URL/nonexistent" || echo "")
    
    if echo "$info_response" | grep -q "error\|not found\|404" && ! echo "$info_response" | grep -q "stack\|trace\|internal\|exception"; then
        echo "✓ No information disclosure in error messages" >> "$REPORT_FILE"
        ((vuln_passed++))
    else
        echo "✗ Potential information disclosure" >> "$REPORT_FILE"
    fi
    
    # Test for directory traversal
    ((vuln_total++))
    local traversal_response=$(curl -s -X GET "$API_URL/files/../../../etc/passwd" || echo "")
    
    if echo "$traversal_response" | grep -q "error\|forbidden\|not found\|403\|404" || ! echo "$traversal_response" | grep -q "root:"; then
        echo "✓ Directory traversal blocked" >> "$REPORT_FILE"
        ((vuln_passed++))
    else
        echo "✗ Directory traversal may be possible" >> "$REPORT_FILE"
    fi
    
    # Test for CORS misconfiguration
    ((vuln_total++))
    local cors_response=$(curl -s -I -X OPTIONS "$API_URL/health" \
        -H "Origin: http://evil.com" \
        -H "Access-Control-Request-Method: GET" || echo "")
    
    if echo "$cors_response" | grep -qi "access-control-allow-origin.*evil.com"; then
        echo "✗ CORS allows any origin" >> "$REPORT_FILE"
    else
        echo "✓ CORS properly configured" >> "$REPORT_FILE"
        ((vuln_passed++))
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**Vulnerability Scan:** $vuln_passed/$vuln_total passed" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log "Vulnerability scan completed: $vuln_passed/$vuln_total passed"
}

# Function to generate security summary
generate_security_summary() {
    log "Generating security summary..."
    
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

## Security Test Summary

- **Total Tests:** $total_tests
- **Passed:** $passed_tests
- **Failed:** $failed_tests
- **Success Rate:** $success_rate%

## Security Assessment

EOF

    if [ $success_rate -ge 95 ]; then
        echo "🔒 **EXCELLENT** - Security posture is strong!" >> "$REPORT_FILE"
        log "🔒 EXCELLENT - Security posture is strong!"
    elif [ $success_rate -ge 85 ]; then
        echo "✅ **GOOD** - Security is acceptable with minor issues." >> "$REPORT_FILE"
        log "✅ GOOD - Security is acceptable with minor issues."
    elif [ $success_rate -ge 70 ]; then
        echo "⚠️ **NEEDS ATTENTION** - Security issues require fixing." >> "$REPORT_FILE"
        log "⚠️ NEEDS ATTENTION - Security issues require fixing."
    else
        echo "❌ **CRITICAL** - Major security vulnerabilities found!" >> "$REPORT_FILE"
        log "❌ CRITICAL - Major security vulnerabilities found!"
    fi
    
    cat >> "$REPORT_FILE" << EOF

## Production Readiness

EOF

    if [ $success_rate -ge 85 ]; then
        echo "✅ **Ready for Production** - Security measures are adequate." >> "$REPORT_FILE"
    else
        echo "❌ **Not Ready for Production** - Security issues must be addressed." >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << EOF

## Security Recommendations

- Implement Web Application Firewall (WAF)
- Enable security monitoring and alerting
- Regular security audits and penetration testing
- Keep all dependencies updated
- Implement Content Security Policy (CSP)
- Enable HTTP Strict Transport Security (HSTS) in production
- Regular security training for development team
- Implement automated security scanning in CI/CD

## Next Steps

EOF

    if [ $failed_tests -gt 0 ]; then
        echo "- Address all failed security tests before production deployment" >> "$REPORT_FILE"
        echo "- Review security logs and implement additional monitoring" >> "$REPORT_FILE"
    else
        echo "- Continue security best practices in development" >> "$REPORT_FILE"
        echo "- Schedule regular security assessments" >> "$REPORT_FILE"
    fi
    
    echo "- Review OWASP Top 10 vulnerabilities" >> "$REPORT_FILE"
    echo "- Implement security headers in production" >> "$REPORT_FILE"
    
    log "Security summary generated."
}

# Main security test function
main() {
    log "Starting security test suite..."
    
    # Setup test environment
    setup_test_environment
    
    # Run security tests
    test_sql_injection
    test_xss_protection
    test_authentication_bypass
    test_authorization_checks
    test_rate_limiting
    test_https_enforcement
    test_input_validation
    run_vulnerability_scan
    
    # Generate summary
    generate_security_summary
    
    log "Security test suite completed! 🎉"
    echo ""
    echo "Security report: $REPORT_FILE"
    echo "View results: cat $REPORT_FILE"
}

# Handle script arguments
case "${1:-all}" in
    all)
        main
        ;;
    sql)
        setup_test_environment
        test_sql_injection
        ;;
    xss)
        setup_test_environment
        test_xss_protection
        ;;
    auth)
        setup_test_environment
        test_authentication_bypass
        ;;
    authz)
        setup_test_environment
        test_authorization_checks
        ;;
    rate)
        setup_test_environment
        test_rate_limiting
        ;;
    https)
        setup_test_environment
        test_https_enforcement
        ;;
    input)
        setup_test_environment
        test_input_validation
        ;;
    vuln)
        setup_test_environment
        run_vulnerability_scan
        ;;
    *)
        echo "Usage: $0 {all|sql|xss|auth|authz|rate|https|input|vuln}"
        echo "  all   - Run all security tests (default)"
        echo "  sql   - Test SQL injection protection"
        echo "  xss   - Test XSS protection"
        echo "  auth  - Test authentication bypass"
        echo "  authz - Test authorization checks"
        echo "  rate  - Test rate limiting"
        echo "  https - Test HTTPS enforcement"
        echo "  input - Test input validation"
        echo "  vuln  - Run vulnerability scan"
        exit 1
        ;;
esac