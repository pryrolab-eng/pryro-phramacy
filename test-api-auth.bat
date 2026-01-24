@echo off
echo Enter your access token:
set /p TOKEN=

set BASE_URL=http://localhost:3000

echo.
echo Testing with authentication...
echo.

echo 1. Dashboard API (authenticated)
curl -X GET "%BASE_URL%/api/dashboard" -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 2. Pharmacy Settings
curl -X GET "%BASE_URL%/api/pharmacy/settings" -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo 3. Staff List
curl -X GET "%BASE_URL%/api/staff" -H "Authorization: Bearer %TOKEN%"
echo.
