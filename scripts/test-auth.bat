@echo off
REM สคริปต์ทดสอบ Authentication Flow สำหรับ Windows
REM สำหรับทดสอบการทำงานของระบบ Authentication ของ Smart AI Hub

setlocal enabledelayedexpansion

REM กำหนดค่า Base URL ของ Auth Service
set BASE_URL=http://localhost:3001
set API_BASE=%BASE_URL%/api/auth

REM สร้างตัวแปรสำหรับเก็บข้อมูล
set USER_EMAIL=testuser%random%@example.com
set USER_PASSWORD=TestPassword123!
set ACCESS_TOKEN=
set REFRESH_TOKEN=

echo ========================================
echo 🧪 ทดสอบ Authentication Flow
echo ========================================

REM ตรวจสอบว่า curl ติดตั้งอยู่หรือไม่
curl --version >nul 2>&1
if errorlevel 1 (
    echo ❌ curl ไม่ได้ติดตั้งอยู่ กรุณาติดตั้งก่อนใช้งานสคริปต์นี้
    exit /b 1
)

REM ฟังก์ชันสำหรับตรวจสอบว่า Auth Service ทำงานอยู่หรือไม่
echo.
echo 🔄 ตรวจสอบสถานะ Auth Service...
curl -s "%BASE_URL%/health" > temp_response.txt
set /p response=<temp_response.txt

echo %response% | findstr "running" >nul
if errorlevel 1 (
    echo ❌ Auth Service ไม่สามารถเข้าถึงได้
    echo ℹ️  กรุณาตรวจสอบว่า Auth Service กำลังทำงานอยู่ที่ %BASE_URL%
    echo Response: %response%
    del temp_response.txt
    exit /b 1
) else (
    echo ✅ Auth Service ทำงานอยู่
    echo Response: %response%
)
del temp_response.txt

REM ฟังก์ชันสำหรับ Register ผู้ใช้ใหม่
echo.
echo 🔄 1. Register ผู้ใช้ใหม่
curl -s -X POST "%API_BASE%/register" ^
-H "Content-Type: application/json" ^
-d "{\"email\": \"%USER_EMAIL%\", \"password\": \"%USER_PASSWORD%\"}" > temp_response.txt
set /p response=<temp_response.txt

echo %response% | findstr /C:"success" | findstr /C:"true" >nul
if errorlevel 1 echo %response% | findstr /C:"Registration successful" >nul
if errorlevel 1 (
    echo ❌ Register ล้มเหลว
    echo Response: %response%
    del temp_response.txt
    exit /b 1
) else (
    echo ✅ Register สำเร็จ
    echo Response: %response%
    echo ℹ️  Email: %USER_EMAIL%
    
    REM ดึง tokens จาก response (ใช้วิธีที่ซับซ้อนกว่าสำหรับ Windows batch)
    for /f "delims=" %%a in ('echo %response% ^| findstr /C:"token":"') do set line=%%a
    for /f "tokens=2 delims=:" %%a in ("!line!") do set temp_token=%%a
    set ACCESS_TOKEN=!temp_token:~1,-1!
    
    for /f "delims=" %%a in ('echo %response% ^| findstr /C:"refreshToken":"') do set line=%%a
    for /f "tokens=2 delims=:" %%a in ("!line!") do set temp_token=%%a
    set REFRESH_TOKEN=!temp_token:~1,-1!
)
del temp_response.txt

REM ฟังก์ชันสำหรับ Login
echo.
echo 🔄 2. Login และเก็บ tokens
curl -s -X POST "%API_BASE%/login" ^
-H "Content-Type: application/json" ^
-d "{\"email\": \"%USER_EMAIL%\", \"password\": \"%USER_PASSWORD%\"}" > temp_response.txt
set /p response=<temp_response.txt

echo %response% | findstr /C:"success" | findstr /C:"true" >nul
if errorlevel 1 echo %response% | findstr /C:"Login successful" >nul
if errorlevel 1 (
    echo ❌ Login ล้มเหลว
    echo Response: %response%
    del temp_response.txt
    exit /b 1
) else (
    echo ✅ Login สำเร็จ
    echo Response: %response%
    
    REM ดึง tokens จาก response
    for /f "delims=" %%a in ('echo %response% ^| findstr /C:"accessToken":"') do set line=%%a
    for /f "tokens=2 delims=:" %%a in ("!line!") do set temp_token=%%a
    set ACCESS_TOKEN=!temp_token:~1,-1!
    
    for /f "delims=" %%a in ('echo %response% ^| findstr /C:"refreshToken":"') do set line=%%a
    for /f "tokens=2 delims=:" %%a in ("!line!") do set temp_token=%%a
    set REFRESH_TOKEN=!temp_token:~1,-1!
    
    echo ℹ️  Access Token: !ACCESS_TOKEN:~0,20!...
    echo ℹ️  Refresh Token: !REFRESH_TOKEN:~0,20!...
)
del temp_response.txt

