@echo off
echo ========================================
echo COMPREHENSIVE KPAY SYSTEM TEST
echo ========================================
echo.

set BASE_URL=http://localhost:3000

echo 1. Testing Public Plans API...
curl -X GET "%BASE_URL%/api/plans" -H "Content-Type: application/json"

echo.
echo 2. Testing Admin Plans API (without auth)...
curl -X GET "%BASE_URL%/api/admin/plans" -H "Content-Type: application/json"

echo.
echo 3. Testing KPay Payment Initiation (without auth)...
curl -X POST "%BASE_URL%/api/kpay/initiate" ^
  -H "Content-Type: application/json" ^
  -d "{\"amount\":25000,\"paymentMethod\":\"momo\",\"bankId\":\"63510\",\"customerName\":\"Test Customer\",\"customerPhone\":\"+250788123456\",\"customerEmail\":\"test@example.com\",\"details\":\"Test payment\"}"

echo.
echo 4. Testing KPay Status Check...
curl -X GET "%BASE_URL%/api/kpay/status?refid=PYX-test-123" -H "Content-Type: application/json"

echo.
echo 5. Testing Subscription Status...
curl -X GET "%BASE_URL%/api/subscriptions/status" -H "Content-Type: application/json"

echo.
echo ========================================
echo SYSTEM TEST COMPLETED
echo ========================================