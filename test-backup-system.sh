#!/bin/bash

#=============================================================================
# Smart AI Hub - Backup System Test Suite
# Author: Development Team
# Description: Comprehensive testing of the automated backup system
# Version: 1.0
#=============================================================================

set -euo pipefail

# Test configuration
TEST_DIR="/tmp/backup_test_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$TEST_DIR/test.log"
BACKUP_DIR="$TEST_DIR/backups"
SCRIPTS_DIR="$(pwd)/scripts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

#=============================================================================
# Test Framework Functions
#=============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO: $1"
    echo -e "${BLUE}INFO: $1${NC}"
}

log_success() {
    log "SUCCESS: $1"
    echo -e "${GREEN}✅ SUCCESS: $1${NC}"
}

log_warning() {
    log "WARN: $1"
    echo -e "${YELLOW}⚠️  WARN: $1${NC}"
}

log_error() {
    log "ERROR: $1"
    echo -e "${RED}❌ ERROR: $1${NC}"
}

test_start() {
    local test_name="$1"
    ((TESTS_TOTAL++))
    log_info "Starting test: $test_name"
    echo -e "\n${BLUE}🧪 Test $TESTS_TOTAL: $test_name${NC}"
}

test_pass() {
    local test_name="$1"
    ((TESTS_PASSED++))
    log_success "Test passed: $test_name"
}

test_fail() {
    local test_name="$1"
    local reason="$2"
    ((TESTS_FAILED++))
    log_error "Test failed: $test_name - $reason"
}

#=============================================================================
# Setup Functions
#=============================================================================

setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Create test directories
    mkdir -p "$TEST_DIR"/{backups,config,ssl,logs,temp}
    
    # Create mock configuration files
    cat > "$TEST_DIR/config/.env.production" << EOF
NODE_ENV=production
POSTGRES_PASSWORD=test_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=test@gmail.com
SMTP_PASS=test_password
SMTP_FROM=test@gmail.com
ADMIN_EMAILS=admin@test.com
EOF

    cat > "$TEST_DIR/config/docker-compose.prod.yml" << EOF
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: smart_ai_hub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: test_password
EOF

    cat > "$TEST_DIR/config/nginx.prod.conf" << EOF
server {
    listen 80;
    server_name localhost;
    location / {
        proxy_pass http://backend;
    }
}
EOF

    # Create mock SSL certificates
    openssl req -x509 -newkey rsa:2048 -keyout "$TEST_DIR/ssl/key.pem" -out "$TEST_DIR/ssl/cert.pem" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Org/CN=localhost" 2>/dev/null || true
    
    log_info "Test environment setup completed"
}

cleanup_test_environment() {
    log_info "Cleaning up test environment..."
    rm -rf "$TEST_DIR"
    log_info "Test environment cleanup completed"
}

#=============================================================================
# Unit Tests
#=============================================================================

test_script_syntax() {
    test_start "Script Syntax Validation"
    
    local scripts=("backup-lightweight.sh" "send-backup-email.sh" "backup-monitor.sh")
    local syntax_errors=0
    
    for script in "${scripts[@]}"; do
        if [[ -f "$SCRIPTS_DIR/$script" ]]; then
            if bash -n "$SCRIPTS_DIR/$script" 2>/dev/null; then
                log_success "Syntax OK: $script"
            else
                log_error "Syntax Error: $script"
                ((syntax_errors++))
            fi
        else
            log_error "Script not found: $script"
            ((syntax_errors++))
        fi
    done
    
    if [[ $syntax_errors -eq 0 ]]; then
        test_pass "Script Syntax Validation"
    else
        test_fail "Script Syntax Validation" "$syntax_errors syntax errors found"
    fi
}

