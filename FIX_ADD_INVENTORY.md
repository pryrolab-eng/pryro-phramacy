# Fix: Add Inventory Not Working

## Problem
When trying to add a drug/medication to inventory, the operation fails.

## Possible Causes

### 1. RLS Policies Blocking Inserts
The Row Level Security policies might be too restrictive or incorrectly configured.

### 2. Validation Triggers Failing
Custom validation triggers might be rejecting the insert.

### 3. Missing pharmacy_users Association
The user might not be properly associated with a pharmacy.

### 4. NULL Constraint Violations
The pharmacy_id might be NULL or invalid.

## Quick Fix Steps

### Step 1: Run the Fix SQL
Execute `fix-add-inventory-issue.sql` in your Supabase SQL editor:
```bash
# This will:
# - Drop problematic validation triggers
# - Recreate RLS policies with correct logic
# - Verify RLS is enabled
```

### Step 2: Test in Browser Console
Open your browser console and run:
```javascript
// Copy and paste from test-add-inventory-debug.js
```

### Step 3: Check Server Logs
Look for errors in:
- Browser console (F12)
- Network tab (check the /api/inventory/add response)
- Supabase logs (if available)

## Detailed Diagnosis

### Check 1: User Has Pharmacy Association
```sql
SELECT 
    pu.user_id,
    pu.pharmacy_id,
    pu.is_active,
    p.name as pharmacy_name
FROM pharmacy_users pu
JOIN pharmacies p ON pu.pharmacy_id = p.id
WHERE pu.user_id = auth.uid();
```

**Expected**: Should return at least one row with `is_active = true`
**If empty**: User is not associated with any pharmacy

**Fix**:
```sql
-- Replace USER_ID and PHARMACY_ID with actual values
INSERT INTO pharmacy_users (user_id, pharmacy_id, role, is_active)
VALUES ('USER_ID', 'PHARMACY_ID', 'pharmacist', true);
```

### Check 2: RLS Policies Exist
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('inventory', 'medications')
ORDER BY tablename, cmd;
```

**Expected**: Should see INSERT, UPDATE, DELETE, SELECT policies for both tables
**If missing**: Run `fix-add-inventory-issue.sql`

### Check 3: API Route is Working
Check the API route at `/api/inventory/add/route.ts`:
- Line 14-17: Gets user's pharmacy_id
- Line 45-56: Creates medication with pharmacy_id
- Line 70-79: Creates inventory with pharmacy_id

**Common Issues**:
- `userPharmacy` is null → User not in pharmacy_users table
- `medError` or `error` → RLS policy blocking insert

### Check 4: Validation Triggers
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('inventory', 'medications')
AND trigger_name LIKE '%validate%';
```

**If exists**: These might be blocking inserts
**Fix**: Drop them with `fix-add-inventory-issue.sql`

## Manual Test

### Test 1: Direct Database Insert
```sql
-- Login as a pharmacy user first
INSERT INTO medications (
    pharmacy_id, 
    name, 
    category, 
    requires_prescription, 
    is_active
)
VALUES (
    (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() LIMIT 1),
    'Test Med',
    'otc',
    false,
    true
)
RETURNING *;
```

**If this works**: API route issue
**If this fails**: RLS policy issue

### Test 2: API Route Test
```bash
# In browser console
fetch('/api/inventory/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Medicine',
    category: 'Pain Relief',
    batch_number: 'TEST001',
    quantity: 100,
    unit_cost: 500,
    selling_price: 800,
    minimum_stock_level: 20,
    expiry_date: '2025-12-31'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**Check response**:
- `success: true` → Working!
- `error: 'Pharmacy not found'` → User not in pharmacy_users
- `error: 'Failed to add medication'` → RLS or constraint issue

## Common Error Messages

### "Pharmacy not found"
**Cause**: User is not associated with a pharmacy
**Fix**: Add user to pharmacy_users table

### "new row violates row-level security policy"
**Cause**: RLS policy blocking insert
**Fix**: Run `fix-add-inventory-issue.sql`

### "null value in column pharmacy_id violates not-null constraint"
**Cause**: pharmacy_id is NULL
**Fix**: Check that userPharmacy.pharmacy_id is being set correctly

### "User does not have access to this pharmacy"
**Cause**: Validation trigger rejecting insert
**Fix**: Drop validation triggers

## Solution Summary

1. **Run** `fix-add-inventory-issue.sql` to fix RLS policies
2. **Verify** user is in pharmacy_users table
3. **Test** using browser console script
4. **Check** browser console and network tab for errors
5. **Monitor** Supabase logs for detailed error messages

## Prevention

After fixing:
1. ✅ Ensure all users are added to pharmacy_users when they sign up
2. ✅ Keep RLS policies simple and explicit
3. ✅ Avoid complex validation triggers
4. ✅ Always set pharmacy_id in API routes
5. ✅ Test with multiple pharmacy accounts

## Files Created
- `fix-add-inventory-issue.sql` - Main fix script
- `check-rls-insert-policies.sql` - Diagnostic queries
- `test-add-inventory-debug.js` - Browser test script
- `FIX_ADD_INVENTORY.md` - This guide
