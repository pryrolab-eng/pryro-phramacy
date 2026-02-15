@echo off
echo Testing User Roles API...

REM Test 1: Get current user role
echo.
echo === Test 1: Get Current User Role ===
curl -X GET "http://localhost:3000/api/user/role" ^
  -H "Content-Type: application/json" ^
  -b "cookies.txt" ^
  -c "cookies.txt"

echo.
echo.

REM Test 2: Check admin access to system settings
echo === Test 2: Admin System Settings Access ===
curl -X GET "http://localhost:3000/api/admin/system-settings" ^
  -H "Content-Type: application/json" ^
  -b "cookies.txt"

echo.
echo.

REM Test 3: Get user pharmacy associations
echo === Test 3: User Pharmacy Associations ===
curl -X GET "http://localhost:3000/api/user/pharmacies" ^
  -H "Content-Type: application/json" ^
  -b "cookies.txt"

echo.
pause