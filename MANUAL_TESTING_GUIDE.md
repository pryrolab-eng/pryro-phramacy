# Manual Testing Guide for Inventory Buttons

## Prerequisites
1. Start the development server: `npm run dev`
2. Navigate to: http://localhost:3000
3. Login to your pharmacy account
4. Go to Inventory page

## Test Cases

### ✅ Test 1: Export Button
**Location**: Top right header, next to Import button

**Steps**:
1. Click the "Export" button (with Download icon)
2. Check that an Excel file downloads
3. Open the Excel file
4. Verify it contains inventory data with columns:
   - Product Name
   - Category
   - Stock
   - Min Stock
   - Price (RWF)
   - Expiry Date
   - Batch Number

**Expected Result**: ✅ Excel file downloads with current inventory data

---

### ✅ Test 2: Import Button
**Location**: Top right header, between Export and Add Product

**Steps**:
1. Click the "Import" button (with Upload icon)
2. Dialog should open with instructions
3. Click "Download Sample" to get template
4. Click "Choose File" to upload Excel
5. Upload a valid Excel file
6. Review the preview
7. Click "Import X Products"

**Expected Result**: ✅ Dialog opens, sample downloads, products import successfully

---

### ✅ Test 3: Add Product Button
**Location**: Top right header, rightmost button

**Steps**:
1. Click the "Add Product" button (with Plus icon)
2. Dialog opens with product form
3. Fill in required fields:
   - Product Name: "Test Medicine"
   - Category: Select "Pain Relief"
   - Initial Stock: 100
   - Minimum Stock Alert: 20
4. Click "Add Product"
5. Check for success message
6. Verify product appears in inventory table

**Expected Result**: ✅ Product is added to database and appears in inventory

---

### ✅ Test 4: Stock Adjustment (Actions Tab)
**Location**: Actions tab → Stock Management section

**Steps**:
1. Click on "Actions" tab
2. Click "Stock Adjustment" button
3. Dialog opens
4. Select a product from dropdown
5. Choose "Increase Stock" or "Decrease Stock"
6. Enter quantity (e.g., 50)
7. Enter reason (e.g., "Inventory correction")
8. Click "Adjust Stock"
9. Check for success toast notification
10. Verify stock updated in inventory table

**Expected Result**: ✅ Stock quantity updates in database, toast shows success

---

### ✅ Test 5: Purchase Stock (Actions Tab)
**Location**: Actions tab → Stock Management section

**Steps**:
1. Click on "Actions" tab
2. Click "Purchase Stock" button
3. Dialog opens
4. Select a product from dropdown
5. Enter purchase quantity (e.g., 75)
6. Enter cost price per unit (e.g., 380)
7. Select or add a supplier
8. Click "Purchase Stock"
9. Check for success toast notification
10. Verify stock increased in inventory table

**Expected Result**: ✅ Stock increases, cost updated, toast shows success

---

### ✅ Test 6: Stock Transfer (Actions Tab)
**Location**: Actions tab → Stock Management section

**Steps**:
1. Click on "Actions" tab
2. Click "Stock Transfer" button
3. Dialog opens
4. Select a product from dropdown
5. Enter transfer quantity (e.g., 30)
6. Select "From Location" (e.g., Main Store)
7. Select "To Location" (e.g., Branch)
8. Click "Transfer Stock"
9. Check for success toast notification

**Expected Result**: ✅ Transfer record created, toast shows success

---

### ✅ Test 7: Export to Excel (Actions Tab)
**Location**: Actions tab → Data Management section

**Steps**:
1. Click on "Actions" tab
2. Click "Export to Excel" button
3. Excel file should download

**Expected Result**: ✅ Same as Test 1 - Excel file downloads

---

### ✅ Test 8: Import from Excel (Actions Tab)
**Location**: Actions tab → Data Management section

**Steps**:
1. Click on "Actions" tab
2. Click "Import from Excel" button
3. Dialog opens

**Expected Result**: ✅ Same as Test 2 - Import dialog opens

---

### ✅ Test 9: Download Sample (Actions Tab)
**Location**: Actions tab → Data Management section

**Steps**:
1. Click on "Actions" tab
2. Click "Download Sample" button
3. Sample Excel file should download

**Expected Result**: ✅ Sample Excel file with example data downloads

---

### ✅ Test 10: Single Barcode (Actions Tab)
**Location**: Actions tab → Barcode Tools section

**Steps**:
1. Click on "Actions" tab
2. Click "Single Barcode" button
3. Dialog opens
4. Select a medicine
5. Choose barcode content (Name/Price/Both)
6. Barcode generates
7. Click "Print Barcode"

**Expected Result**: ✅ Barcode generates and print dialog opens

---

### ✅ Test 11: Bulk Generate (Actions Tab)
**Location**: Actions tab → Barcode Tools section

**Steps**:
1. Click on "Actions" tab
2. Click "Bulk Generate" button
3. Dialog opens
4. Select multiple medicines (checkboxes)
5. Choose barcode content
6. Click "Print X Barcodes"

**Expected Result**: ✅ Multiple barcodes print in grid layout

---

## Browser Console Testing

For authenticated API testing, open browser console and run:

```javascript
// Load the test suite
const script = document.createElement('script');
script.src = '/test-inventory-buttons.js';
document.head.appendChild(script);

// After loading, run tests
testInventoryButtons.runAllTests();
```

Or run individual tests:
```javascript
await testInventoryButtons.testGetInventory();
await testInventoryButtons.testAddProduct();
await testInventoryButtons.testStockAdjustmentIncrease('product-id-here');
await testInventoryButtons.testPurchaseStock('product-id-here');
await testInventoryButtons.testStockTransfer();
```

---

## Expected Toast Notifications

All Actions tab operations should show toast notifications:

- ✅ Success: Green toast with success message
- ❌ Error: Red toast with error description
- ⚠️ Warning: Yellow toast for validation issues

---

## Troubleshooting

### If buttons don't work:
1. Check browser console for errors
2. Verify you're logged in
3. Check network tab for API responses
4. Ensure Supabase connection is active

### If API returns "Unauthorized":
1. Clear cookies and re-login
2. Check Supabase authentication
3. Verify pharmacy_users table has your user

### If data doesn't update:
1. Refresh the page
2. Check Supabase database directly
3. Review server logs for errors

---

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Toast notifications appear
- ✅ Data persists in database
- ✅ UI updates after operations
- ✅ Excel import/export works
- ✅ Barcodes generate correctly