REM ฟังก์ชันสำหรับเรียก Protected Endpoint
echo.
echo 🔄 3. เรียก Protected Endpoint ด้วย Access Token
curl -s -X GET "%API_BASE%/me" ^
-H "Authorization: Bearer !ACCESS_TOKEN!" > temp_response.txt
set /p response=<temp_response.txt

echo %response% | findstr /C:"success" | findstr /C:"true" >nul
if errorlevel 1 (
    echo ❌ เรียก Protected Endpoint ล้มเหลว
    echo Response: %response%
    del temp_response.txt
    exit /b 1
) else (
    echo ✅ เรียก Protected Endpoint สำเร็จ
    echo Response: %response%
)
del temp_response.txt

REM ฟังก์ชันสำหรับ Refresh Access Token
echo.
echo 🔄 4. Refresh Access Token
curl -s -X POST "%API_BASE%/refresh" ^
-H "Content-Type: application/json" ^
-d "{\"refreshToken\": \"!REFRESH_TOKEN!\"}" > temp_response.txt
set /p response=<temp_response.txt

echo %response% | findstr /C:"success" | findstr /C:"true" >nul
if errorlevel 1 echo %response% | findstr /C:"Token refreshed successfully" >nul
if errorlevel 1 (
    echo ❌ Refresh Token ล้มเหลว
    echo Response: %response%
    del temp_response.txt
    exit /b 1
) else (
    echo ✅ Refresh Token สำเร็จ
    echo Response: %response%
    
    REM ดึง tokens ใหม่จาก response
    for /f "delims=" %%a in ('echo %response% ^| findstr /C:"accessToken":"') do set line=%%a
    for /f "tokens=2 delims=:" %%a in ("!line!") do set temp_token=%%a
    set ACCESS_TOKEN=!temp_token:~1,-1!
    
    for /f "delims=" %%a in ('echo %response% ^| findstr /C:"refreshToken":"') do set line=%%a
    for /f "tokens=2 delims=:" %%a in ("!line!") do set temp_token=%%a
    set REFRESH_TOKEN=!temp_token:~1,-1!
    
    echo ℹ️  New Access Token: !ACCESS_TOKEN:~0,20!...
    echo ℹ️  New Refresh Token: !REFRESH_TOKEN:~0,20!...
)
del temp_response.txt

REM ฟังก์ชันสำหรับ Logout
echo.
echo 🔄 5. Logout
curl -s -X POST "%API_BASE%/logout" ^
-H "Authorization: Bearer !ACCESS_TOKEN!" ^
-H "Content-Type: application/json" ^
-d "{\"refreshToken\": \"!REFRESH_TOKEN!\"}" > temp_response.txt
set /p response=<temp_response.txt

echo %response% | findstr /C:"success" | findstr /C:"true" >nul
if errorlevel 1 echo %response% | findstr /C:"Logged out successfully" >nul
if errorlevel 1 (
    echo ❌ Logout ล้มเหลว
    echo Response: %response%
    del temp_response.txt
    exit /b 1
) else (
    echo ✅ Logout สำเร็จ
    echo Response: %response%
)
del temp_response.txt

REM ฟังก์ชันสำหรับพยายามเรียก Protected Endpoint หลัง Logout
echo.
echo 🔄 6. พยายามเรียก Protected Endpoint หลัง Logout (ควรล้มเหลว)
curl -s -X GET "%API_BASE%/me" ^
-H "Authorization: Bearer !ACCESS_TOKEN!" > temp_response.txt
set /p response=<temp_response.txt

echo %response% | findstr /C:"success" | findstr /C:"false" >nul
if errorlevel 1 echo %response% | findstr /C:"Unauthorized" >nul
if errorlevel 1 echo %response% | findstr /C:"invalid token" >nul
if errorlevel 1 (
    echo ❌ Protected Endpoint ไม่ปฏิเสธการเข้าถึง
    echo Response: %response%
    del temp_response.txt
    exit /b 1
) else (
    echo ✅ Protected Endpoint ปฏิเสธการเข้าถึงตามที่คาดหวัง
    echo Response: %response%
)
del temp_response.txt

echo.
echo ========================================
echo ✅ การทดสอบ Authentication Flow สำเร็จทั้งหมด
echo ========================================

endlocal