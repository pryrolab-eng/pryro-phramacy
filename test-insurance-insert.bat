@echo off
echo Testing Insurance Insert with Superadmin...
echo.

curl -X POST "https://seoqhxpclcueylldhiuy.supabase.co/rest/v1/insurance_providers" ^
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc" ^
  -H "Authorization: Bearer YOUR_SUPERADMIN_JWT_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -H "Prefer: return=representation" ^
  -d "{\"name\":\"Test Insurance\",\"coverage_percentage\":85.00,\"is_active\":true}"

echo.
echo.
echo Note: Replace YOUR_SUPERADMIN_JWT_TOKEN_HERE with actual token from browser
pause
