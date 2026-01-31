@echo off
echo ========================================
echo Testing Upgrade Button Flow
echo ========================================
echo.

echo This test simulates the upgrade button click
echo.

echo Step 1: Get auth token
echo Run this in browser console on localhost:3000:
echo.
echo document.cookie
echo.
echo Copy the auth token and paste below
echo.
pause

set /p TOKEN="Enter your auth token: "

echo.
echo Step 2: Test subscription creation
echo.

curl -X POST http://localhost:3000/api/payments ^
  -H "Content-Type: application/json" ^
  -H "Cookie: %TOKEN%" ^
  -d "{\"plan\":\"Standard\",\"useKPay\":true}"

echo.
echo.
echo Expected response:
echo {
echo   "success": true,
echo   "requiresPayment": true,
echo   "subscriptionId": "uuid",
echo   "amount": 50000
echo }
echo.
pause

echo Step 3: Test KPay payment initiation
echo.

set /p SUBID="Enter subscriptionId from above: "

curl -X POST http://localhost:3000/api/kpay/initiate ^
  -H "Content-Type: application/json" ^
  -H "Cookie: %TOKEN%" ^
  -d "{\"amount\":50000,\"subscriptionId\":\"%SUBID%\",\"paymentMethod\":\"momo\",\"bankId\":\"63510\",\"customerName\":\"Test Pharmacy\",\"customerPhone\":\"250788123456\",\"customerEmail\":\"test@pryrox.com\",\"details\":\"Standard plan subscription\"}"

echo.
echo.
echo Expected response:
echo {
echo   "success": true,
echo   "transaction": {
echo     "id": "uuid",
echo     "tid": "E...",
echo     "checkoutUrl": "https://..."
echo   }
echo }
echo.
pause

echo ========================================
echo Test Complete
echo ========================================
echo.
echo If you see errors:
echo - Check dev server is running (npm run dev)
echo - Verify auth token is valid
echo - Check database migration is applied
echo - Verify KPay credentials in .env.local
echo.
pause
