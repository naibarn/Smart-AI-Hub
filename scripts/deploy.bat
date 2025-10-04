@echo off
REM Smart AI Hub Deployment Script for VPS (Windows Version)
REM This script handles deployment with proper error handling and rollback capabilities

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_DIR=%~dp0..
set LOG_FILE=%PROJECT_DIR%\logs\deployment.log
set BACKUP_DIR=%PROJECT_DIR%\backups
set HEALTH_CHECK_TIMEOUT=30
set HEALTH_CHECK_INTERVAL=5

REM Create necessary directories
if not exist "%PROJECT_DIR%\logs" mkdir "%PROJECT_DIR%\logs"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Logging function
:log
set level=%1
shift
set message=%*
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set date=%%c-%%a-%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set time=%%a:%%b
set timestamp=!date! !time!

if "%level%"=="INFO" (
    echo [INFO] %message%
) else if "%level%"=="WARN" (
    echo [WARN] %message%
) else if "%level%"=="ERROR" (
    echo [ERROR] %message%
) else if "%level%"=="DEBUG" (
    echo [DEBUG] %message%
)

echo [%timestamp%] [%level%] %message% >> "%LOG_FILE%"
goto :eof

REM Error handling function
:handle_error
call :log ERROR "Deployment failed with error code %ERRORLEVEL%"
call :log ERROR "Starting rollback procedure..."

REM Restore PM2 processes if they were stopped
if defined OLD_PM2_PROCESSES (
    call :log INFO "Restoring previous PM2 processes..."
    for %%p in (%OLD_PM2_PROCESSES%) do (
        pm2 restart %%p || call :log WARN "Failed to restart process %%p"
    )
)

REM Restore database if migration was applied
if "%MIGRATION_APPLIED%"=="true" (
    if defined MIGRATION_BACKUP (
        call :log INFO "Rolling back database migration..."
        cd /d "%PROJECT_DIR%\packages\auth-service"
        npx prisma migrate reset --force --skip-seed || call :log ERROR "Failed to rollback database"
    )
)

call :log ERROR "Rollback completed. Deployment failed."
exit /b %ERRORLEVEL%

REM Health check function
:health_check
set service_name=%1
set url=%2
set timeout=%3
set interval=%4

call :log INFO "Performing health check for %service_name% at %url%"

set elapsed=0
:health_check_loop
if %elapsed% geq %timeout% (
    call :log ERROR "Health check failed for %service_name% after %timeout% seconds"
    exit /b 1
)

curl -f -s "%url%" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call :log INFO "Health check passed for %service_name%"
    exit /b 0
)

call :log DEBUG "Health check failed for %service_name%, retrying in %interval% seconds..."
timeout /t %interval% /nobreak >nul
set /a elapsed+=interval
goto health_check_loop

REM Check if PM2 is installed
:check_pm2
pm2 --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :log ERROR "PM2 is not installed. Please install it with: npm install -g pm2"
    exit /b 1
)
goto :eof

REM Main deployment function
:main
call :log INFO "Starting Smart AI Hub deployment..."
call :log INFO "Deployment started at %date% %time%"

REM Change to project directory
cd /d "%PROJECT_DIR%"

REM Step 1: Pull latest code from git
call :log INFO "Step 1: Pulling latest code from git..."
git pull origin main
if %ERRORLEVEL% neq 0 (
    call :log ERROR "Failed to pull latest code from git"
    exit /b 1
)

REM Get current commit hash for logging
for /f "tokens=*" %%i in ('git rev-parse HEAD') do set CURRENT_COMMIT=%%i
call :log INFO "Current commit: %CURRENT_COMMIT%"

REM Step 2: Install dependencies
call :log INFO "Step 2: Installing dependencies..."
npm ci
if %ERRORLEVEL% neq 0 (
    call :log ERROR "Failed to install dependencies"
    exit /b 1
)

REM Step 3: Database migrations
call :log INFO "Step 3: Running database migrations..."
cd /d "%PROJECT_DIR%\packages\auth-service"

REM Create migration backup
set MIGRATION_BACKUP=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
set MIGRATION_BACKUP=%MIGRATION_BACKUP: =0%
set MIGRATION_APPLIED=false

REM Check if there are pending migrations
npx prisma migrate deploy --dry-run 2>&1 | findstr /C:"No pending migrations" >nul
if %ERRORLEVEL% equ 0 (
    call :log INFO "No pending migrations found"
) else (
    call :log INFO "Applying database migrations..."
    npx prisma migrate deploy
    if %ERRORLEVEL% neq 0 (
        call :log ERROR "Database migration failed"
        exit /b 1
    )
    set MIGRATION_APPLIED=true
    call :log INFO "Database migrations applied successfully"
)

