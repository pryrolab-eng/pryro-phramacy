// Simple test script to verify plans API
// Run with: node test_plans_api.js

const BASE_URL = 'http://localhost:3000'

async function testPlansAPI() {
  try {
    console.log('Testing Plans API...')
    
    // Test GET /api/plans
    console.log('\n1. Testing GET /api/plans')
    const response = await fetch(`${BASE_URL}/api/plans`)
    const plans = await response.json()
    console.log('Plans:', plans)
    
    // Test GET /api/admin/plans
    console.log('\n2. Testing GET /api/admin/plans')
    const adminResponse = await fetch(`${BASE_URL}/api/admin/plans`)
    const adminPlans = await adminResponse.json()
    console.log('Admin Plans:', adminPlans)
    
    console.log('\n✅ API tests completed')
  } catch (error) {
    console.error('❌ Error testing API:', error)
  }
}

testPlansAPI()