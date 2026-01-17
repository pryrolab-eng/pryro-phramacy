# Test Insurance API as Superadmin

$SUPABASE_URL = "https://seoqhxpclcueylldhiuy.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc"

Write-Host "Step 1: Authenticating as superadmin..."

$loginBody = @{
    email = "superadmin@pyro.rw"
    password = "SuperAdmin123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/token?grant_type=password" -Method POST -Headers @{"Content-Type" = "application/json"; "apikey" = $SUPABASE_ANON_KEY} -Body $loginBody

if ($loginResponse.access_token) {
    Write-Host "Login successful!"
    $accessToken = $loginResponse.access_token
    
    Write-Host "`nStep 2: Adding insurance provider..."
    
    $insuranceBody = @{
        name = "MMI Test"
        coverage_percentage = 80
        contact_email = "MMI@gmail.com"
        contact_phone = "07842942"
        policy_number = "POL-12345"
        invoice_template = "default"
    } | ConvertTo-Json
    
    try {
        $addResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/insurance" -Method POST -Headers @{"Content-Type" = "application/json"; "Authorization" = "Bearer $accessToken"} -Body $insuranceBody
        
        Write-Host "Response:"
        $addResponse | ConvertTo-Json -Depth 5
        
    } catch {
        Write-Host "Error:"
        Write-Host $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message
        }
    }
    
    Write-Host "`nStep 3: Fetching insurance providers..."
    
    try {
        $getResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/insurance" -Method GET -Headers @{"Authorization" = "Bearer $accessToken"}
        
        Write-Host "Insurance providers:"
        $getResponse | ConvertTo-Json -Depth 5
        
    } catch {
        Write-Host "Error fetching:"
        Write-Host $_.Exception.Message
    }
    
} else {
    Write-Host "Login failed!"
    $loginResponse | ConvertTo-Json
}
