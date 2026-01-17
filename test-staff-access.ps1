# Test Staff Access - PowerShell Script
# This tests if staff can only see their pharmacy's data

Write-Host "=== Testing Staff Access Isolation ===" -ForegroundColor Cyan
Write-Host ""

# Test without auth (should return empty)
Write-Host "Test 1: No authentication" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/inventory" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
Write-Host "  Items returned: $($data.Count)"
Write-Host "  Expected: 0 (no auth)"
Write-Host ""

# Instructions for manual testing
Write-Host "Manual Test Steps:" -ForegroundColor Green
Write-Host "1. Open browser and login as muzungu@gmail.com"
Write-Host "2. Open DevTools Console (F12)"
Write-Host "3. Run this command:"
Write-Host ""
Write-Host "   fetch('/api/inventory').then(r=>r.json()).then(d=>{" -ForegroundColor White
Write-Host "     console.log('Items:', d.length);" -ForegroundColor White
Write-Host "     console.log('Pharmacy IDs:', [...new Set(d.map(i=>i.pharmacy_id))]);" -ForegroundColor White
Write-Host "   })" -ForegroundColor White
Write-Host ""
Write-Host "4. Note the pharmacy_id"
Write-Host "5. Logout and login as staff2rrr2muzunggu@gmail.com"
Write-Host "6. Run the same command"
Write-Host "7. Compare pharmacy_ids - they should be IDENTICAL"
Write-Host ""
Write-Host "Expected Result:" -ForegroundColor Cyan
Write-Host "  - Owner and staff see SAME pharmacy_id"
Write-Host "  - Different pharmacy users see DIFFERENT pharmacy_id"
