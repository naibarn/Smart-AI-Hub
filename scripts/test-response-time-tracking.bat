@echo off
REM Response Time Tracking Test Script for Windows
REM This script tests the response time tracking implementation with realistic load

setlocal enabledelayedexpansion

REM Configuration
set API_BASE_URL=%API_BASE_URL%:http://localhost:3000
set AUTH_SERVICE_URL=%AUTH_SERVICE_URL%:http://localhost:3001
set CORE_SERVICE_URL=%CORE_SERVICE_URL%:http://localhost:3002
set MCP_SERVICE_URL=%MCP_SERVICE_URL%:http://localhost:3003
set WEBHOOK_SERVICE_URL=%WEBHOOK_SERVICE_URL%:http://localhost:3005

REM Test credentials
set TEST_EMAIL=test@example.com
set TEST_PASSWORD=testpassword123
set TEST_TOKEN=

REM Helper functions
:log_info
echo [INFO] %~1
goto :eof

:log_warn
echo [WARN] %~1
goto :eof

:log_error
echo [ERROR] %~1
goto :eof

REM Function to check if service is healthy
:check_service_health
set url=%~1
set service_name=%~2

call :log_info "Checking %service_name% health..."

curl -f -s "%url%/health" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_info "%service_name% is healthy"
    exit /b 0
) else (
    call :log_error "%service_name% is not responding"
    exit /b 1
)

REM Function to check response time header
:check_response_time_header
set url=%~1
set endpoint_name=%~2

call :log_info "Testing response time header for %endpoint_name%..."

for /f "delims=" %%i in ('curl -s -I "%url%" ^| findstr /i "x-response-time"') do set response_time_header=%%i

if defined response_time_header (
    call :log_info "%endpoint_name% includes response time header: !response_time_header!"
    exit /b 0
) else (
    call :log_error "%endpoint_name% missing response time header"
    exit /b 1
)

REM Function to register a test user
:register_test_user
call :log_info "Registering test user..."

curl -s -X POST "%AUTH_SERVICE_URL%/api/v1/auth/register" ^
    -H "Content-Type: application/json" ^
    -d "{\"email\": \"%TEST_EMAIL%\", \"password\": \"%TEST_PASSWORD%\", \"firstName\": \"Test\", \"lastName\": \"User\"}" > temp_response.json

findstr /c:"token" temp_response.json >nul
if %errorlevel% equ 0 (
    REM Extract token from response (simplified)
    for /f "tokens=2 delims=:\"" %%i in ('findstr /c:"token" temp_response.json') do set TEST_TOKEN=%%i
    call :log_info "Test user registered successfully"
    del temp_response.json
    exit /b 0
) else (
    REM User might already exist, try to login
    del temp_response.json
    call :login_test_user
    exit /b
)

REM Function to login test user
:login_test_user
call :log_info "Logging in test user..."

curl -s -X POST "%AUTH_SERVICE_URL%/api/v1/auth/login" ^
    -H "Content-Type: application/json" ^
    -d "{\"email\": \"%TEST_EMAIL%\", \"password\": \"%TEST_PASSWORD%\"}" > temp_response.json

findstr /c:"token" temp_response.json >nul
if %errorlevel% equ 0 (
    REM Extract token from response (simplified)
    for /f "tokens=2 delims=:\"" %%i in ('findstr /c:"token" temp_response.json') do set TEST_TOKEN=%%i
    call :log_info "Test user logged in successfully"
    del temp_response.json
    exit /b 0
) else (
    call :log_error "Failed to login test user"
    del temp_response.json
    exit /b 1
)

REM Function to test endpoint load
:test_endpoint_load
set url=%~1
set endpoint_name=%~2
set requests=%~3
if "%requests%"=="" set requests=10
set concurrency=%~4
if "%concurrency%"=="" set concurrency=2

call :log_info "Testing %endpoint_name% with %requests% requests (concurrency: %concurrency%)..."

REM Create a temporary file to store results
set temp_file=%TEMP%\response_times_%RANDOM%.txt

REM Run load test (simplified for Windows batch)
for /l %%i in (1,1,%requests%) do (
    start /b curl -s -w "%%{time_total}" -o nul "%url%"
    
    REM Control concurrency (simplified)
    set /a mod_value=%%i %% %concurrency%
    if !mod_value! equ 0 timeout /t 1 >nul
)

REM Wait for all processes to complete
timeout /t 5 >nul

call :log_info "%endpoint_name% load test completed"

REM Clean up
if exist "%temp_file%" del "%temp_file%"

exit /b 0

REM Function to test metrics endpoint
:test_metrics_endpoint
set url=%~1
set service_name=%~2

call :log_info "Testing metrics endpoint for %service_name%..."

curl -s "%url%/metrics" | findstr /c:"http_response_time_milliseconds" >nul
if %errorlevel% equ 0 (
    call :log_info "%service_name% metrics endpoint includes response time metrics"
    exit /b 0
) else (
    call :log_error "%service_name% metrics endpoint missing response time metrics"
    exit /b 1
)

