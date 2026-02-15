@echo off
echo Testing Branding Functionality
echo ==============================
echo.

echo 1. Testing GET branding settings...
curl -X GET http://localhost:3000/api/pharmacy/branding ^
  -H "Content-Type: application/json"
echo.
echo.

echo 2. Testing PUT branding settings...
curl -X PUT http://localhost:3000/api/pharmacy/branding ^
  -H "Content-Type: application/json" ^
  -d "{\"primaryColor\":\"#ff5733\",\"customDomain\":\"test.pharmacy.com\"}"
echo.
echo.

echo 3. Testing GET after update...
curl -X GET http://localhost:3000/api/pharmacy/branding ^
  -H "Content-Type: application/json"
echo.
echo.

echo Test completed!
pause
