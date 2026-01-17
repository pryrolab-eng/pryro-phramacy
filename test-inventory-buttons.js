/**
 * Inventory Buttons Test Suite
 * Run this in the browser console while logged in to test all inventory functionality
 */

const testInventoryButtons = {
  baseUrl: window.location.origin,
  
  // Test 1: Get Inventory
  async testGetInventory() {
    console.log('🧪 Test 1: GET Inventory');
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory`);
      const data = await response.json();
      console.log('✅ GET Inventory:', response.status, data);
      return { success: response.ok, data };
    } catch (error) {
      console.error('❌ GET Inventory failed:', error);
      return { success: false, error };
    }
  },

  // Test 2: Add Product
  async testAddProduct() {
    console.log('🧪 Test 2: POST Add Product');
    try {
      const testProduct = {
        name: 'Test Paracetamol 500mg',
        category: 'Pain Relief',
        batch_number: 'TEST' + Date.now(),
        quantity: 100,
        unit_cost: 400,
        selling_price: 600,
        minimum_stock_level: 20,
        expiry_date: '2025-12-31'
      };
      
      const response = await fetch(`${this.baseUrl}/api/inventory/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testProduct)
      });
      
      const data = await response.json();
      console.log('✅ Add Product:', response.status, data);
      
      if (data.success && data.inventory) {
        this.testProductId = data.inventory.id;
        console.log('📝 Saved test product ID:', this.testProductId);
      }
      
      return { success: response.ok && data.success, data };
    } catch (error) {
      console.error('❌ Add Product failed:', error);
      return { success: false, error };
    }
  },

  // Test 3: Stock Adjustment (Increase)
  async testStockAdjustmentIncrease(productId) {
    console.log('🧪 Test 3: POST Stock Adjustment (Increase)');
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productId,
          quantity: 50,
          reason: 'Test increase adjustment',
          adjustmentType: 'increase'
        })
      });
      
      const data = await response.json();
      console.log('✅ Stock Adjustment (Increase):', response.status, data);
      return { success: response.ok && data.success, data };
    } catch (error) {
      console.error('❌ Stock Adjustment failed:', error);
      return { success: false, error };
    }
  },

  // Test 4: Stock Adjustment (Decrease)
  async testStockAdjustmentDecrease(productId) {
    console.log('🧪 Test 4: POST Stock Adjustment (Decrease)');
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productId,
          quantity: 25,
          reason: 'Test decrease adjustment',
          adjustmentType: 'decrease'
        })
      });
      
      const data = await response.json();
      console.log('✅ Stock Adjustment (Decrease):', response.status, data);
      return { success: response.ok && data.success, data };
    } catch (error) {
      console.error('❌ Stock Adjustment failed:', error);
      return { success: false, error };
    }
  },

  // Test 5: Purchase Stock
  async testPurchaseStock(productId) {
    console.log('🧪 Test 5: POST Purchase Stock');
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productId,
          quantity: 75,
          costPrice: 380,
          supplier: 'Test Supplier Ltd'
        })
      });
      
      const data = await response.json();
      console.log('✅ Purchase Stock:', response.status, data);
      return { success: response.ok && data.success, data };
    } catch (error) {
      console.error('❌ Purchase Stock failed:', error);
      return { success: false, error };
    }
  },

  // Test 6: Stock Transfer
  async testStockTransfer() {
    console.log('🧪 Test 6: POST Stock Transfer');
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: 'Test Paracetamol 500mg',
          quantity: 30,
          from: 'main-store',
          to: 'branch'
        })
      });
      
      const data = await response.json();
      console.log('✅ Stock Transfer:', response.status, data);
      return { success: response.ok && data.success, data };
    } catch (error) {
      console.error('❌ Stock Transfer failed:', error);
      return { success: false, error };
    }
  },

  // Test 7: Get Suppliers
  async testGetSuppliers() {
    console.log('🧪 Test 7: GET Suppliers');
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/suppliers`);
      const data = await response.json();
      console.log('✅ GET Suppliers:', response.status, data);
      return { success: response.ok, data };
    } catch (error) {
      console.error('❌ GET Suppliers failed:', error);
      return { success: false, error };
    }
  },

  // Test 8: Get Analytics
  async testGetAnalytics() {
    console.log('🧪 Test 8: GET Analytics');
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/analytics`);
      const data = await response.json();
      console.log('✅ GET Analytics:', response.status, data);
      return { success: response.ok, data };
    } catch (error) {
      console.error('❌ GET Analytics failed:', error);
      return { success: false, error };
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Inventory Buttons Test Suite...\n');
    
    const results = {
      passed: 0,
      failed: 0,
      tests: []
    };

    // Test 1: Get Inventory
    const test1 = await this.testGetInventory();
    results.tests.push({ name: 'GET Inventory', ...test1 });
    test1.success ? results.passed++ : results.failed++;
    await this.delay(500);

    // Test 2: Add Product
    const test2 = await this.testAddProduct();
    results.tests.push({ name: 'Add Product', ...test2 });
    test2.success ? results.passed++ : results.failed++;
    await this.delay(500);

    // Get the product ID for subsequent tests
    const inventory = await this.testGetInventory();
    const productId = inventory.data && inventory.data.length > 0 
      ? inventory.data[0].id 
      : this.testProductId;

    if (productId) {
      // Test 3: Stock Adjustment Increase
      const test3 = await this.testStockAdjustmentIncrease(productId);
      results.tests.push({ name: 'Stock Adjustment (Increase)', ...test3 });
      test3.success ? results.passed++ : results.failed++;
      await this.delay(500);

      // Test 4: Stock Adjustment Decrease
      const test4 = await this.testStockAdjustmentDecrease(productId);
      results.tests.push({ name: 'Stock Adjustment (Decrease)', ...test4 });
      test4.success ? results.passed++ : results.failed++;
      await this.delay(500);

      // Test 5: Purchase Stock
      const test5 = await this.testPurchaseStock(productId);
      results.tests.push({ name: 'Purchase Stock', ...test5 });
      test5.success ? results.passed++ : results.failed++;
      await this.delay(500);
    } else {
      console.warn('⚠️ No product ID available, skipping adjustment and purchase tests');
    }

    // Test 6: Stock Transfer
    const test6 = await this.testStockTransfer();
    results.tests.push({ name: 'Stock Transfer', ...test6 });
    test6.success ? results.passed++ : results.failed++;
    await this.delay(500);

    // Test 7: Get Suppliers
    const test7 = await this.testGetSuppliers();
    results.tests.push({ name: 'GET Suppliers', ...test7 });
    test7.success ? results.passed++ : results.failed++;
    await this.delay(500);

    // Test 8: Get Analytics
    const test8 = await this.testGetAnalytics();
    results.tests.push({ name: 'GET Analytics', ...test8 });
    test8.success ? results.passed++ : results.failed++;

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📝 Total: ${results.tests.length}`);
    console.log('='.repeat(50));
    
    results.tests.forEach((test, index) => {
      const icon = test.success ? '✅' : '❌';
      console.log(`${icon} ${index + 1}. ${test.name}`);
    });
    
    return results;
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('📋 Inventory Test Suite Loaded!');
  console.log('Run: testInventoryButtons.runAllTests()');
  console.log('Or run individual tests like: testInventoryButtons.testGetInventory()');
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testInventoryButtons;
}
