@echo off
echo Testing Insurance Provider API with Superadmin

echo.
echo === Test 1: Login as Superadmin ===
curl -X POST "https://seoqhxpclcueylldhiuy.supabase.co/auth/v1/token?grant_type=password" ^
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"abdousentore@gmail.com\",\"password\":\"Admin@123\"}" > token.json

echo.
echo === Test 2: Add Insurance Provider ===
for /f "tokens=*" %%a in ('type token.json ^| findstr /C:"access_token"') do set TOKEN_LINE=%%a
echo Token: %TOKEN_LINE%

echo.
echo Attempting to insert directly via Supabase API...
curl -X POST "https://seoqhxpclcueylldhiuy.supabase.co/rest/v1/insurance_providers" ^
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc" ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -H "Prefer: return=representation" ^
  -d "{\"name\":\"Test Insurance\",\"coverage_percentage\":80,\"is_active\":true}"

echo.
pause
