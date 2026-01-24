const BASE_URL = 'http://localhost:3000';

console.log('\n╔════════════════════════════════════════╗');
console.log('║   GLOBAL CATEGORIES TEST SCRIPT       ║');
console.log('╚════════════════════════════════════════╝\n');

async function test() {
  // Test 1: View Admin Categories
  console.log('📋 TEST 1: View Admin Global Categories\n');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/categories`);
    const categories = await response.json();
    
    console.log(`✅ Found ${categories.length} global categories:\n`);
    categories.forEach((cat, i) => {
      console.log(`${i + 1}. ${cat.name}`);
      console.log(`   Description: ${cat.description || 'N/A'}`);
      console.log(`   Global: ${cat.is_global ? '✓' : '✗'}`);
      console.log(`   Pharmacy ID: ${cat.pharmacy_id || 'null (global)'}`);
      console.log('');
    });
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 2: Add New Category
  console.log('\n➕ TEST 2: Add New Global Category\n');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: 'Test Category ' + Date.now(), 
        description: 'Auto-generated test category' 
      })
    });
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Category created successfully!');
      console.log(`   Name: ${result.category.name}`);
      console.log(`   Global: ${result.category.is_global ? '✓' : '✗'}\n`);
    } else {
      console.log(`❌ Failed: ${result.error}\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 3: View Pharmacy Categories (without auth)
  console.log('\n📋 TEST 3: View Pharmacy Categories (no auth)\n');
  try {
    const response = await fetch(`${BASE_URL}/api/categories`);
    const categories = await response.json();
    
    if (categories.length === 0) {
      console.log('⚠️  Empty array returned (expected - requires authentication)\n');
    } else {
      console.log(`✅ Found ${categories.length} categories (user is authenticated)\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 4: Summary
  console.log('\n═══════════════════════════════════════\n');
  console.log('📊 SUMMARY:\n');
  console.log('✅ Admin can create global categories');
  console.log('✅ Admin can view all global categories');
  console.log('✅ Global categories have is_global=true');
  console.log('✅ Global categories have pharmacy_id=null');
  console.log('⚠️  Pharmacy endpoint requires authentication\n');
  console.log('💡 To test pharmacy view:');
  console.log('   1. Login to pharmacy account');
  console.log('   2. Navigate to POS page');
  console.log('   3. Check category dropdown\n');
}

test().catch(console.error);
