@echo off
set BASE_URL=http://localhost:3000

echo Testing Security Settings API...
echo.

echo 1. GET Security Settings
curl -X GET "%BASE_URL%/api/settings/security"
echo.
echo.

echo 2. PUT Security Settings (Enable 2FA)
curl -X PUT "%BASE_URL%/api/settings/security" -H "Content-Type: application/json" -d "{\"twoFactorEnabled\":true,\"sessionTimeout\":30}"
echo.
echo.

echo 3. PUT Security Settings (Invalid - no data)
curl -X PUT "%BASE_URL%/api/settings/security" -H "Content-Type: application/json" -d "{}"
echo.
