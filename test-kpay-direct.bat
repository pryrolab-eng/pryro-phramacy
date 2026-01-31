@echo off
echo ========================================
echo Direct KPay API Test
echo ========================================
echo.
echo Testing KPay API directly (no local server needed)
echo.

REM Test KPay API authentication and payment request
echo Test 1: KPay Payment Request
echo.

curl -X POST https://pay.esicia.com/ ^
  --user "your_kpay_username:your_kpay_password" ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"pay\",\"msisdn\":\"250788123456\",\"email\":\"test@example.com\",\"details\":\"Test payment\",\"refid\":\"TEST-%RANDOM%\",\"amount\":1000,\"currency\":\"RWF\",\"cname\":\"Test Customer\",\"cnumber\":\"250788123456\",\"pmethod\":\"momo\",\"retailerid\":\"02\",\"returl\":\"http://localhost:3000/api/kpay/webhook\",\"redirecturl\":\"http://localhost:3000/payment/success\",\"bankid\":\"63510\"}"

echo.
echo.
echo If you see error 600 or 601, update credentials in this file
echo If you see error 602, your IP needs to be whitelisted
echo If you see retcode 0, payment initiated successfully!
echo.
pause