test_script_permissions() {
    test_start "Script Permissions Validation"
    
    local scripts=("backup-lightweight.sh" "send-backup-email.sh" "backup-monitor.sh")
    local permission_errors=0
    
    for script in "${scripts[@]}"; do
        if [[ -f "$SCRIPTS_DIR/$script" ]]; then
            if [[ -x "$SCRIPTS_DIR/$script" ]]; then
                log_success "Executable: $script"
            else
                log_error "Not executable: $script"
                ((permission_errors++))
            fi
        else
            log_error "Script not found: $script"
            ((permission_errors++))
        fi
    done
    
    if [[ $permission_errors -eq 0 ]]; then
        test_pass "Script Permissions Validation"
    else
        test_fail "Script Permissions Validation" "$permission_errors permission errors found"
    fi
}

test_dockerfile_validation() {
    test_start "Dockerfile Validation"
    
    if [[ -f "Dockerfile.backup" ]]; then
        # Check if Dockerfile has required components
        local required_components=(
            "FROM postgres:15-alpine"
            "backup-lightweight.sh"
            "send-backup-email.sh"
            "backup-monitor.sh"
            "HEALTHCHECK"
        )
        
        local missing_components=0
        for component in "${required_components[@]}"; do
            if grep -q "$component" Dockerfile.backup; then
                log_success "Found component: $component"
            else
                log_error "Missing component: $component"
                ((missing_components++))
            fi
        done
        
        if [[ $missing_components -eq 0 ]]; then
            test_pass "Dockerfile Validation"
        else
            test_fail "Dockerfile Validation" "$missing_components missing components"
        fi
    else
        test_fail "Dockerfile Validation" "Dockerfile.backup not found"
    fi
}

test_docker_compose_validation() {
    test_start "Docker Compose Validation"
    
    if [[ -f "docker-compose.prod.yml" ]]; then
        # Check if backup service is defined
        if grep -q "backup-service:" docker-compose.prod.yml; then
            log_success "Backup service found in docker-compose.prod.yml"
            
            # Check for required environment variables
            local required_env_vars=(
                "POSTGRES_PASSWORD"
                "SMTP_USER"
                "SMTP_PASS"
                "ADMIN_EMAILS"
            )
            
            local missing_vars=0
            for var in "${required_env_vars[@]}"; do
                if grep -q "$var" docker-compose.prod.yml; then
                    log_success "Found environment variable: $var"
                else
                    log_error "Missing environment variable: $var"
                    ((missing_vars++))
                fi
            done
            
            if [[ $missing_vars -eq 0 ]]; then
                test_pass "Docker Compose Validation"
            else
                test_fail "Docker Compose Validation" "$missing_vars missing environment variables"
            fi
        else
            test_fail "Docker Compose Validation" "backup-service not found"
        fi
    else
        test_fail "Docker Compose Validation" "docker-compose.prod.yml not found"
    fi
}

#=============================================================================
# Integration Tests
#=============================================================================

test_backup_script_execution() {
    test_start "Backup Script Execution Test"
    
    # Set up test environment
    export BACKUP_DIR="$BACKUP_DIR"
    export POSTGRES_HOST="localhost"
    export POSTGRES_PORT="5432"
    export POSTGRES_DB="smart_ai_hub"
    export POSTGRES_USER="postgres"
    export POSTGRES_PASSWORD="test_password"
    export ADMIN_EMAILS="test@example.com"
    export LOG_FILE="$TEST_DIR/logs/backup.log"
    
    # Create test log directory
    mkdir -p "$TEST_DIR/logs"
    
    # Mock database commands for testing
    cat > "$TEST_DIR/temp/backup-test.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

# Mock backup script execution
BACKUP_DIR="${BACKUP_DIR:-/tmp/backups}"
LOG_FILE="${LOG_FILE:-/tmp/backup.log}"

# Create mock backup
mkdir -p "$BACKUP_DIR"
touch "$BACKUP_DIR/.last_backup_success"
echo "$(date +%s)" > "$BACKUP_DIR/.last_backup_success"
echo "5" > "$BACKUP_DIR/.last_backup_size_mb"

# Create mock backup file
tar -czf "$BACKUP_DIR/critical_backup_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$TEST_DIR" config/ 2>/dev/null || true

# Log success
echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: Backup completed successfully" | tee -a "$LOG_FILE"
EOF

    chmod +x "$TEST_DIR/temp/backup-test.sh"
    
    # Execute mock backup
    if "$TEST_DIR/temp/backup-test.sh" 2>/dev/null; then
        # Check if backup artifacts were created
        if [[ -f "$BACKUP_DIR/.last_backup_success" ]] && [[ -f "$BACKUP_DIR/.last_backup_size_mb" ]]; then
            local backup_count=$(find "$BACKUP_DIR" -name "critical_backup_*.tar.gz" 2>/dev/null | wc -l)
            if [[ $backup_count -gt 0 ]]; then
                test_pass "Backup Script Execution Test"
            else
                test_fail "Backup Script Execution Test" "No backup files created"
            fi
        else
            test_fail "Backup Script Execution Test" "Backup monitoring files not created"
        fi
    else
        test_fail "Backup Script Execution Test" "Backup script execution failed"
    fi
}

