@echo off
setlocal enabledelayedexpansion

REM Security Headers Test Script for Smart AI Hub (Windows Version)
REM Tests all security headers implementation and CSP functionality

REM Default settings
set BASE_URL=http://localhost:3000
set FRONTEND_URL=http://localhost:5173
set VERBOSE=false
set SKIP_EXTERNAL=false

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :main
if "%~1"=="--base-url" (
    set BASE_URL=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--frontend-url" (
    set FRONTEND_URL=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--verbose" (
    set VERBOSE=true
    shift
    goto :parse_args
)
if "%~1"=="-v" (
    set VERBOSE=true
    shift
    goto :parse_args
)
if "%~1"=="--skip-external" (
    set SKIP_EXTERNAL=true
    shift
    goto :parse_args
)
if "%~1"=="--help" goto :help
if "%~1"=="-h" goto :help
echo Unknown option: %~1
exit /b 1

:help
echo Usage: %0 [options]
echo Options:
echo   --base-url URL       Base URL for API testing (default: http://localhost:3000)
echo   --frontend-url URL   Frontend URL for testing (default: http://localhost:5173)
echo   --verbose, -v        Enable verbose output
echo   --skip-external      Skip external security testing services
echo   --help, -h           Show this help message
exit /b 0

REM Test results counters
set /a TESTS_PASSED=0
set /a TESTS_FAILED=0
set /a TESTS_TOTAL=0

REM Helper functions
:log_info
echo [INFO] %~1
goto :eof

:log_success
echo [PASS] %~1
set /a TESTS_PASSED+=1
goto :eof

:log_error
echo [FAIL] %~1
set /a TESTS_FAILED+=1
goto :eof

:log_warning
echo [WARN] %~1
goto :eof

:log_test
echo [TEST] %~1
set /a TESTS_TOTAL+=1
goto :eof

REM Function to test HTTP response headers
:test_headers
set url=%~1
set service_name=%~2

call :log_info "Testing security headers for !service_name! at !url!"

REM Get response headers to temp file
curl -s -I -L "!url!" > temp_headers.txt 2>nul
if %errorlevel% neq 0 (
    call :log_error "Failed to connect to !url!"
    goto :eof
)

if "!VERBOSE!"=="true" (
    echo Response headers:
    type temp_headers.txt
    echo.
)

REM Test each required security header
call :log_test "X-Content-Type-Options header"
findstr /i "X-Content-Type-Options:" temp_headers.txt >nul
if %errorlevel% equ 0 (
    for /f "tokens=2*" %%a in ('findstr /i "X-Content-Type-Options:" temp_headers.txt') do (
        set header_value=%%a %%b
        call :log_success "X-Content-Type-Options header is present: !header_value!"
    )
) else (
    call :log_error "X-Content-Type-Options header is missing"
)

call :log_test "X-Frame-Options header"
findstr /i "X-Frame-Options:" temp_headers.txt >nul
if %errorlevel% equ 0 (
    for /f "tokens=2*" %%a in ('findstr /i "X-Frame-Options:" temp_headers.txt') do (
        set header_value=%%a %%b
        call :log_success "X-Frame-Options header is present: !header_value!"
    )
) else (
    call :log_error "X-Frame-Options header is missing"
)

call :log_test "X-XSS-Protection header"
findstr /i "X-XSS-Protection:" temp_headers.txt >nul
if %errorlevel% equ 0 (
    for /f "tokens=2*" %%a in ('findstr /i "X-XSS-Protection:" temp_headers.txt') do (
        set header_value=%%a %%b
        call :log_success "X-XSS-Protection header is present: !header_value!"
    )
) else (
    call :log_error "X-XSS-Protection header is missing"
)

call :log_test "Referrer-Policy header"
findstr /i "Referrer-Policy:" temp_headers.txt >nul
if %errorlevel% equ 0 (
    for /f "tokens=2*" %%a in ('findstr /i "Referrer-Policy:" temp_headers.txt') do (
        set header_value=%%a %%b
        call :log_success "Referrer-Policy header is present: !header_value!"
    )
) else (
    call :log_error "Referrer-Policy header is missing"
)

call :log_test "Content-Security-Policy header"
findstr /i "Content-Security-Policy:" temp_headers.txt >nul
if %errorlevel% equ 0 (
    for /f "tokens=2*" %%a in ('findstr /i "Content-Security-Policy:" temp_headers.txt') do (
        set csp_value=%%a %%b
        call :log_success "CSP header is present: !csp_value!"
        
        REM Check CSP directives
        echo !csp_value! | findstr /i "default-src" >nul
        if !errorlevel! equ 0 (
            call :log_success "CSP contains default-src directive"
        ) else (
            call :log_error "CSP missing default-src directive"
        )
        
        echo !csp_value! | findstr /i "script-src" >nul
        if !errorlevel! equ 0 (
            call :log_success "CSP contains script-src directive"
        ) else (
            call :log_error "CSP missing script-src directive"
        )
        
        echo !csp_value! | findstr /i "report-uri\|report-to" >nul
        if !errorlevel! equ 0 (
            call :log_success "CSP contains reporting directive"
        ) else (
            call :log_warning "CSP missing reporting directive"
        )
    )
) else (
    call :log_error "Content-Security-Policy header is missing"
)

REM Clean up temp file
del temp_headers.txt >nul 2>&1
echo.
goto :eof

REM Function to test CSP violation reporting
:test_csp_reporting
set api_url=%~1

call :log_info "Testing CSP violation reporting"

REM Create a test CSP violation report
echo { > temp_violation.json
echo   "csp-report": { >> temp_violation.json
echo     "document-uri": "!FRONTEND_URL!", >> temp_violation.json
echo     "referrer": "!FRONTEND_URL!", >> temp_violation.json
echo     "violated-directive": "script-src", >> temp_violation.json
echo     "effective-directive": "script-src", >> temp_violation.json
echo     "original-policy": "default-src \"self\"; script-src \"self\"", >> temp_violation.json
echo     "disposition": "report", >> temp_violation.json
echo     "blocked-uri": "https://evil.com/bad.js", >> temp_violation.json
echo     "line-number": 1, >> temp_violation.json
echo     "column-number": 1, >> temp_violation.json
echo     "source-file": "!FRONTEND_URL!", >> temp_violation.json
echo     "status-code": 200, >> temp_violation.json
echo     "script-sample": "console.log(\"test\");" >> temp_violation.json
echo   } >> temp_violation.json
echo } >> temp_violation.json

REM Send violation report
curl -s -X POST -H "Content-Type: application/csp-report" -d @temp_violation.json "!api_url!/api/v1/security/csp-report" > response.txt 2>nul
if %errorlevel% equ 0 (
    findstr /i "success\|received\|processed" response.txt >nul
    if !errorlevel! equ 0 (
        call :log_success "CSP violation reporting endpoint is working"
    ) else (
        call :log_warning "CSP violation reporting endpoint responded unexpectedly"
        type response.txt
    )
) else (
    call :log_error "CSP violation reporting endpoint is not accessible"
)

REM Clean up temp files
del temp_violation.json >nul 2>&1
del response.txt >nul 2>&1
echo.
goto :eof

REM Function to test security status endpoint
:test_security_status
set api_url=%~1

call :log_info "Testing security status endpoint"

curl -s "!api_url!/api/v1/security/status" > status_response.txt 2>nul
if %errorlevel% equ 0 (
    findstr /i "headers\|score\|violations" status_response.txt >nul
    if !errorlevel! equ 0 (
        call :log_success "Security status endpoint is working"
        
        if "!VERBOSE!"=="true" (
            echo Security status response:
            type status_response.txt
        )
    ) else (
        call :log_error "Security status endpoint returned unexpected response"
        type status_response.txt
    )
) else (
    call :log_error "Security status endpoint is not accessible"
)

REM Clean up temp file
del status_response.txt >nul 2>&1
echo.
goto :eof

REM Function to test browser compatibility
:test_browser_compatibility
set test_url=%~1

call :log_info "Testing browser compatibility"

call :log_test "Testing basic page load"

curl -s -o nul -w "%%{http_code}" -L "!test_url!" > http_code.txt 2>nul
set /p http_code=<http_code.txt

if "!http_code!"=="200" (
    call :log_success "Page loads successfully (HTTP !http_code!)"
) else (
    call :log_error "Page failed to load (HTTP !http_code!)"
)

REM Clean up temp file
del http_code.txt >nul 2>&1
echo.
goto :eof

REM Function to generate test report
:generate_report
echo.
echo ======================================
echo SECURITY HEADERS TEST REPORT
echo ======================================
echo Total tests: !TESTS_TOTAL!
echo Passed: !TESTS_PASSED!
echo Failed: !TESTS_FAILED!
echo.

if !TESTS_FAILED! equ 0 (
    echo ✓ All security headers tests passed!
    echo.
    echo Next steps:
    echo 1. Test with external services ^(securityheaders.com, Mozilla Observatory^)
    echo 2. Verify CSP violations are being reported correctly
    echo 3. Test in different browsers
    exit /b 0
) else (
    echo ✗ Some security headers tests failed!
    echo.
    echo Please review the failed tests and fix the issues.
    exit /b 1
)

REM Main execution
:main
echo ======================================
echo SECURITY HEADERS TEST SCRIPT
echo ======================================
echo Testing URL: !BASE_URL!
echo Frontend URL: !FRONTEND_URL!
echo Verbose: !VERBOSE!
echo Skip External: !SKIP_EXTERNAL!
echo.

REM Check if curl is available
curl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: curl is required but not installed.
    echo Please install curl or use Git Bash which includes curl.
    exit /b 1
)

REM Test API services
call :test_headers "!BASE_URL!/api/health" "Auth Service API"
call :test_headers "!BASE_URL!/core/health" "Core Service API"
call :test_headers "!BASE_URL!/mcp/health" "MCP Server API"
call :test_headers "!BASE_URL!/webhook/health" "Webhook Service API"
call :test_headers "!BASE_URL!/analytics/health" "Analytics Service API"

REM Test frontend
call :test_headers "!FRONTEND_URL!" "Frontend"

REM Test CSP functionality
call :test_csp_reporting "!BASE_URL!"
call :test_security_status "!BASE_URL!"

REM Test browser compatibility
call :test_browser_compatibility "!FRONTEND_URL!"

REM Test with external services
if "!SKIP_EXTERNAL!"=="false" (
    call :log_info "Testing with external security services ^(this may take a while^)..."
    call :log_test "Testing with securityheaders.com"
    echo To test with securityheaders.com:
    echo   1. Visit https://securityheaders.com/
    echo   2. Enter your URL: !FRONTEND_URL!
    echo   3. Expected result: A+ rating
    echo.
    
    call :log_test "Testing with Mozilla Observatory"
    echo To test with Mozilla Observatory:
    echo   1. Visit https://observatory.mozilla.org/
    echo   2. Enter your URL: !FRONTEND_URL!
    echo   3. Expected result: 90+ score
    echo.
    
    if "!FRONTEND_URL:~0,5!"=="https" (
        call :log_test "Testing with SSL Labs"
        echo To test SSL configuration with SSL Labs:
        echo   1. Visit https://www.ssllabs.com/ssltest/
        echo   2. Enter your domain
        echo   3. Expected result: A+ rating
        echo.
    )
) else (
    call :log_info "Skipping external security services testing"
)

REM Generate final report
call :generate_report