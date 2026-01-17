// Test Staff Access Isolation
// Run this in browser console after logging in as different users

async function testStaffAccess() {
  console.log('🧪 Testing Staff Access Isolation...\n')
  
  // Test 1: Get current user
  const userResponse = await fetch('/api/auth/user')
  const user = await userResponse.json()
  console.log('👤 Current User:', user.email)
  
  // Test 2: Get inventory
  const inventoryResponse = await fetch('/api/inventory')
  const inventory = await inventoryResponse.json()
  console.log('\n📦 Inventory Items:', inventory.length)
  
  if (inventory.length > 0) {
    console.log('   First item pharmacy_id:', inventory[0].pharmacy_id)
    console.log('   All pharmacy_ids:', [...new Set(inventory.map(i => i.pharmacy_id))])
    
    // Check if all items have same pharmacy_id
    const uniquePharmacies = new Set(inventory.map(i => i.pharmacy_id))
    if (uniquePharmacies.size === 1) {
      console.log('   ✓ All items from same pharmacy')
    } else {
      console.log('   ✗ ERROR: Items from multiple pharmacies!', uniquePharmacies)
    }
  }
  
  // Test 3: Get sales
  const salesResponse = await fetch('/api/sales')
  const sales = await salesResponse.json()
  console.log('\n💰 Sales:', sales.length)
  
  if (sales.length > 0) {
    const uniqueSalesPharmacies = new Set(sales.map(s => s.pharmacy_id))
    console.log('   Pharmacy IDs in sales:', uniqueSalesPharmacies)
  }
  
  // Test 4: Get customers
  const customersResponse = await fetch('/api/customers')
  const customers = await customersResponse.json()
  console.log('\n👥 Customers:', customers.length)
  
  console.log('\n📊 Summary:')
  console.log('   User:', user.email)
  console.log('   Inventory items:', inventory.length)
  console.log('   Sales:', sales.length)
  console.log('   Customers:', customers.length)
  console.log('\n✅ Test complete. Staff should only see their pharmacy\'s data.')
}

// Run the test
testStaffAccess()

// Instructions:
// 1. Login as muzungu@gmail.com (Kipharma owner) - run this test
// 2. Login as staff2rrr2muzunggu@gmail.com (Kipharma staff) - run this test
// 3. Login as jeanbizi@gmail.com (different pharmacy) - run this test
// 4. Compare results - staff should see SAME data as their pharmacy owner
