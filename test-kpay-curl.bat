@echo off
echo ========================================
echo KPay Integration - cURL Tests
echo ========================================
echo.

REM First, you need to get an auth token by logging in
echo Step 1: Login to get auth token
echo Run this first to get your access token:
echo.
curl -X POST https://seoqhxpclcueylldhiuy.supabase.co/auth/v1/token?grant_type=password ^
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"YOUR_EMAIL\",\"password\":\"YOUR_PASSWORD\"}"

echo.
echo.
echo Copy the access_token from above and use it in the tests below
echo.
pause

echo ========================================
echo Step 2: Test Payment Initiation
echo ========================================
echo.

set /p TOKEN="Enter your access_token: "

curl -X POST http://localhost:3000/api/kpay/initiate ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"amount\":5000,\"paymentMethod\":\"momo\",\"bankId\":\"63510\",\"customerName\":\"Test Customer\",\"customerPhone\":\"250788123456\",\"customerEmail\":\"test@example.com\",\"details\":\"Test payment\"}"

echo.
echo.
pause

echo ========================================
echo Step 3: Test Webhook (Simulated)
echo ========================================
echo.

curl -X POST http://localhost:3000/api/kpay/webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"tid\":\"E6974831594723691\",\"refid\":\"PYX-1234567890-test\",\"momtransactionid\":\"85640192\",\"payaccount\":\"250788123456\",\"statusid\":\"01\",\"statusdesc\":\"Successfully processed transaction.\"}"

echo.
echo.
pause

echo ========================================
echo Step 4: Test Status Check
echo ========================================
echo.

set /p TXID="Enter transaction ID from Step 2: "

curl -X GET "http://localhost:3000/api/kpay/status?transactionId=%TXID%" ^
  -H "Authorization: Bearer %TOKEN%"

echo.
echo.
echo ========================================
echo Tests Complete
echo ========================================
pause
