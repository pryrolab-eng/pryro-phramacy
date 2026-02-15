Write-Host "Applying system settings RLS fix..." -ForegroundColor Cyan

# Read the migration file
$migrationPath = "supabase\migrations\20241205000001_fix_system_settings_admin_access.sql"
$sql = Get-Content $migrationPath -Raw

# Apply using Supabase CLI
Write-Host "Running migration..." -ForegroundColor Yellow
npx supabase db push

Write-Host "`nMigration applied successfully!" -ForegroundColor Green
Write-Host "Admin users can now access global system settings." -ForegroundColor Green
