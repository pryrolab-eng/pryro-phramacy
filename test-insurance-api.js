const fetch = require('node-fetch');

const SUPABASE_URL = 'https://seoqhxpclcueylldhiuy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc';

async function testInsuranceAPI() {
  console.log('🔐 Step 1: Authenticating as superadmin...');
  
  // Login as superadmin
  const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      email: 'abdousentore@gmail.com',
      password: 'admin123'
    })
  });

  const loginData = await loginResponse.json();
  
  if (!loginData.access_token) {
    console.error('❌ Login failed:', loginData);
    return;
  }
  
  console.log('✅ Login successful!');
  const accessToken = loginData.access_token;

  // Test adding insurance
  console.log('\n📝 Step 2: Adding insurance provider...');
  
  const insuranceData = {
    name: 'MMI',
    coverage_percentage: 80,
    contact_email: 'MMI@gmail.com',
    contact_phone: '07842942',
    policy_number: 'Policy reference number',
    invoice_template: 'default'
  };

  const addResponse = await fetch('http://localhost:3000/api/insurance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sb-access-token=${accessToken}; sb-refresh-token=${loginData.refresh_token}`
    },
    body: JSON.stringify(insuranceData)
  });

  const addResult = await addResponse.json();
  console.log('Response status:', addResponse.status);
  console.log('Response:', JSON.stringify(addResult, null, 2));

  if (addResult.success) {
    console.log('✅ Insurance provider added successfully!');
  } else {
    console.log('❌ Failed to add insurance provider');
  }

  // Test fetching insurance
  console.log('\n📋 Step 3: Fetching insurance providers...');
  
  const getResponse = await fetch('http://localhost:3000/api/insurance', {
    headers: {
      'Cookie': `sb-access-token=${accessToken}; sb-refresh-token=${loginData.refresh_token}`
    }
  });

  const providers = await getResponse.json();
  console.log('Insurance providers:', JSON.stringify(providers, null, 2));
}

testInsuranceAPI().catch(console.error);
