async function testCustomerAPI() {
  console.log('Testing Customer API...\n');
  
  // Test GET customers
  console.log('1. Testing GET /api/customers');
  try {
    const response = await fetch('http://localhost:3000/api/customers');
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Customers found:', data.length);
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('GET Error:', error.message);
  }
  
  console.log('\n2. Testing POST /api/customers (without auth)');
  try {
    const response = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        phone: '+250788888888',
        insuranceNumber: 'TEST123'
      })
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('POST Error:', error.message);
  }
  
  console.log('\n3. Testing GET /api/customers again');
  try {
    const response = await fetch('http://localhost:3000/api/customers');
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Customers found:', data.length);
    console.log('Names:', data.map(c => c.name).join(', '));
  } catch (error) {
    console.error('GET Error:', error.message);
  }
}

testCustomerAPI();
