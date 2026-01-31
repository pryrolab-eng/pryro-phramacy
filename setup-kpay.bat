@echo off
echo ========================================
echo KPay Integration Setup
echo ========================================
echo.

echo Step 1: Checking environment variables...
findstr /C:"KPAY_USERNAME" .env.local >nul
if %errorlevel% neq 0 (
    echo [WARNING] KPay environment variables not found in .env.local
    echo Please update the following variables:
    echo   - KPAY_USERNAME
    echo   - KPAY_PASSWORD
    echo   - KPAY_RETAILER_ID
    echo.
) else (
    echo [OK] KPay environment variables found
    echo.
)

echo Step 2: Database Migration
echo Please run the following SQL in your Supabase dashboard:
echo File: supabase/migrations/20240325000001_kpay_integration.sql
echo.
echo Or use Supabase CLI:
echo   supabase db push
echo.

echo Step 3: IP Whitelisting
echo Contact KPay to whitelist your server IP addresses
echo.

echo Step 4: Test Integration
echo After setup, run: node test-kpay-integration.js
echo.

echo ========================================
echo Setup Instructions Complete
echo ========================================
echo.
echo Next: Update .env.local with your KPay credentials
echo Then: Apply database migration
echo Finally: Test the integration
echo.
pause
