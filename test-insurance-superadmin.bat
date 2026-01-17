@echo off
echo ========================================
echo Testing Insurance API for Superadmin
echo ========================================
echo.

echo 1. Testing GET /api/insurance (without auth - should return empty)
curl -X GET http://localhost:3000/api/insurance -H "Content-Type: application/json"
echo.
echo.

echo 2. Testing Direct Supabase (with service role - should return all data)
curl -X GET "https://seoqhxpclcueylldhiuy.supabase.co/rest/v1/insurance_providers?select=*&is_active=eq.true" -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ"
echo.
echo.

echo 3. Testing POST /api/insurance (without auth - should fail)
curl -X POST http://localhost:3000/api/insurance -H "Content-Type: application/json" -d "{\"name\":\"Test Insurance\",\"coverage_percentage\":80}"
echo.
echo.

echo ========================================
echo Test Complete
echo ========================================
pause
