# Test Admin Settings API
Write-Host "=== Testing Admin Settings API ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$settingsUrl = "$baseUrl/api/admin/system-settings"

# Test 1: GET Settings
Write-Host "`n1. Testing GET /api/admin/system-settings" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $settingsUrl -Method GET -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# Test 2: PUT Settings (Update)
Write-Host "`n2. Testing PUT /api/admin/system-settings" -ForegroundColor Yellow
$updateData = @{
    platformName = "Pryrox Updated"
    maxPharmacies = 150
    enableRegistrations = $true
    maintenanceMode = $false
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $settingsUrl -Method PUT -Body $updateData -ContentType "application/json" -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
