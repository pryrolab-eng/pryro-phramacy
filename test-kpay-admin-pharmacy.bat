@echo off
echo ========================================
echo PRYROX KPAY INTEGRATION TEST
echo Testing Admin and Pharmacy Owner Roles
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dev server is running
echo Checking if dev server is running...
curl -s http://localhost:3000 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Dev server is not running!
    echo Please start the dev server first:
    echo   npm run dev
    echo.
    echo Press any key to continue anyway, or Ctrl+C to exit...
    pause >nul
)

echo.
echo Running comprehensive KPay integration tests...
echo.

node test-kpay-admin-pharmacy.js

echo.
echo ========================================
echo Test execution completed
echo ========================================
echo.
pause
