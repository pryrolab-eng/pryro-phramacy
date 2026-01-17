const SUPABASE_URL = 'https://seoqhxpclcueylldhiuy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc';

async function testInsuranceAPI() {
  console.log('🧪 Testing Insurance API with Authentication\n');

  // Step 1: Login
  console.log('Step 1: Logging in as superadmin...');
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      email: 'superadmin@pyro.rw',
      password: 'SuperAdmin123!'
    })
  });

  const loginData = await loginRes.json();
  
  console.log('Login response:', JSON.stringify(loginData, null, 2));
  
  if (loginData.error) {
    console.log('❌ Login failed:', loginData.error);
    return;
  }

  const accessToken = loginData.access_token;
  console.log('✅ Login successful');
  console.log('User ID:', loginData.user?.id || 'N/A');
  console.log('Token:', accessToken ? accessToken.substring(0, 20) + '...' : 'No token', '\n');

  // Step 2: Test Add Insurance
  console.log('Step 2: Adding insurance provider...');
  const addRes = await fetch('http://localhost:3000/api/insurance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sb-access-token=${accessToken}; sb-refresh-token=${loginData.refresh_token}`
    },
    body: JSON.stringify({
      name: 'Test Insurance Provider',
      coverage_percentage: 85,
      contact_email: 'test@insurance.com',
      contact_phone: '+1234567890'
    })
  });

  const addData = await addRes.json();
  console.log('Status:', addRes.status);
  console.log('Response:', JSON.stringify(addData, null, 2));

  if (addData.success) {
    console.log('\n✅ Insurance added successfully!');
  } else {
    console.log('\n❌ Failed to add insurance');
    console.log('Error:', addData.error);
  }
}

testInsuranceAPI().catch(console.error);
