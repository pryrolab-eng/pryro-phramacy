// Test Add Inventory API
// Run this in browser console or as a Node script

const testAddInventory = async () => {
  console.log('🧪 Testing Add Inventory API...')
  
  const testData = {
    name: 'Test Medicine ' + Date.now(),
    category: 'Pain Relief',
    batch_number: 'TEST' + Date.now(),
    quantity: 100,
    unit_cost: 500,
    selling_price: 800,
    minimum_stock_level: 20,
    expiry_date: '2025-12-31'
  }
  
  console.log('📤 Sending data:', testData)
  
  try {
    const response = await fetch('/api/inventory/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    console.log('📥 Response status:', response.status)
    console.log('📥 Response ok:', response.ok)
    
    const result = await response.json()
    console.log('📥 Response data:', result)
    
    if (response.ok && result.success) {
      console.log('✅ SUCCESS: Inventory added')
      console.log('   Inventory ID:', result.inventory?.id)
      console.log('   Pharmacy ID:', result.inventory?.pharmacy_id)
    } else {
      console.error('❌ FAILED:', result.error)
      console.error('   Details:', result.details)
    }
    
    return result
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.error('   Stack:', error.stack)
    return { error: error.message }
  }
}

// Run the test
testAddInventory()
