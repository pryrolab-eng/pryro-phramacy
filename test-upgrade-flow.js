const https = require('https');

// Test 1: Create subscription via API
async function testCreateSubscription() {
  console.log('Testing subscription creation...\n');
  
  const data = JSON.stringify({
    plan: 'Standard',
    useKPay: true
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/payments',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      // Add your auth cookie here
      'Cookie': 'YOUR_AUTH_COOKIE'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
        resolve(JSON.parse(body));
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Test 2: Initiate KPay payment
async function testKPayPayment(subscriptionId) {
  console.log('\nTesting KPay payment initiation...\n');
  
  const data = JSON.stringify({
    amount: 50000,
    subscriptionId: subscriptionId,
    paymentMethod: 'momo',
    bankId: '63510',
    customerName: 'Test Pharmacy',
    customerPhone: '250788123456',
    customerEmail: 'test@pryrox.com',
    details: 'Standard plan subscription'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/kpay/initiate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Cookie': 'YOUR_AUTH_COOKIE'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
        resolve(JSON.parse(body));
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Run tests
(async () => {
  try {
    console.log('='.repeat(60));
    console.log('Pryrox KPay Integration Test');
    console.log('='.repeat(60));
    console.log('\nMake sure:');
    console.log('1. Dev server is running (npm run dev)');
    console.log('2. SQL fix has been applied');
    console.log('3. You are logged in as pharmacy owner');
    console.log('4. Update YOUR_AUTH_COOKIE in this script\n');
    console.log('='.repeat(60));
    
    const subResult = await testCreateSubscription();
    
    if (subResult.requiresPayment && subResult.subscriptionId) {
      await testKPayPayment(subResult.subscriptionId);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Tests Complete!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