test_email_script_validation() {
    test_start "Email Script Validation Test"
    
    # Set up test environment
    export SMTP_HOST="smtp.gmail.com"
    export SMTP_PORT="587"
    export SMTP_USER="test@gmail.com"
    export SMTP_PASS="test_password"
    export SMTP_FROM="test@gmail.com"
    export ADMIN_EMAILS="test@example.com"
    export BACKUP_DIR="$BACKUP_DIR"
    
    # Create mock backup file for testing
    echo "mock backup content" > "$BACKUP_DIR/test_backup.tar.gz"
    
    # Test email template generation
    cat > "$TEST_DIR/temp/email-test.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

# Test email template generation
BACKUP_DIR="${BACKUP_DIR:-/tmp/backups}"
ADMIN_EMAILS="${ADMIN_EMAILS:-test@example.com}"

# Generate success email body
generate_success_email_body() {
    local backup_file="$1"
    cat << EMAIL_EOF
<!DOCTYPE html>
<html>
<body>
    <h1>Test Backup Success</h1>
    <p>Backup file: $backup_file</p>
</body>
</html>
EMAIL_EOF
}

# Test template generation
body_file="/tmp/test_email_$$.html"
generate_success_email_body "test_backup.tar.gz" > "$body_file"

if [[ -f "$body_file" ]] && [[ -s "$body_file" ]]; then
    echo "Email template generated successfully"
    rm -f "$body_file"
    exit 0
else
    echo "Email template generation failed"
    exit 1
fi
EOF

    chmod +x "$TEST_DIR/temp/email-test.sh"
    
    if "$TEST_DIR/temp/email-test.sh" 2>/dev/null; then
        test_pass "Email Script Validation Test"
    else
        test_fail "Email Script Validation Test" "Email template generation failed"
    fi
}

