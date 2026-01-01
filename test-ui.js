// Simple Node.js test for inventory form
const testData = {
  name: 'Test Paracetamol 500mg',
  category: 'Pain Relief',
  batch_number: 'TEST001',
  quantity: 100,
  unit_cost: 400,
  selling_price: 500,
  minimum_stock_level: 20,
  expiry_date: '2025-12-31'
};

console.log('🧪 Testing Inventory Form Data Mapping...\n');

// Simulate the form data transformation from UI
const formData = {
  productCode: '',
  name: 'Test Paracetamol 500mg',
  category: 'Pain Relief',
  batchNumber: 'TEST001',
  stock: '100',
  purchasePrice: '400',
  price: '500',
  minStock: '20',
  expiryDate: '2025-12-31'
};

// Simulate the handleAddProduct transformation
const apiPayload = {
  name: formData.name,
  category: formData.category,
  batch_number: formData.batchNumber || 'BATCH001',
  quantity: parseInt(formData.stock) || 0,
  unit_cost: parseFloat(formData.purchasePrice) || 0,
  selling_price: parseFloat(formData.price) || 0,
  minimum_stock_level: parseInt(formData.minStock) || 0,
  expiry_date: formData.expiryDate || '2025-12-31'
};

console.log('📝 Form Data:', formData);
console.log('\n🔄 API Payload:', apiPayload);

// Validate required fields
const isValid = !!(apiPayload.name && apiPayload.category && apiPayload.quantity && apiPayload.minimum_stock_level);
console.log('\n✅ Validation:', isValid ? 'PASSED' : 'FAILED');

// Category mapping test
const categoryMap = {
  'Pain Relief': 'otc',
  'Antibiotics': 'prescription', 
  'Vitamins': 'supplement',
  'Prescription': 'prescription'
};

const mappedCategory = categoryMap[apiPayload.category] || 'otc';
console.log('\n🏷️  Category Mapping:', `"${apiPayload.category}" → "${mappedCategory}"`);

console.log('\n🎯 Expected API Response: {"success": false, "error": "Unauthorized"} (without auth)');
console.log('🎯 With Auth: Should create medication and inventory records');