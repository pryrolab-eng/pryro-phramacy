// Test script to check all dashboard API endpoints
const BASE_URL = 'http://localhost:3000'

const endpoints = [
  '/api/pharmacist/dashboard',
  '/api/pharmacist/prescriptions', 
  '/api/pharmacist/activities',
  '/api/pharmacist/chart-data',
  '/api/pharmacy/dashboard',
  '/api/pharmacy/sales-chart',
  '/api/stock-alerts'
]

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`)
    const data = await response.json()
    console.log(`✅ ${endpoint}: ${response.status}`)
    if (!response.ok) {
      console.log(`   Error: ${data.error || 'Unknown error'}`)
    }
    return { endpoint, status: response.status, data }
  } catch (error) {
    console.log(`❌ ${endpoint}: ${error.message}`)
    return { endpoint, error: error.message }
  }
}

async function testAll() {
  console.log('Testing all dashboard API endpoints...\n')
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint)
  }
}

testAll()