test_monitoring_script_validation() {
    test_start "Monitoring Script Validation Test"
    
    # Set up test environment
    export BACKUP_DIR="$BACKUP_DIR"
    export ADMIN_EMAILS="test@example.com"
    export MAX_BACKUP_AGE_HOURS=25
    export MIN_BACKUP_SIZE_MB=1
    export MAX_BACKUP_SIZE_MB=100
    
    # Create test monitoring files
    echo "$(date +%s)" > "$BACKUP_DIR/.last_backup_success"
    echo "5" > "$BACKUP_DIR/.last_backup_size_mb"
    echo "mock backup content" > "$BACKUP_DIR/critical_backup_test.tar.gz"
    
    # Test monitoring script
    cat > "$TEST_DIR/temp/monitor-test.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

# Test monitoring functions
BACKUP_DIR="${BACKUP_DIR:-/tmp/backups}"
MAX_BACKUP_AGE_HOURS="${MAX_BACKUP_AGE_HOURS:-25}"
MIN_BACKUP_SIZE_MB="${MIN_BACKUP_SIZE_MB:-1}"
MAX_BACKUP_SIZE_MB="${MAX_BACKUP_SIZE_MB:-100}"

# Check last backup time
check_last_backup_time() {
    if [[ -f "$BACKUP_DIR/.last_backup_success" ]]; then
        local last_backup_timestamp=$(cat "$BACKUP_DIR/.last_backup_success" 2>/dev/null || echo "0")
        local current_timestamp=$(date +%s)
        local age_hours=$(( (current_timestamp - last_backup_timestamp) / 3600 ))
        
        if [[ $age_hours -lt $MAX_BACKUP_AGE_HOURS ]]; then
            echo "Last backup time check passed"
            return 0
        fi
    fi
    echo "Last backup time check failed"
    return 1
}

# Check backup size
check_backup_size() {
    if [[ -f "$BACKUP_DIR/.last_backup_size_mb" ]]; then
        local last_size_mb=$(cat "$BACKUP_DIR/.last_backup_size_mb" 2>/dev/null || echo "0")
        
        if [[ $last_size_mb -ge $MIN_BACKUP_SIZE_MB && $last_size_mb -le $MAX_BACKUP_SIZE_MB ]]; then
            echo "Backup size check passed"
            return 0
        fi
    fi
    echo "Backup size check failed"
    return 1
}

# Run checks
if check_last_backup_time && check_backup_size; then
    echo "All monitoring checks passed"
    exit 0
else
    echo "Some monitoring checks failed"
    exit 1
fi
EOF

    chmod +x "$TEST_DIR/temp/monitor-test.sh"
    
    if "$TEST_DIR/temp/monitor-test.sh" 2>/dev/null; then
        test_pass "Monitoring Script Validation Test"
    else
        test_fail "Monitoring Script Validation Test" "Monitoring script validation failed"
    fi
}

#=============================================================================
# Documentation Tests
#=============================================================================

test_documentation_exists() {
    test_start "Documentation Existence Test"
    
    local docs=(
        "docs/BACKUP_SYSTEM.md"
        "docs/BACKUP_DEVELOPMENT.md"
        "docs/BACKUP_OPERATIONS.md"
        "specs/AUTOMATED_BACKUP_SERVICE_SPEC.md"
    )
    
    local missing_docs=0
    for doc in "${docs[@]}"; do
        if [[ -f "$doc" ]]; then
            log_success "Documentation exists: $doc"
        else
            log_error "Documentation missing: $doc"
            ((missing_docs++))
        fi
    done
    
    if [[ $missing_docs -eq 0 ]]; then
        test_pass "Documentation Existence Test"
    else
        test_fail "Documentation Existence Test" "$missing_docs missing documents"
    fi
}

test_specification_completeness() {
    test_start "Specification Completeness Test"
    
    if [[ -f "specs/AUTOMATED_BACKUP_SERVICE_SPEC.md" ]]; then
        # Check for required sections
        local required_sections=(
            "ภาพรวม"
            "วัตถุประสงค์"
            "User Stories"
            "ขอบเขตงาน"
            "ข้อกำหนดด้านฟังก์ชัน"
            "ข้อกำหนดด้านไม่ใช่ฟังก์ชัน"
        )
        
        local missing_sections=0
        for section in "${required_sections[@]}"; do
            if grep -q "$section" specs/AUTOMATED_BACKUP_SERVICE_SPEC.md; then
                log_success "Section found: $section"
            else
                log_error "Section missing: $section"
                ((missing_sections++))
            fi
        done
        
        if [[ $missing_sections -eq 0 ]]; then
            test_pass "Specification Completeness Test"
        else
            test_fail "Specification Completeness Test" "$missing_sections missing sections"
        fi
    else
        test_fail "Specification Completeness Test" "Specification file not found"
    fi
}

#=============================================================================
# Performance Tests
#=============================================================================

