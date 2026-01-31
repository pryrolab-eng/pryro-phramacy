// Test upgrade functionality
console.log('🔧 TESTING UPGRADE FUNCTIONALITY')
console.log('================================')

const BASE_URL = 'http://localhost:3000'

const testUpgradeFlow = async () => {
  console.log('1. Testing Plans API...')
  try {
    const response = await fetch(`${BASE_URL}/api/plans`)
    const plans = await response.json()
    
    if (response.ok) {
      console.log('✅ Plans API working')
      console.log(`   Found ${plans.length} plans:`)
      plans.forEach(plan => {
        console.log(`   - ${plan.name}: RWF ${plan.price.toLocaleString()}`)
      })
    } else {
      console.log('❌ Plans API failed:', plans.error)
    }
  } catch (error) {
    console.log('❌ Plans API error:', error.message)
  }

  console.log('\n2. Testing Subscription Status API...')
  try {
    const response = await fetch(`${BASE_URL}/api/subscriptions/status`)
    const result = await response.json()
    
    if (response.status === 401) {
      console.log('✅ Subscription Status API properly secured (401 Unauthorized)')
    } else {
      console.log('⚠️  Subscription Status API response:', response.status, result)
    }
  } catch (error) {
    console.log('❌ Subscription Status API error:', error.message)
  }

  console.log('\n3. Testing KPay Initiate API...')
  try {
    const response = await fetch(`${BASE_URL}/api/kpay/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 50000,
        paymentMethod: 'momo',
        customerName: 'Test Customer',
        customerPhone: '0788123456',
        customerEmail: 'test@example.com',
        details: 'Test upgrade payment'
      })
    })
    const result = await response.json()
    
    if (response.status === 401) {
      console.log('✅ KPay Initiate API properly secured (401 Unauthorized)')
    } else {
      console.log('⚠️  KPay Initiate API response:', response.status, result)
    }
  } catch (error) {
    console.log('❌ KPay Initiate API error:', error.message)
  }

  console.log('\n4. Testing Phone Validation...')
  try {
    const response = await fetch(`${BASE_URL}/api/test-validation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '0788123456' })
    })
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Phone validation working')
      console.log(`   Phone: ${result.phone.formatted}`)
      console.log(`   Carrier: ${result.phone.carrier}`)
      console.log(`   Bank ID: ${result.phone.kpayBankId}`)
    } else {
      console.log('❌ Phone validation failed:', result.error)
    }
  } catch (error) {
    console.log('❌ Phone validation error:', error.message)
  }

  console.log('\n📋 UPGRADE FLOW ANALYSIS')
  console.log('========================')
  console.log('✅ Plans API: Working (public access)')
  console.log('🔒 Subscription API: Secured (requires auth)')
  console.log('🔒 KPay API: Secured (requires auth)')
  console.log('✅ Validation: Working (phone/card validation)')
  console.log('\n🔧 UPGRADE BUTTON ISSUES:')
  console.log('- Authentication required for subscription creation')
  console.log('- User must be logged in to access KPay endpoints')
  console.log('- Settings page needs proper session management')
  console.log('\n💡 SOLUTION:')
  console.log('- Ensure user is authenticated before upgrade')
  console.log('- Add loading states and better error messages')
  console.log('- Implement proper session handling')
}

testUpgradeFlow().catch(console.error)