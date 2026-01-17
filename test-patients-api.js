async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/customers');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('Is Array:', Array.isArray(data));
    console.log('Length:', data.length);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
