@echo off
echo Testing User Roles...

REM First login to get session
echo === Step 1: Login ===
curl -X POST "http://localhost:3000/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"abdousentore@gmail.com\",\"password\":\"admin123\"}" ^
  -c "cookies.txt"

echo.
echo.

REM Test admin access
echo === Step 2: Test Admin Access ===
curl -X GET "http://localhost:3000/api/admin/system-settings" ^
  -H "Content-Type: application/json" ^
  -b "cookies.txt"

echo.
echo.

REM Test superadmin dashboard
echo === Step 3: Test Superadmin Dashboard ===
curl -X GET "http://localhost:3000/api/superadmin/dashboard" ^
  -H "Content-Type: application/json" ^
  -b "cookies.txt"

echo.
pause