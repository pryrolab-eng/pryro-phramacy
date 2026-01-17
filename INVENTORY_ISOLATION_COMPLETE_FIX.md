# Inventory Isolation Issue - Complete Analysis & Fix

## Problem
When a pharmacy owner adds inventory, it appears to be visible to other pharmacy owners. This is a critical multi-tenancy isolation issue.

## Root Causes

### 1. **Possible NULL pharmacy_id Values**
If inventory or medication records were created without a `pharmacy_id`, they would be visible to all pharmacies or cause RLS policies to fail.

### 2. **RLS Policy Issues**
The RLS policies use the `get_user_pharmacy_ids()` function which returns an array. If this function has issues or if the policies aren't properly enforced, isolation breaks.

### 3. **Mismatched pharmacy_id Between Tables**
If an inventory item references a medication that belongs to a different pharmacy, the join in the query could expose data across pharmacies.

### 4. **Missing Constraints**
Without NOT NULL constraints on `pharmacy_id` columns, the database allows orphaned records.

## Diagnosis Steps

### Run the Diagnostic SQL
Execute `diagnose-inventory-issue.sql` to identify:
- All pharmacies and their IDs
- User-pharmacy associations
- Inventory with pharmacy associations
- Medications without proper pharmacy_id
- Mismatched pharmacy_ids
- Current RLS policies
- Inventory count per pharmacy

### Key Queries to Run:

```sql
-- Check for NULL pharmacy_ids
SELECT COUNT(*) FROM inventory WHERE pharmacy_id IS NULL;
SELECT COUNT(*) FROM medications WHERE pharmacy_id IS NULL;

-- Check for mismatched pharmacy_ids
SELECT 
    i.id,
    i.pharmacy_id as inv_pharmacy,
    m.pharmacy_id as med_pharmacy,
    m.name
FROM inventory i
JOIN medications m ON i.medication_id = m.id
WHERE i.pharmacy_id != m.pharmacy_id OR m.pharmacy_id IS NULL;

-- Check user pharmacy associations
SELECT 
    pu.user_id,
    pu.pharmacy_id,
    p.name,
    pu.is_active
FROM pharmacy_users pu
JOIN pharmacies p ON pu.pharmacy_id = p.id
WHERE pu.user_id = 'YOUR_USER_ID';
```

## Complete Fix

### Step 1: Run the Fix SQL
Execute `fix-inventory-isolation-complete.sql` which will:
1. Identify NULL pharmacy_ids
2. Fix NULL values (assigns to first pharmacy - adjust as needed)
3. Add NOT NULL constraints
4. Verify RLS is enabled
5. Recreate RLS policies with explicit checks
6. Add validation triggers
7. Verify the fix

### Step 2: Verify API Routes
The API routes in your codebase are already correct:

**`/api/inventory/add/route.ts`** ✅
- Gets user's pharmacy_id from pharmacy_users table
- Sets pharmacy_id on both medications and inventory
- Uses proper isolation

**`/api/inventory/route.ts`** ✅
- Uses `!inner` join to enforce relationship
- Filters by pharmacy_id on both inventory and medications
- Includes logging for debugging

### Step 3: Test the Fix

#### Test 1: Login as Pharmacy A
```bash
# Add inventory item
# Check that it appears in Pharmacy A's inventory
# Check that it does NOT appear in Pharmacy B's inventory
```

#### Test 2: Login as Pharmacy B
```bash
# Add inventory item
# Check that it appears in Pharmacy B's inventory
# Check that it does NOT appear in Pharmacy A's inventory
```

#### Test 3: Database Verification
```sql
-- Should show different counts for each pharmacy
SELECT 
    p.name,
    COUNT(i.id) as inventory_count
FROM pharmacies p
LEFT JOIN inventory i ON p.id = i.pharmacy_id
GROUP BY p.name;
```

## Prevention Measures

### 1. Always Validate pharmacy_id in API Routes
```typescript
// Get user's pharmacy
const { data: userPharmacy } = await supabase
  .from('pharmacy_users')
  .select('pharmacy_id')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single()

if (!userPharmacy) {
  return NextResponse.json({ error: 'Unauthorized' })
}

// Always use this pharmacy_id
await supabase.from('inventory').insert({
  pharmacy_id: userPharmacy.pharmacy_id,
  // ... other fields
})
```

### 2. Use Inner Joins with Explicit Filters
```typescript
.select(`
  *,
  medications!inner (*)
`)
.eq('pharmacy_id', pharmacyId)
.eq('medications.pharmacy_id', pharmacyId)
```

### 3. Add Logging
```typescript
console.log('User:', user.id)
console.log('Pharmacy:', userPharmacy.pharmacy_id)
console.log('Creating inventory for pharmacy:', userPharmacy.pharmacy_id)
```

### 4. Database Constraints
- NOT NULL on pharmacy_id columns ✅
- Validation triggers ✅
- Proper RLS policies ✅

## Monitoring

### Check Logs Regularly
Look for:
- "Pharmacy not found for user" errors
- Mismatched pharmacy_id warnings
- RLS policy violations

### Run Periodic Audits
```sql
-- Weekly audit query
SELECT 
    'Inventory without pharmacy' as issue,
    COUNT(*) as count
FROM inventory 
WHERE pharmacy_id IS NULL

UNION ALL

SELECT 
    'Medications without pharmacy' as issue,
    COUNT(*) as count
FROM medications 
WHERE pharmacy_id IS NULL

UNION ALL

SELECT 
    'Mismatched pharmacy_ids' as issue,
    COUNT(*) as count
FROM inventory i
JOIN medications m ON i.medication_id = m.id
WHERE i.pharmacy_id != m.pharmacy_id;
```

## Quick Fix Checklist

- [ ] Run `diagnose-inventory-issue.sql` to identify the problem
- [ ] Run `fix-inventory-isolation-complete.sql` to fix database
- [ ] Verify RLS policies are enabled
- [ ] Test with multiple pharmacy accounts
- [ ] Check console logs for pharmacy_id values
- [ ] Verify inventory counts per pharmacy
- [ ] Monitor for any RLS violations

## If Issue Persists

### 1. Check User Authentication
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log('Authenticated user:', user?.id)
```

### 2. Check pharmacy_users Table
```sql
SELECT * FROM pharmacy_users WHERE user_id = 'YOUR_USER_ID';
```

### 3. Check RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename IN ('inventory', 'medications');
```

### 4. Test RLS Function
```sql
-- Login as a pharmacy user first
SELECT get_user_pharmacy_ids();
```

### 5. Check Supabase Service Role
Make sure you're NOT using the service role key in your API routes, as it bypasses RLS.

## Expected Behavior After Fix

✅ Each pharmacy only sees their own inventory
✅ Adding inventory creates pharmacy-specific records
✅ Medications are not shared across pharmacies
✅ RLS policies enforce isolation at database level
✅ API routes validate pharmacy ownership
✅ Triggers prevent invalid pharmacy_id assignments

## Files Modified/Created

1. `diagnose-inventory-issue.sql` - Diagnostic queries
2. `fix-inventory-isolation-complete.sql` - Complete fix
3. `INVENTORY_ISOLATION_COMPLETE_FIX.md` - This document

## Support

If the issue persists after applying these fixes:
1. Check the console logs in your API routes
2. Run the diagnostic SQL queries
3. Verify your Supabase environment variables
4. Ensure you're not using the service role key
5. Check that RLS is enabled on all tables