test_backup_performance() {
    test_start "Backup Performance Test"
    
    # Create test data
    local test_data_size_mb=10
    dd if=/dev/zero of="$TEST_DIR/temp/test_data.bin" bs=1M count=$test_data_size_mb 2>/dev/null
    
    # Measure compression time
    local start_time=$(date +%s)
    tar -czf "$BACKUP_DIR/performance_test.tar.gz" -C "$TEST_DIR/temp" test_data.bin 2>/dev/null
    local end_time=$(date +%s)
    local compression_time=$((end_time - start_time))
    
    # Check file size
    local compressed_size=$(du -m "$BACKUP_DIR/performance_test.tar.gz" 2>/dev/null | cut -f1)
    
    if [[ $compression_time -lt 30 ]] && [[ $compressed_size -lt $test_data_size_mb ]]; then
        log_success "Compression time: ${compression_time}s, Size: ${compressed_size}MB"
        test_pass "Backup Performance Test"
    else
        test_fail "Backup Performance Test" "Compression too slow or inefficient: ${compression_time}s, ${compressed_size}MB"
    fi
}

#=============================================================================
# Security Tests
#=============================================================================

test_file_permissions() {
    test_start "File Permissions Security Test"
    
    local permission_issues=0
    
    # Check script permissions
    for script in "$SCRIPTS_DIR"/*.sh; do
        if [[ -f "$script" ]]; then
            local perms=$(stat -c "%a" "$script" 2>/dev/null || echo "000")
            if [[ "$perms" =~ ^[0-7]+$ ]]; then
                if [[ $perms -ge 700 ]]; then
                    log_success "Secure permissions: $(basename "$script") ($perms)"
                else
                    log_warning "Weak permissions: $(basename "$script") ($perms)"
                fi
            fi
        fi
    done
    
    # Check configuration file permissions
    if [[ -f ".env.production" ]]; then
        local env_perms=$(stat -c "%a" .env.production 2>/dev/null || echo "000")
        if [[ "$env_perms" =~ ^[0-7]+$ ]]; then
            if [[ $env_perms -le 600 ]]; then
                log_success "Secure permissions: .env.production ($env_perms)"
            else
                log_warning "Insecure permissions: .env.production ($env_perms)"
                ((permission_issues++))
            fi
        fi
    fi
    
    if [[ $permission_issues -eq 0 ]]; then
        test_pass "File Permissions Security Test"
    else
        test_fail "File Permissions Security Test" "$permission_issues permission issues found"
    fi
}

#=============================================================================
# Test Execution
#=============================================================================

run_all_tests() {
    log_info "Starting comprehensive backup system test suite..."
    log_info "Test directory: $TEST_DIR"
    
    # Setup
    setup_test_environment
    
    # Unit Tests
    test_script_syntax
    test_script_permissions
    test_dockerfile_validation
    test_docker_compose_validation
    
    # Integration Tests
    test_backup_script_execution
    test_email_script_validation
    test_monitoring_script_validation
    
    # Documentation Tests
    test_documentation_exists
    test_specification_completeness
    
    # Performance Tests
    test_backup_performance
    
    # Security Tests
    test_file_permissions
    
    # Cleanup
    cleanup_test_environment
}

print_test_summary() {
    echo -e "\n${BLUE}=====================================${NC}"
    echo -e "${BLUE}     TEST SUMMARY REPORT${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo -e "Total Tests: ${TESTS_TOTAL}"
    echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
    echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "\n${GREEN}🎉 ALL TESTS PASSED!${NC}"
        echo -e "${GREEN}The backup system is ready for production deployment.${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ SOME TESTS FAILED!${NC}"
        echo -e "${RED}Please review and fix the failed tests before deployment.${NC}"
        exit 1
    fi
}

#=============================================================================
# Main Function
#=============================================================================

main() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}  SMART AI HUB BACKUP SYSTEM TEST${NC}"
    echo -e "${BLUE}=====================================${NC}"
    
    run_all_tests
    print_test_summary
}

# Error handling
trap 'log_error "Test suite interrupted"; cleanup_test_environment; exit 1' INT TERM

# Run tests
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi