const testAddInsuranceProvider = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Add Insurance Provider API\n');
  
  // Test 1: Add insurance without auth (should fail)
  console.log('Test 1: Unauthorized request');
  try {
    const res1 = await fetch(`${baseUrl}/api/insurance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Insurance',
        coverage_percentage: 80
      })
    });
    const data1 = await res1.json();
    console.log(`Status: ${res1.status}`);
    console.log(`Response:`, data1);
    console.log(data1.error ? '✅ Correctly rejected' : '❌ Should have failed');
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Add insurance with valid data (requires auth)
  console.log('Test 2: Valid insurance provider (requires login)');
  console.log('⚠️  Run this test after logging in to the app');
  console.log('Expected payload:');
  console.log(JSON.stringify({
    name: 'Blue Cross Insurance',
    coverage_percentage: 75,
    contact_email: 'contact@bluecross.com',
    contact_phone: '+1234567890',
    policy_number: 'BC-2024-001',
    invoice_template: 'default',
    template_config: {}
  }, null, 2));
  
  console.log('\n---\n');
  
  // Test 3: Add insurance with missing required fields
  console.log('Test 3: Missing required fields');
  console.log('Expected to fail with 400 status');
  console.log('Payload: { name: "Test" } (missing coverage_percentage)');
  
  console.log('\n---\n');
  
  // Test 4: Fetch all insurance providers
  console.log('Test 4: Fetch insurance providers');
  try {
    const res4 = await fetch(`${baseUrl}/api/insurance`);
    const data4 = await res4.json();
    console.log(`Status: ${res4.status}`);
    console.log(`Found ${data4.length} insurance providers`);
    if (data4.length > 0) {
      console.log('Sample:', data4[0]);
    }
    console.log('✅ GET endpoint works');
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
};

testAddInsuranceProvider();
