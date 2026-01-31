@echo off
REM Quick KPay API Test
REM Update credentials below before running

echo Testing KPay API...
echo.

curl -X POST https://pay.esicia.com/ ^
  --user "YOUR_KPAY_USERNAME:YOUR_KPAY_PASSWORD" ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"pay\",\"msisdn\":\"250788123456\",\"email\":\"test@example.com\",\"details\":\"Test payment\",\"refid\":\"TEST-%RANDOM%\",\"amount\":1000,\"currency\":\"RWF\",\"cname\":\"Test Customer\",\"cnumber\":\"250788123456\",\"pmethod\":\"momo\",\"retailerid\":\"02\",\"returl\":\"http://localhost:3000/api/kpay/webhook\",\"redirecturl\":\"http://localhost:3000/payment/success\",\"bankid\":\"63510\"}"

echo.
echo.
echo Expected responses:
echo - retcode 600: Invalid credentials (update username/password above)
echo - retcode 602: IP not whitelisted (contact KPay)
echo - retcode 0: Success! Payment initiated
echo.
pause
