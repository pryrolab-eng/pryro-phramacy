@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Testing Insurance API with Authentication
echo ========================================
echo.

set SUPABASE_URL=https://seoqhxpclcueylldhiuy.supabase.co
set ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc

echo Step 1: Login to Supabase...
curl -s -X POST "%SUPABASE_URL%/auth/v1/token?grant_type=password" ^
  -H "Content-Type: application/json" ^
  -H "apikey: %ANON_KEY%" ^
  -d "{\"email\":\"abdousentore@gmail.com\",\"password\":\"admin123\"}" ^
  -c cookies.txt > login.json

type login.json
echo.

echo Step 2: Test Insurance API with session...
curl -v -X POST "http://localhost:3000/api/insurance" ^
  -H "Content-Type: application/json" ^
  -b cookies.txt ^
  -d "{\"name\":\"MMI\",\"coverage_percentage\":80,\"contact_email\":\"MMI@gmail.com\",\"contact_phone\":\"07842942\",\"policy_number\":\"POL-12345\",\"invoice_template\":\"default\"}"

echo.
echo ========================================
pause
