// Debug payment processing failure
console.log('🔍 DEBUGGING PAYMENT PROCESSING FAILURE')
console.log('======================================')

const BASE_URL = 'http://localhost:3000'

const debugPaymentFlow = async () => {
  console.log('1. Testing authentication status...')
  try {
    const authTest = await fetch(`${BASE_URL}/api/subscriptions/status`)
    console.log(`   Auth status: ${authTest.status}`)
    if (authTest.status === 401) {
      console.log('   ❌ User not authenticated - this is the main issue')
      console.log('   💡 Solution: User must log in first')
    }
  } catch (error) {
    console.log('   ❌ Auth test failed:', error.message)
  }

  console.log('\n2. Testing subscription creation...')
  try {
    const subTest = await fetch(`${BASE_URL}/api/subscriptions/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'Standard' })
    })
    console.log(`   Subscription creation: ${subTest.status}`)
    const subResult = await subTest.json()
    console.log('   Response:', subResult)
  } catch (error) {
    console.log('   ❌ Subscription test failed:', error.message)
  }

  console.log('\n3. Testing KPay payment initiation...')
  try {
    const paymentTest = await fetch(`${BASE_URL}/api/kpay/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 50000,
        paymentMethod: 'momo',
        customerName: 'Test Customer',
        customerPhone: '+250788123456',
        customerEmail: 'test@example.com',
        details: 'Test payment'
      })
    })
    console.log(`   KPay initiation: ${paymentTest.status}`)
    const paymentResult = await paymentTest.json()
    console.log('   Response:', paymentResult)
  } catch (error) {
    console.log('   ❌ KPay test failed:', error.message)
  }

  console.log('\n📋 DIAGNOSIS')
  console.log('============')
  console.log('Main Issue: User authentication required')
  console.log('Solution: Ensure user is logged in before upgrade')
  console.log('\nQuick Fix Steps:')
  console.log('1. Go to login page: http://localhost:3000/login')
  console.log('2. Login as pharmacy owner')
  console.log('3. Navigate to settings: http://localhost:3000/settings')
  console.log('4. Try upgrade again')
}

debugPaymentFlow().catch(console.error)