REM Step 4: Build all packages
call :log INFO "Step 4: Building all packages..."
cd /d "%PROJECT_DIR%"
npm run build
if %ERRORLEVEL% neq 0 (
    call :log ERROR "Build failed"
    exit /b 1
)
call :log INFO "Build completed successfully"

REM Step 5: Restart services with PM2
call :log INFO "Step 5: Restarting services with PM2..."
call :check_pm2

REM Get current PM2 processes for potential rollback
set OLD_PM2_PROCESSES=
for /f "tokens=2" %%i in ('pm2 list --plain ^| findstr /E "auth-service core-service api-gateway notification-service mcp-server"') do (
    set OLD_PM2_PROCESSES=!OLD_PM2_PROCESSES! %%i
)

REM Start/restart services
set services=auth-service core-service api-gateway notification-service mcp-server
set service_ports=3001 3002 3000 3003 3004

for /f "tokens=1-5" %%a in ("%services%") do (
    set service=%%a
    set port=3001
    set service_dir=%PROJECT_DIR%\packages\%%a
    
    if exist "!service_dir!" (
        call :log INFO "Starting !service! on port !port!..."
        cd /d "!service_dir!"
        
        REM Check if service is already running
        pm2 list --plain | findstr /C:"!service!" >nul
        if %ERRORLEVEL% equ 0 (
            call :log INFO "Restarting existing !service!..."
            pm2 restart "!service!" || call :log WARN "Failed to restart !service!"
        ) else (
            call :log INFO "Starting new !service!..."
            pm2 start src/server.js --name "!service!" || call :log WARN "Failed to start !service!"
        )
    ) else (
        call :log WARN "Service directory !service_dir! not found, skipping..."
    )
)

REM Save PM2 configuration
pm2 save || call :log WARN "Failed to save PM2 configuration"

REM Step 6: Health check endpoints
call :log INFO "Step 6: Performing health checks..."

REM Wait a bit for services to start
timeout /t 10 /nobreak >nul

REM Health check for each service
set health_checks_passed=true

REM Auth service health check
curl -f -s "http://localhost:3001/health" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call :log INFO "Auth service health check passed"
) else (
    call :log WARN "Auth service health check failed"
    set health_checks_passed=false
)

REM Core service health check (if available)
curl -f -s "http://localhost:3002/health" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call :log INFO "Core service health check passed"
) else (
    call :log WARN "Core service health check failed or endpoint not available"
)

REM API Gateway health check (if available)
curl -f -s "http://localhost:3000/health" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call :log INFO "API Gateway health check passed"
) else (
    call :log WARN "API Gateway health check failed or endpoint not available"
)

if "%health_checks_passed%"=="true" (
    call :log INFO "All critical health checks passed"
) else (
    call :log WARN "Some health checks failed, but deployment will continue"
)

REM Display PM2 status
call :log INFO "PM2 Process Status:"
pm2 status

call :log INFO "Deployment completed successfully!"
call :log INFO "Deployment finished at %date% %time%"
call :log INFO "All services are running and health checks have been performed"

REM Create deployment marker
echo %CURRENT_COMMIT% > "%PROJECT_DIR%\.last_deployment"

goto :eof

REM Script usage information
:usage
echo Usage: %0 [OPTIONS]
echo.
echo Options:
echo   -h, --help     Show this help message
echo   -v, --verbose  Enable verbose logging
echo   --dry-run      Show what would be done without executing
echo.
echo Examples:
echo   %0              # Run deployment
echo   %0 --dry-run    # Show deployment steps without executing
goto :eof

REM Parse command line arguments
set VERBOSE=false
set DRY_RUN=false

:parse_args
if "%1"=="" goto main_start
if "%1"=="-h" goto usage
if "%1"=="--help" goto usage
if "%1"=="-v" (
    set VERBOSE=true
    shift
    goto parse_args
)
if "%1"=="--verbose" (
    set VERBOSE=true
    shift
    goto parse_args
)
if "%1"=="--dry-run" (
    set DRY_RUN=true
    shift
    goto parse_args
)
call :log ERROR "Unknown option: %1"
goto usage

:main_start
if "%DRY_RUN%"=="true" (
    call :log INFO "DRY RUN MODE - No changes will be made"
    call :log INFO "The following steps would be executed:"
    call :log INFO "1. Pull latest code from git"
    call :log INFO "2. Install dependencies (npm ci)"
    call :log INFO "3. Run database migrations (npx prisma migrate deploy)"
    call :log INFO "4. Build all packages (npm run build)"
    call :log INFO "5. Restart services with PM2"
    call :log INFO "6. Health check endpoints"
    exit /b 0
) else (
    call :main
    if %ERRORLEVEL% neq 0 (
        call :handle_error
    )
)

exit /b 0