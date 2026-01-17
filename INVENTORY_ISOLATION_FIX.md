# Inventory Isolation Issue - Root Cause & Solution

## Problem Summary
All pharmacies are accessing the same inventory instead of having isolated inventory per pharmacy.

## Root Cause Analysis

### Database Schema
The database is correctly designed with multi-tenancy in mind:
- `inventory` table has `pharmacy_id` column
- `medications` table has `pharmacy_id` column
- RLS (Row Level Security) policies are properly configured

### The Issue
Despite correct schema design, pharmacies are seeing shared inventory due to:

1. **Data Integrity Issues**
   - Existing inventory/medication records may have incorrect or NULL `pharmacy_id` values
   - Medications might have been created without proper pharmacy isolation

2. **Query Issues**
   - The medications join in the inventory query wasn't enforcing pharmacy_id match
   - No validation that medications belong to the same pharmacy as inventory

3. **Missing Constraints**
   - No NOT NULL constraint on `pharmacy_id` columns
   - No foreign key validation ensuring data consistency

## Solution Implementation

### 1. Database Fixes (Run fix-inventory-isolation.sql)

```sql
-- Add NOT NULL constraints
ALTER TABLE inventory ALTER COLUMN pharmacy_id SET NOT NULL;
ALTER TABLE medications ALTER COLUMN pharmacy_id SET NOT NULL;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('inventory', 'medications');
```

### 2. API Route Improvements

**Updated GET endpoint** (`/api/inventory/route.ts`):
- Added `!inner` join to medications to enforce relationship
- Added explicit pharmacy_id filter on medications join
- Added logging to track which pharmacy is being queried
- Added pharmacy_id to response for debugging

**Key changes:**
```typescript
.select(`
  id,
  pharmacy_id,
  medications!inner (
    name,
    category,
    pharmacy_id
  )
`)
.eq('pharmacy_id', userPharmacy.pharmacy_id)
.eq('medications.pharmacy_id', userPharmacy.pharmacy_id)
```

### 3. Data Cleanup Required

Run these queries to identify and fix data issues:

```sql
-- Find inventory without pharmacy_id
SELECT COUNT(*) FROM inventory WHERE pharmacy_id IS NULL;

-- Find medications without pharmacy_id
SELECT COUNT(*) FROM medications WHERE pharmacy_id IS NULL;

-- Find mismatched pharmacy_ids between inventory and medications
SELECT 
  i.id as inventory_id,
  i.pharmacy_id as inventory_pharmacy,
  m.pharmacy_id as medication_pharmacy,
  m.name
FROM inventory i
JOIN medications m ON i.medication_id = m.id
WHERE i.pharmacy_id != m.pharmacy_id;
```

## Testing the Fix

### 1. Verify Isolation
Log in as different pharmacy users and check:
- Each pharmacy only sees their own inventory
- Adding new items creates pharmacy-specific records
- Medications are not shared across pharmacies

### 2. Check Console Logs
The updated API now logs:
- Which pharmacy is being queried
- How many items were found
- Any errors with pharmacy lookup

### 3. Database Verification
```sql
-- Should show different counts for different pharmacies
SELECT 
  p.name as pharmacy_name,
  COUNT(i.id) as inventory_count
FROM pharmacies p
LEFT JOIN inventory i ON p.id = i.pharmacy_id
GROUP BY p.id, p.name;
```

## Prevention Measures

### 1. Always Set pharmacy_id
When creating any pharmacy-scoped record:
```typescript
const { data: userPharmacy } = await supabase
  .from('pharmacy_users')
  .select('pharmacy_id')
  .eq('user_id', user.id)
  .single()

// Always include pharmacy_id
await supabase.from('inventory').insert({
  pharmacy_id: userPharmacy.pharmacy_id,
  // ... other fields
})
```

### 2. Use Inner Joins
When querying related data, use `!inner` to enforce relationships:
```typescript
.select('*, medications!inner(*)')
.eq('pharmacy_id', pharmacyId)
.eq('medications.pharmacy_id', pharmacyId)
```

### 3. Validate in API Routes
Always verify pharmacy ownership before operations:
```typescript
// Get user's pharmacy
const { data: userPharmacy } = await supabase
  .from('pharmacy_users')
  .select('pharmacy_id')
  .eq('user_id', user.id)
  .single()

if (!userPharmacy) {
  return NextResponse.json({ error: 'Unauthorized' })
}
```

## Next Steps

1. ✅ Run `fix-inventory-isolation.sql` to add constraints
2. ✅ Deploy updated API routes
3. ⚠️ Clean up existing data with mismatched pharmacy_ids
4. ✅ Test with multiple pharmacy accounts
5. ⚠️ Monitor logs for any isolation issues

## Related Files
- `/src/app/api/inventory/route.ts` - Main inventory API
- `/src/app/api/inventory/add/route.ts` - Add inventory API
- `/supabase/migrations/20240322000005_rls_policies.sql` - RLS policies
- `/fix-inventory-isolation.sql` - Database fix script
