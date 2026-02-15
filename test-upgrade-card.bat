@echo off
echo Testing Card Upgrade Flow...
echo.

REM Get auth token first
echo Step 1: Getting auth token...
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@pryrox.com\",\"password\":\"admin123\"}" ^
  -c cookies.txt ^
  -b cookies.txt
echo.
echo.

REM Test phone validation
echo Step 2: Testing phone validation...
curl -X POST http://localhost:3000/api/test-validation ^
  -H "Content-Type: application/json" ^
  -b cookies.txt ^
  -d "{\"phoneNumber\":\"0788123456\"}"
echo.
echo.

REM Create subscription
echo Step 3: Creating subscription...
curl -X POST http://localhost:3000/api/subscriptions/upgrade ^
  -H "Content-Type: application/json" ^
  -b cookies.txt ^
  -d "{\"planId\":\"Premium\"}"
echo.
echo.

REM Initiate KPay payment with card
echo Step 4: Initiating KPay card payment...
curl -X POST http://localhost:3000/api/kpay/initiate ^
  -H "Content-Type: application/json" ^
  -b cookies.txt ^
  -d "{\"amount\":45000,\"paymentMethod\":\"cc\",\"bankId\":\"000\",\"customerName\":\"Test Pharmacy\",\"customerPhone\":\"+250788123456\",\"customerEmail\":\"test@pharmacy.com\",\"details\":\"Premium plan subscription - Monthly payment\"}"
echo.
echo.

echo Test completed!
