const fetch = require('node-fetch');

async function testInventoryAPI() {
  const baseUrl = 'http://localhost:3000';
  
  // Test data for adding a product
  const testProduct = {
    name: 'Test Paracetamol 500mg',
    category: 'Pain Relief',
    batch_number: 'TEST001',
    quantity: '100',
    unit_cost: '400',
    selling_price: '500',
    minimum_stock_level: '20',
    expiry_date: '2025-12-31'
  };

  console.log('🧪 Testing Inventory API...\n');

  try {
    // Test 1: GET inventory (should work without auth for testing)
    console.log('1. Testing GET /api/inventory');
    const getResponse = await fetch(`${baseUrl}/api/inventory`);
    const getResult = await getResponse.json();
    console.log('GET Response:', getResponse.status, getResult);
    console.log('');

    // Test 2: POST new product (will fail without auth, but we can see the error)
    console.log('2. Testing POST /api/inventory/add');
    const postResponse = await fetch(`${baseUrl}/api/inventory/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testProduct)
    });
    const postResult = await postResponse.json();
    console.log('POST Response:', postResponse.status, postResult);
    console.log('');

    // Test 3: Check if server is running
    console.log('3. Testing server health');
    const healthResponse = await fetch(`${baseUrl}/api/health`).catch(() => null);
    if (healthResponse) {
      console.log('Server is running ✅');
    } else {
      console.log('Server might not be running ❌');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    console.log('\n💡 Make sure the Next.js server is running with: npm run dev');
  }
}

testInventoryAPI();