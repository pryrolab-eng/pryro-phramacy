@echo off
echo ========================================
echo KPay Payment Test - Mobile Money & Card
echo ========================================
echo.

REM Update these with your actual KPay credentials
set KPAY_USER=your_kpay_username
set KPAY_PASS=your_kpay_password

echo Test 1: Mobile Money Payment (MTN)
echo ========================================
echo.

curl -X POST https://pay.esicia.com/ ^
  --user "%KPAY_USER%:%KPAY_PASS%" ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"pay\",\"msisdn\":\"250788123456\",\"email\":\"test@pryrox.com\",\"details\":\"Pharmacy subscription payment\",\"refid\":\"PRYROX-MOMO-%RANDOM%\",\"amount\":50000,\"currency\":\"RWF\",\"cname\":\"Test Pharmacy\",\"cnumber\":\"250788123456\",\"pmethod\":\"momo\",\"retailerid\":\"02\",\"returl\":\"http://localhost:3000/api/kpay/webhook\",\"redirecturl\":\"http://localhost:3000/payment/success\",\"bankid\":\"63510\"}"

echo.
echo.
pause

echo Test 2: Mobile Money Payment (Airtel)
echo ========================================
echo.

curl -X POST https://pay.esicia.com/ ^
  --user "%KPAY_USER%:%KPAY_PASS%" ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"pay\",\"msisdn\":\"250738123456\",\"email\":\"test@pryrox.com\",\"details\":\"Pharmacy subscription payment\",\"refid\":\"PRYROX-AIRTEL-%RANDOM%\",\"amount\":50000,\"currency\":\"RWF\",\"cname\":\"Test Pharmacy\",\"cnumber\":\"250738123456\",\"pmethod\":\"momo\",\"retailerid\":\"02\",\"returl\":\"http://localhost:3000/api/kpay/webhook\",\"redirecturl\":\"http://localhost:3000/payment/success\",\"bankid\":\"63514\"}"

echo.
echo.
pause

echo Test 3: Card Payment (Visa/Mastercard)
echo ========================================
echo.

curl -X POST https://pay.esicia.com/ ^
  --user "%KPAY_USER%:%KPAY_PASS%" ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"pay\",\"msisdn\":\"250788123456\",\"email\":\"test@pryrox.com\",\"details\":\"Pharmacy subscription payment\",\"refid\":\"PRYROX-CARD-%RANDOM%\",\"amount\":50000,\"currency\":\"RWF\",\"cname\":\"Test Pharmacy\",\"cnumber\":\"250788123456\",\"pmethod\":\"cc\",\"retailerid\":\"02\",\"returl\":\"http://localhost:3000/api/kpay/webhook\",\"redirecturl\":\"http://localhost:3000/payment/success\",\"bankid\":\"000\",\"logourl\":\"https://pryrox.com/logo.png\"}"

echo.
echo.
pause

echo Test 4: Check Payment Status
echo ========================================
echo.
set /p REFID="Enter refid from above test: "

curl -X POST https://pay.esicia.com/ ^
  --user "%KPAY_USER%:%KPAY_PASS%" ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"checkstatus\",\"refid\":\"%REFID%\"}"

echo.
echo.
echo ========================================
echo Test Results Guide:
echo ========================================
echo.
echo retcode 0 = Success - Payment initiated
echo retcode 600 = Invalid credentials
echo retcode 602 = IP not whitelisted
echo retcode 603 = Missing parameters
echo.
echo statusid 01 = Payment successful
echo statusid 02 = Payment failed
echo statusid 03 = Payment pending
echo.
echo For Mobile Money:
echo - User receives prompt on phone
echo - Enters PIN to confirm
echo - Webhook notifies your system
echo.
echo For Card Payment:
echo - Returns checkout URL
echo - User enters card details
echo - Redirects after payment
echo.
pause
