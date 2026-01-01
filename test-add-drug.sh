#!/bin/bash

echo "🔐 Step 1: Login to get auth token..."

# Login and extract token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -d '{"email":"pharmacy@test.com","password":"pharmacy123"}')

echo "Login response: $LOGIN_RESPONSE"

# Extract access token (this is a simplified extraction - in real scenario you'd parse JSON properly)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get auth token"
    exit 1
fi

echo "✅ Got auth token: ${TOKEN:0:20}..."

echo ""
echo "💊 Step 2: Adding drug with auth token..."

# Add drug with auth token
curl -X POST http://localhost:3000/api/inventory/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Paracetamol 500mg",
    "category": "Pain Relief", 
    "batch_number": "TEST001",
    "quantity": 100,
    "unit_cost": 400,
    "selling_price": 500,
    "minimum_stock_level": 20,
    "expiry_date": "2025-12-31"
  }' \
  -w "\nStatus: %{http_code}\n"