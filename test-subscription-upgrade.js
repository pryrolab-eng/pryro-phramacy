const BASE_URL = 'http://localhost:3000'

async function testSubscriptionUpgrade() {
  console.log('🧪 Testing Subscription Upgrade Flow\n')

  // Step 1: Login
  console.log('1️⃣ Logging in...')
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'muzungu@pryrox.com',
      password: 'Pryrox@2024'
    })
  })
  
  if (!loginRes.ok) {
    console.error('❌ Login failed:', await loginRes.text())
    return
  }
  
  const cookies = loginRes.headers.get('set-cookie')
  console.log('✅ Login successful\n')

  // Step 2: Get current subscription status
  console.log('2️⃣ Checking current subscription...')
  const statusRes = await fetch(`${BASE_URL}/api/subscriptions/status`, {
    headers: { Cookie: cookies }
  })
  
  if (statusRes.ok) {
    const status = await statusRes.json()
    console.log('Current Plan:', status.plan?.name || 'None')
    console.log('Status:', status.status)
    console.log('Active:', status.isActive)
    console.log('✅ Status check successful\n')
  } else {
    console.log('⚠️ Could not fetch status\n')
  }

  // Step 3: Get available plans
  console.log('3️⃣ Fetching available plans...')
  const plansRes = await fetch(`${BASE_URL}/api/plans`, {
    headers: { Cookie: cookies }
  })
  
  if (!plansRes.ok) {
    console.error('❌ Failed to fetch plans')
    return
  }
  
  const plans = await plansRes.json()
  console.log('Available plans:', plans.map(p => `${p.name} (${p.price} RWF)`).join(', '))
  console.log('✅ Plans fetched\n')

  // Step 4: Test Free Plan Upgrade
  console.log('4️⃣ Testing Free Plan upgrade...')
  const freePlan = plans.find(p => p.price === 0)
  
  if (freePlan) {
    const upgradeRes = await fetch(`${BASE_URL}/api/subscriptions/upgrade`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: cookies 
      },
      body: JSON.stringify({ planId: freePlan.id })
    })
    
    if (upgradeRes.ok) {
      const result = await upgradeRes.json()
      console.log('✅ Free plan upgrade successful')
      console.log('Subscription ID:', result.subscription.id)
      console.log('Active:', result.subscription.isActive)
      console.log('Requires Payment:', result.subscription.requiresPayment)
    } else {
      console.error('❌ Free plan upgrade failed:', await upgradeRes.text())
    }
  }
  console.log()

  // Step 5: Test Paid Plan (Standard)
  console.log('5️⃣ Testing Paid Plan upgrade (Standard)...')
  const standardPlan = plans.find(p => p.name === 'Standard')
  
  if (standardPlan) {
    const upgradeRes = await fetch(`${BASE_URL}/api/subscriptions/upgrade`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: cookies 
      },
      body: JSON.stringify({ planId: standardPlan.id })
    })
    
    if (upgradeRes.ok) {
      const result = await upgradeRes.json()
      console.log('✅ Subscription created')
      console.log('Subscription ID:', result.subscription.id)
      console.log('Active:', result.subscription.isActive, '(should be false)')
      console.log('Requires Payment:', result.subscription.requiresPayment, '(should be true)')
      console.log('Amount:', result.subscription.amount, 'RWF')
      
      // Step 6: Initiate payment
      console.log('\n6️⃣ Initiating payment...')
      const paymentRes = await fetch(`${BASE_URL}/api/kpay/initiate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Cookie: cookies 
        },
        body: JSON.stringify({
          amount: result.subscription.amount,
          subscriptionId: result.subscription.id,
          paymentMethod: 'momo',
          bankId: '63510',
          customerName: 'Test User',
          customerPhone: '0788123456',
          customerEmail: 'test@pryrox.com',
          details: 'Standard plan subscription'
        })
      })
      
      if (paymentRes.ok) {
        const payment = await paymentRes.json()
        console.log('✅ Payment initiated')
        console.log('Transaction ID:', payment.transaction?.id)
        console.log('KPay TID:', payment.transaction?.tid)
        console.log('Status:', payment.transaction?.status)
        console.log('Checkout URL:', payment.transaction?.checkoutUrl || 'N/A')
        
        // Step 7: Simulate webhook (payment completion)
        console.log('\n7️⃣ Simulating payment completion webhook...')
        const webhookRes = await fetch(`${BASE_URL}/api/kpay/webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tid: payment.transaction.tid,
            refid: payment.transaction.refid,
            statusid: '01',
            statusdesc: 'Transaction successful',
            momtransactionid: 'TEST123456',
            payaccount: '0788123456'
          })
        })
        
        if (webhookRes.ok) {
          console.log('✅ Webhook processed')
          
          // Step 8: Verify subscription is now active
          console.log('\n8️⃣ Verifying subscription activation...')
          const finalStatusRes = await fetch(`${BASE_URL}/api/subscriptions/status`, {
            headers: { Cookie: cookies }
          })
          
          if (finalStatusRes.ok) {
            const finalStatus = await finalStatusRes.json()
            console.log('✅ Final status check')
            console.log('Plan:', finalStatus.plan?.name)
            console.log('Active:', finalStatus.isActive, finalStatus.isActive ? '✅' : '❌')
            console.log('Status:', finalStatus.status)
          }
        } else {
          console.error('❌ Webhook failed:', await webhookRes.text())
        }
      } else {
        console.error('❌ Payment initiation failed:', await paymentRes.text())
      }
    } else {
      console.error('❌ Paid plan upgrade failed:', await upgradeRes.text())
    }
  }
  
  console.log('\n✅ Test completed!')
}

testSubscriptionUpgrade().catch(console.error)
