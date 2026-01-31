// Test KPay Integration
// Run: node test-kpay-integration.js

const testPaymentInitiation = async () => {
  console.log('Testing KPay Payment Initiation...\n')

  const testData = {
    amount: 5000,
    paymentMethod: 'momo',
    bankId: '63510',
    customerName: 'Test Customer',
    customerPhone: '250788123456',
    customerEmail: 'test@example.com',
    details: 'Test pharmacy payment'
  }

  try {
    const response = await fetch('http://localhost:3000/api/kpay/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'YOUR_AUTH_COOKIE_HERE' // Replace with actual auth cookie
      },
      body: JSON.stringify(testData)
    })

    const result = await response.json()
    console.log('Response Status:', response.status)
    console.log('Response Data:', JSON.stringify(result, null, 2))

    if (result.success) {
      console.log('\n✓ Payment initiated successfully!')
      console.log('Transaction ID:', result.transaction.id)
      console.log('KPay TID:', result.transaction.tid)
      console.log('Checkout URL:', result.transaction.checkoutUrl)
      
      // Test status check
      if (result.transaction.id) {
        await testStatusCheck(result.transaction.id)
      }
    } else {
      console.log('\n✗ Payment initiation failed')
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

const testStatusCheck = async (transactionId) => {
  console.log('\n\nTesting Payment Status Check...\n')

  try {
    const response = await fetch(
      `http://localhost:3000/api/kpay/status?transactionId=${transactionId}`,
      {
        headers: {
          'Cookie': 'YOUR_AUTH_COOKIE_HERE' // Replace with actual auth cookie
        }
      }
    )

    const result = await response.json()
    console.log('Status Response:', JSON.stringify(result, null, 2))

    if (result.transaction) {
      console.log('\n✓ Status check successful!')
      console.log('Payment Status:', result.transaction.status)
      console.log('KPay Status:', result.kpayStatus.statusdesc)
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

const testWebhook = async () => {
  console.log('\n\nTesting Webhook Endpoint...\n')

  const webhookData = {
    tid: 'E6974831594723691',
    refid: 'PYX-1234567890-abc123',
    momtransactionid: '85640192',
    payaccount: '250788123456',
    statusid: '01',
    statusdesc: 'Successfully processed transaction.'
  }

  try {
    const response = await fetch('http://localhost:3000/api/kpay/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    })

    const result = await response.json()
    console.log('Webhook Response:', JSON.stringify(result, null, 2))

    if (result.reply === 'OK') {
      console.log('\n✓ Webhook processed successfully!')
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Run tests
console.log('='.repeat(60))
console.log('KPay Integration Test Suite')
console.log('='.repeat(60))
console.log('\nMake sure:')
console.log('1. Your dev server is running (npm run dev)')
console.log('2. Database migrations are applied')
console.log('3. Environment variables are set')
console.log('4. You have a valid auth session\n')
console.log('='.repeat(60))

testPaymentInitiation()
