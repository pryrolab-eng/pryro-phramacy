const readline = require('readline');

const BASE_URL = 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function showMenu() {
  console.clear();
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   GLOBAL CATEGORIES TEST INTERFACE    ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log('1. View Admin Global Categories');
  console.log('2. Add New Global Category (Admin)');
  console.log('3. View Pharmacy Categories (requires auth)');
  console.log('4. Test Category Visibility');
  console.log('5. Delete Global Category');
  console.log('6. Exit\n');
}

async function viewAdminCategories() {
  console.log('\n📋 Fetching admin global categories...\n');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/categories`);
    const categories = await response.json();
    
    if (categories.length === 0) {
      console.log('❌ No global categories found\n');
    } else {
      console.log(`✅ Found ${categories.length} global categories:\n`);
      categories.forEach((cat, i) => {
        console.log(`${i + 1}. ${cat.name}`);
        console.log(`   Description: ${cat.description || 'N/A'}`);
        console.log(`   ID: ${cat.id}`);
        console.log(`   Global: ${cat.is_global ? '✓' : '✗'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  await question('Press Enter to continue...');
}

async function addGlobalCategory() {
  console.log('\n➕ Add New Global Category\n');
  const name = await question('Category name: ');
  const description = await question('Description: ');
  
  if (!name.trim()) {
    console.log('❌ Name is required\n');
    await question('Press Enter to continue...');
    return;
  }
  
  console.log('\n⏳ Creating category...\n');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Category created successfully!');
      console.log(`   Name: ${result.category.name}`);
      console.log(`   ID: ${result.category.id}`);
      console.log(`   Global: ${result.category.is_global ? '✓' : '✗'}\n`);
    } else {
      console.log(`❌ Failed: ${result.error}\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  await question('Press Enter to continue...');
}

async function viewPharmacyCategories() {
  console.log('\n📋 Fetching pharmacy categories...\n');
  console.log('⚠️  Note: This requires authentication\n');
  try {
    const response = await fetch(`${BASE_URL}/api/categories`);
    const categories = await response.json();
    
    if (categories.length === 0) {
      console.log('❌ No categories found (authentication required)\n');
    } else {
      console.log(`✅ Found ${categories.length} categories:\n`);
      categories.forEach((cat, i) => {
        console.log(`${i + 1}. ${cat.name}`);
        console.log(`   Global: ${cat.is_global ? '✓ (visible to all)' : '✗ (pharmacy-specific)'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  await question('Press Enter to continue...');
}

async function testVisibility() {
  console.log('\n🔍 Testing Category Visibility\n');
  console.log('Checking database directly...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/categories`);
    const globalCats = await response.json();
    
    console.log(`Global Categories (visible to all): ${globalCats.length}`);
    globalCats.forEach(cat => {
      console.log(`  • ${cat.name} (is_global: ${cat.is_global}, pharmacy_id: ${cat.pharmacy_id || 'null'})`);
    });
    
    console.log('\n✅ All global categories should be visible to pharmacies when logged in\n');
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  await question('Press Enter to continue...');
}

async function deleteCategory() {
  console.log('\n🗑️  Delete Global Category\n');
  
  // First show categories
  try {
    const response = await fetch(`${BASE_URL}/api/admin/categories`);
    const categories = await response.json();
    
    if (categories.length === 0) {
      console.log('❌ No categories to delete\n');
      await question('Press Enter to continue...');
      return;
    }
    
    console.log('Available categories:\n');
    categories.forEach((cat, i) => {
      console.log(`${i + 1}. ${cat.name} (ID: ${cat.id})`);
    });
    
    const choice = await question('\nEnter category number to delete (0 to cancel): ');
    const index = parseInt(choice) - 1;
    
    if (index < 0 || index >= categories.length) {
      console.log('❌ Cancelled\n');
      await question('Press Enter to continue...');
      return;
    }
    
    const category = categories[index];
    const confirm = await question(`Delete "${category.name}"? (yes/no): `);
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled\n');
      await question('Press Enter to continue...');
      return;
    }
    
    console.log('\n⏳ Deleting...\n');
    const deleteResponse = await fetch(`${BASE_URL}/api/admin/categories/${category.id}`, {
      method: 'DELETE'
    });
    const result = await deleteResponse.json();
    
    if (result.success) {
      console.log(`✅ Category "${category.name}" deleted successfully!\n`);
    } else {
      console.log(`❌ Failed: ${result.error}\n`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
  await question('Press Enter to continue...');
}

async function main() {
  console.log('\n🚀 Starting Global Categories Test Interface...\n');
  console.log('Make sure your Next.js server is running on http://localhost:3000\n');
  
  while (true) {
    await showMenu();
    const choice = await question('Select option (1-6): ');
    
    switch (choice) {
      case '1':
        await viewAdminCategories();
        break;
      case '2':
        await addGlobalCategory();
        break;
      case '3':
        await viewPharmacyCategories();
        break;
      case '4':
        await testVisibility();
        break;
      case '5':
        await deleteCategory();
        break;
      case '6':
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);
      default:
        console.log('\n❌ Invalid option\n');
        await question('Press Enter to continue...');
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