REM Function to test monitoring API endpoints
:test_monitoring_api
call :log_info "Testing monitoring API endpoints..."

REM Test overview endpoint
curl -s -H "Authorization: Bearer %TEST_TOKEN%" "%CORE_SERVICE_URL%/api/v1/monitoring/response-time/overview" | findstr /c:"averageResponseTime" >nul
if %errorlevel% equ 0 (
    call :log_info "Overview API endpoint working"
) else (
    call :log_error "Overview API endpoint not working"
    exit /b 1
)

REM Test endpoints endpoint
curl -s -H "Authorization: Bearer %TEST_TOKEN%" "%CORE_SERVICE_URL%/api/v1/monitoring/response-time/endpoints" | findstr /c:"endpoints" >nul
if %errorlevel% equ 0 (
    call :log_info "Endpoints API endpoint working"
) else (
    call :log_error "Endpoints API endpoint not working"
    exit /b 1
)

REM Test trends endpoint
curl -s -H "Authorization: Bearer %TEST_TOKEN%" "%CORE_SERVICE_URL%/api/v1/monitoring/response-time/trends" | findstr /c:"trends" >nul
if %errorlevel% equ 0 (
    call :log_info "Trends API endpoint working"
) else (
    call :log_error "Trends API endpoint not working"
    exit /b 1
)

exit /b 0

REM Function to test Grafana dashboard
:test_grafana_dashboard
call :log_info "Testing Grafana dashboard..."

REM Check if Grafana is accessible
curl -f -s "http://localhost:3001/api/health" >nul
if %errorlevel% equ 0 (
    call :log_info "Grafana is accessible"
    
    REM Check if dashboard exists
    curl -s -u admin:admin123 "http://localhost:3001/api/dashboards/uid/smart-ai-hub-response-time" | findstr /c:"smart-ai-hub-response-time" >nul
    if %errorlevel% equ 0 (
        call :log_info "Response time dashboard exists in Grafana"
        exit /b 0
    ) else (
        call :log_error "Response time dashboard not found in Grafana"
        exit /b 1
    )
) else (
    call :log_error "Grafana is not accessible"
    exit /b 1
)

REM Function to generate realistic load
:generate_realistic_load
call :log_info "Generating realistic load pattern..."

REM Test various endpoints with different load patterns
call :test_endpoint_load "%AUTH_SERVICE_URL%/api/v1/auth/login" "Login endpoint" 50 5
call :test_endpoint_load "%CORE_SERVICE_URL%/api/v1/users/profile" "Profile endpoint" 30 3
call :test_endpoint_load "%CORE_SERVICE_URL%/api/v1/analytics/usage" "Analytics endpoint" 20 2

REM Test some endpoints that might be slower
call :test_endpoint_load "%CORE_SERVICE_URL%/api/v1/analytics/reports" "Reports endpoint" 10 1

call :log_info "Realistic load test completed"
exit /b 0

REM Main test execution
:main
echo [INFO] Starting Response Time Tracking Implementation Test
echo [INFO] ================================================

REM Check if all services are healthy
call :check_service_health "%AUTH_SERVICE_URL%" "Auth Service"
call :check_service_health "%CORE_SERVICE_URL%" "Core Service"
call :check_service_health "%MCP_SERVICE_URL%" "MCP Service"
call :check_service_health "%WEBHOOK_SERVICE_URL%" "Webhook Service"

REM Check response time headers
call :check_response_time_header "%AUTH_SERVICE_URL%/api/v1/auth/login" "Auth Service"
call :check_response_time_header "%CORE_SERVICE_URL%/api/v1/users/profile" "Core Service"
call :check_response_time_header "%MCP_SERVICE_URL%/api/v1/mcp/status" "MCP Service"

REM Register/login test user
call :register_test_user

REM Test metrics endpoints
call :test_metrics_endpoint "%AUTH_SERVICE_URL%" "Auth Service"
call :test_metrics_endpoint "%CORE_SERVICE_URL%" "Core Service"
call :test_metrics_endpoint "%MCP_SERVICE_URL%" "MCP Service"
call :test_metrics_endpoint "%WEBHOOK_SERVICE_URL%" "Webhook Service"

REM Test monitoring API
call :test_monitoring_api

REM Test Grafana dashboard
call :test_grafana_dashboard

REM Generate realistic load
call :generate_realistic_load

echo [INFO] ================================================
echo [INFO] Response Time Tracking Implementation Test Complete
echo [INFO] 
echo [INFO] Next steps:
echo [INFO] 1. Check the Grafana dashboard at http://localhost:3001/d/smart-ai-hub-response-time
echo [INFO] 2. Check the UI dashboard at http://localhost:3000/admin/monitoring/response-time
echo [INFO] 3. Monitor Prometheus alerts at http://localhost:9090/alerts
echo [INFO] 4. Review the performance metrics after a few minutes of data collection

goto :eof

REM Run the main function
call :main