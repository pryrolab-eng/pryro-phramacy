async function testFullFlow() {
  console.log('=== Testing Full Customer Flow ===\n');
  
  // Step 1: Add a customer via quick-add-patient
  console.log('1. Adding customer via quick-add-patient API');
  try {
    const addResponse = await fetch('http://localhost:3000/api/pos/quick-add-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: 'John Doe',
        phoneNumber: '+250788777777',
        insuranceNumber: 'INS999'
      })
    });
    const addResult = await addResponse.json();
    console.log('Add Status:', addResponse.status);
    console.log('Add Result:', JSON.stringify(addResult, null, 2));
  } catch (error) {
    console.error('Add Error:', error.message);
  }
  
  // Step 2: Search for the customer
  console.log('\n2. Searching for "John" via customers API');
  try {
    const searchResponse = await fetch('http://localhost:3000/api/customers?q=John');
    const searchResult = await searchResponse.json();
    console.log('Search Status:', searchResponse.status);
    console.log('Search Results:', JSON.stringify(searchResult, null, 2));
  } catch (error) {
    console.error('Search Error:', error.message);
  }
  
  // Step 3: Get all customers
  console.log('\n3. Getting all customers');
  try {
    const allResponse = await fetch('http://localhost:3000/api/customers');
    const allResult = await allResponse.json();
    console.log('All Customers Count:', allResult.length);
    console.log('Customer Names:', allResult.map(c => c.name).join(', '));
  } catch (error) {
    console.error('Get All Error:', error.message);
  }
}

testFullFlow();
