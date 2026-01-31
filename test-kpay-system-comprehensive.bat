@echo off
echo ========================================
echo COMPREHENSIVE KPAY SYSTEM TEST
echo ========================================
echo.

set BASE_URL=http://localhost:3000
set ADMIN_EMAIL=abdousentore@gmail.com
set ADMIN_PASSWORD=123456
set PHARMACY_EMAIL=pharmacy3@example.com
set PHARMACY_PASSWORD=123456
set PHARMACIST_EMAIL=pharmacist3@example.com
set PHARMACIST_PASSWORD=123456

echo 1. Testing Admin Login and Plan Management...
echo ========================================

curl -X POST "%BASE_URL%/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%ADMIN_EMAIL%\",\"password\":\"%ADMIN_PASSWORD%\"}" ^
  -c admin_cookies.txt

echo.
echo 2. Testing Admin Plans API...
curl -X GET "%BASE_URL%/api/admin/plans" ^
  -H "Content-Type: application/json" ^
  -b admin_cookies.txt

echo.
echo 3. Testing Pharmacy Owner Login...
curl -X POST "%BASE_URL%/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%PHARMACY_EMAIL%\",\"password\":\"%PHARMACY_PASSWORD%\"}" ^
  -c pharmacy_cookies.txt

echo.
echo 4. Testing KPay Payment Initiation (Pharmacy Owner)...
curl -X POST "%BASE_URL%/api/kpay/initiate" ^
  -H "Content-Type: application/json" ^
  -b pharmacy_cookies.txt ^
  -d "{\"amount\":25000,\"paymentMethod\":\"momo\",\"bankId\":\"63510\",\"customerName\":\"Test Customer\",\"customerPhone\":\"+250788123456\",\"customerEmail\":\"test@example.com\",\"details\":\"Subscription payment\",\"subscriptionId\":\"test-sub-123\"}"

echo.
echo 5. Testing Pharmacist Login...
curl -X POST "%BASE_URL%/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%PHARMACIST_EMAIL%\",\"password\":\"%PHARMACIST_PASSWORD%\"}" ^
  -c pharmacist_cookies.txt

echo.
echo 6. Testing KPay Payment Initiation (Pharmacist)...
curl -X POST "%BASE_URL%/api/kpay/initiate" ^
  -H "Content-Type: application/json" ^
  -b pharmacist_cookies.txt ^
  -d "{\"amount\":15000,\"paymentMethod\":\"momo\",\"bankId\":\"63510\",\"customerName\":\"Pharmacist Customer\",\"customerPhone\":\"+250788654321\",\"customerEmail\":\"pharmacist@example.com\",\"details\":\"POS Sale payment\",\"saleId\":\"test-sale-456\"}"

echo.
echo 7. Testing Payment Status Check...
curl -X GET "%BASE_URL%/api/kpay/status?refid=PYX-test-123" ^
  -H "Content-Type: application/json" ^
  -b pharmacy_cookies.txt

echo.
echo 8. Testing Subscription Plans (Public)...
curl -X GET "%BASE_URL%/api/plans" ^
  -H "Content-Type: application/json"

echo.
echo 9. Testing Time Counter and Subscription Status...
curl -X GET "%BASE_URL%/api/subscriptions/status" ^
  -H "Content-Type: application/json" ^
  -b pharmacy_cookies.txt

echo.
echo ========================================
echo SYSTEM TEST COMPLETED
echo ========================================

del admin_cookies.txt pharmacy_cookies.txt pharmacist_cookies.txt 2>nul
pause