#!/usr/bin/env node

/**
 * Inventory Buttons Verification Script
 * Checks that all buttons are properly implemented in the code
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Inventory Buttons Implementation...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Read the inventory page file
const inventoryPagePath = path.join(__dirname, 'src', 'app', '(dashboard)', 'inventory', 'page.tsx');
const inventoryPage = fs.readFileSync(inventoryPagePath, 'utf8');

// Check 1: Export Button
console.log('1️⃣ Checking Export Button...');
if (inventoryPage.includes('exportToExcel') && inventoryPage.includes('onClick={exportToExcel}')) {
  console.log('   ✅ Export button properly wired to exportToExcel function');
  checks.passed++;
} else {
  console.log('   ❌ Export button not properly implemented');
  checks.failed++;
}

// Check 2: Import Button
console.log('\n2️⃣ Checking Import Button...');
if (inventoryPage.includes('setIsImportDialogOpen') && inventoryPage.includes('handleExcelImport')) {
  console.log('   ✅ Import button properly wired with dialog and handler');
  checks.passed++;
} else {
  console.log('   ❌ Import button not properly implemented');
  checks.failed++;
}

// Check 3: Add Product Button
console.log('\n3️⃣ Checking Add Product Button...');
if (inventoryPage.includes('setIsAddingProduct') && inventoryPage.includes('handleAddProduct')) {
  console.log('   ✅ Add Product button properly wired with dialog and handler');
  checks.passed++;
} else {
  console.log('   ❌ Add Product button not properly implemented');
  checks.failed++;
}

// Check 4: Stock Adjustment
console.log('\n4️⃣ Checking Stock Adjustment...');
if (inventoryPage.includes('handleAdjustment') && 
    inventoryPage.includes('/api/inventory/adjustment') &&
    inventoryPage.includes('adjustmentDialogOpen')) {
  console.log('   ✅ Stock Adjustment properly implemented with API call');
  checks.passed++;
} else {
  console.log('   ❌ Stock Adjustment not properly implemented');
  checks.failed++;
}

// Check 5: Purchase Stock
console.log('\n5️⃣ Checking Purchase Stock...');
if (inventoryPage.includes('handlePurchase') && 
    inventoryPage.includes('/api/inventory/purchase') &&
    inventoryPage.includes('purchaseDialogOpen')) {
  console.log('   ✅ Purchase Stock properly implemented with API call');
  checks.passed++;
} else {
  console.log('   ❌ Purchase Stock not properly implemented');
  checks.failed++;
}

// Check 6: Stock Transfer
console.log('\n6️⃣ Checking Stock Transfer...');
if (inventoryPage.includes('handleTransfer') && 
    inventoryPage.includes('/api/inventory/transfers') &&
    inventoryPage.includes('transferDialogOpen')) {
  console.log('   ✅ Stock Transfer properly implemented with API call');
  checks.passed++;
} else {
  console.log('   ❌ Stock Transfer not properly implemented');
  checks.failed++;
}

// Check 7: Toast notifications
console.log('\n7️⃣ Checking Toast Notifications...');
if (inventoryPage.includes('toast({') && inventoryPage.includes('title:') && inventoryPage.includes('description:')) {
  console.log('   ✅ Toast notifications implemented for user feedback');
  checks.passed++;
} else {
  console.log('   ⚠️  Toast notifications may not be properly implemented');
  checks.warnings++;
}

// Check API Routes
console.log('\n\n📡 Checking API Routes...\n');

// Check Adjustment API
const adjustmentApiPath = path.join(__dirname, 'src', 'app', 'api', 'inventory', 'adjustment', 'route.ts');
if (fs.existsSync(adjustmentApiPath)) {
  const adjustmentApi = fs.readFileSync(adjustmentApiPath, 'utf8');
  if (adjustmentApi.includes('createClient') && adjustmentApi.includes('supabase') && !adjustmentApi.includes('localStorage')) {
    console.log('8️⃣ ✅ Adjustment API uses Supabase (not localStorage)');
    checks.passed++;
  } else {
    console.log('8️⃣ ❌ Adjustment API not properly using Supabase');
    checks.failed++;
  }
} else {
  console.log('8️⃣ ❌ Adjustment API route not found');
  checks.failed++;
}

// Check Purchase API
const purchaseApiPath = path.join(__dirname, 'src', 'app', 'api', 'inventory', 'purchase', 'route.ts');
if (fs.existsSync(purchaseApiPath)) {
  const purchaseApi = fs.readFileSync(purchaseApiPath, 'utf8');
  if (purchaseApi.includes('createClient') && purchaseApi.includes('supabase') && !purchaseApi.includes('localStorage')) {
    console.log('9️⃣ ✅ Purchase API uses Supabase (not localStorage)');
    checks.passed++;
  } else {
    console.log('9️⃣ ❌ Purchase API not properly using Supabase');
    checks.failed++;
  }
} else {
  console.log('9️⃣ ❌ Purchase API route not found');
  checks.failed++;
}

// Check Transfer API
const transferApiPath = path.join(__dirname, 'src', 'app', 'api', 'inventory', 'transfers', 'route.ts');
if (fs.existsSync(transferApiPath)) {
  console.log('🔟 ✅ Transfer API route exists');
  checks.passed++;
} else {
  console.log('🔟 ❌ Transfer API route not found');
  checks.failed++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed:   ${checks.passed}`);
console.log(`❌ Failed:   ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);
console.log(`📝 Total:    ${checks.passed + checks.failed + checks.warnings}`);
console.log('='.repeat(60));

if (checks.failed === 0) {
  console.log('\n🎉 All checks passed! Inventory buttons are properly implemented.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review the implementation.');
  process.exit(1);
}
