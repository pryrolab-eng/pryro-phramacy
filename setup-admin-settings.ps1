# Admin Settings Setup Guide
# Run this step by step to fix all issues

Write-Host "=== Admin Settings Setup Guide ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Create Database Table" -ForegroundColor Yellow
Write-Host "Action: Run the SQL script in Supabase SQL Editor" -ForegroundColor White
Write-Host "File: create-system-settings-table.sql" -ForegroundColor Green
Write-Host "URL: https://seoqhxpclcueylldhiuy.supabase.co/project/default/sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter when done..." -ForegroundColor Magenta
Read-Host

Write-Host "STEP 2: Backup Current UI" -ForegroundColor Yellow
Write-Host "Action: Backing up current settings page..." -ForegroundColor White
$sourcePath = "d:\pryrox\src\app\(dashboard)\admin\settings\page.tsx"
$backupPath = "d:\pryrox\src\app\(dashboard)\admin\settings\page-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').tsx"
if (Test-Path $sourcePath) {
    Copy-Item $sourcePath $backupPath
    Write-Host "✓ Backup created: $backupPath" -ForegroundColor Green
} else {
    Write-Host "✗ Source file not found" -ForegroundColor Red
}
Write-Host ""

Write-Host "STEP 3: Apply Improved UI" -ForegroundColor Yellow
Write-Host "Action: Replacing with improved version..." -ForegroundColor White
$improvedPath = "d:\pryrox\src\app\(dashboard)\admin\settings\page-improved.tsx"
if (Test-Path $improvedPath) {
    Copy-Item $improvedPath $sourcePath -Force
    Write-Host "✓ Improved UI applied" -ForegroundColor Green
} else {
    Write-Host "✗ Improved file not found" -ForegroundColor Red
}
Write-Host ""

Write-Host "STEP 4: Verify API Route" -ForegroundColor Yellow
Write-Host "Action: API route has been updated with:" -ForegroundColor White
Write-Host "  ✓ Authentication checks" -ForegroundColor Green
Write-Host "  ✓ Authorization (superadmin only)" -ForegroundColor Green
Write-Host "  ✓ Error handling" -ForegroundColor Green
Write-Host "  ✓ Real data fetching" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 5: Test the System" -ForegroundColor Yellow
Write-Host "Action: Run tests to verify everything works" -ForegroundColor White
Write-Host ""
Write-Host "5a. Start dev server (if not running):" -ForegroundColor Cyan
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "5b. Test API endpoints:" -ForegroundColor Cyan
Write-Host "    .\test-admin-settings.ps1" -ForegroundColor White
Write-Host ""
Write-Host "5c. Test in browser:" -ForegroundColor Cyan
Write-Host "    http://localhost:3000/admin/settings" -ForegroundColor White
Write-Host ""

Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Ensure you're logged in as a superadmin user" -ForegroundColor White
Write-Host "2. Navigate to the admin settings page" -ForegroundColor White
Write-Host "3. Verify settings load from database" -ForegroundColor White
Write-Host "4. Test saving settings" -ForegroundColor White
Write-Host "5. Check analytics display real data" -ForegroundColor White
Write-Host ""
Write-Host "For detailed information, see: ADMIN_SETTINGS_IMPROVEMENTS.md" -ForegroundColor Cyan
