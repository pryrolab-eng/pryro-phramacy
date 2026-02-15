@echo off
echo Testing Admin Settings Backend...
echo.

echo Step 1: Applying schema fixes...
psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 6543 -d postgres -U postgres.ztxqxqxqxqxqxqxq -f fix-admin-settings-schema.sql
echo.

echo Step 2: Seeding initial data...
psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 6543 -d postgres -U postgres.ztxqxqxqxqxqxqxq -f seed-admin-settings.sql
echo.

echo Step 3: Testing API endpoint...
curl -X GET http://localhost:3000/api/admin/system-settings ^
  -H "Content-Type: application/json"
echo.
echo.

echo Step 4: Checking if settings exist...
psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 6543 -d postgres -U postgres.ztxqxqxqxqxqxqxq -c "SELECT setting_key, setting_value FROM public.system_settings WHERE pharmacy_id IS NULL LIMIT 5;"
echo.

echo Done! Now visit http://localhost:3000/admin/settings
pause
