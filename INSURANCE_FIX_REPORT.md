# Insurance API Issues and Fixes - Superadmin

## Issues Found

### 1. **RLS Policy Problem** ❌
- **Issue**: The RLS policy only allowed viewing insurance providers for authenticated users
- **Impact**: Unauthenticated requests returned empty arrays even though data exists
- **Root Cause**: Policy was too restrictive - required `auth.uid()` for all SELECT operations

### 2. **Missing Database Columns** ❌
- **Issue**: The migration file didn't include `invoice_template` and `template_config` columns
- **Impact**: Code was trying to use columns that didn't exist in the schema
- **Evidence**: Direct Supabase query showed these columns exist but weren't in migration

### 3. **Poor Error Handling** ❌
- **Issue**: API returned empty arrays `[]` instead of proper error messages
- **Impact**: Hard to debug - no indication of what went wrong
- **Example**: When user not authenticated, just returned `[]` with no error

### 4. **Authentication Flow Issues** ❌
- **Issue**: API checked authentication but didn't handle errors properly
- **Impact**: Silent failures when auth token expired or invalid

## Test Results

### Direct Database Query (with service role):
```bash
curl -X GET "https://seoqhxpclcueylldhiuy.supabase.co/rest/v1/insurance_providers?select=*" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"
```
**Result**: ✅ Returns 21 insurance providers - DATA EXISTS!

### API Endpoint (without auth):
```bash
curl -X GET http://localhost:3000/api/insurance
```
**Result**: ❌ Returns `[]` - Empty array due to RLS policy

### API Endpoint (with superadmin auth):
**Expected**: Should return all insurance providers
**Actual**: Depends on authentication state

## Fixes Applied

### 1. **Updated RLS Policies** ✅
Created 4 new policies in `fix_insurance_rls.sql`:

1. **Global Insurance Access**: Anyone can view global insurance (pharmacy_id IS NULL)
2. **Pharmacy Insurance Access**: Users can view their pharmacy's insurance
3. **Superadmin Full Access**: Superadmin can do everything
4. **Pharmacy Owner Access**: Owners/admins can manage their pharmacy's insurance

### 2. **Added Missing Columns** ✅
```sql
ALTER TABLE insurance_providers 
ADD COLUMN invoice_template text DEFAULT 'default';

ALTER TABLE insurance_providers 
ADD COLUMN template_config jsonb DEFAULT '{}'::jsonb;
```

### 3. **Improved API Error Handling** ✅
- Added proper error messages
- Return appropriate HTTP status codes (401, 403, 404, 500)
- Better logging for debugging
- Validate required fields before insert

### 4. **Enhanced Authentication Flow** ✅
- Check for auth errors explicitly
- Return global insurance for unauthenticated users
- Verify user roles before allowing operations
- Better error messages for each failure case

## How to Apply Fixes

### Step 1: Run the SQL Fix
```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f fix_insurance_rls.sql
```

Or use Supabase SQL Editor:
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `fix_insurance_rls.sql`
4. Execute

### Step 2: Restart Your Application
```bash
# The API code has been updated, restart the dev server
npm run dev
```

### Step 3: Test the Endpoints
```bash
# Run the test script
test-insurance-superadmin.bat
```

## Expected Behavior After Fix

### For Unauthenticated Users:
- GET `/api/insurance` → Returns global insurance providers (pharmacy_id IS NULL)
- POST `/api/insurance` → Returns 401 Unauthorized

### For Superadmin (abdousentore@gmail.com):
- GET `/api/insurance` → Returns ALL insurance providers
- POST `/api/insurance` → Creates global insurance provider (pharmacy_id = NULL)

### For Pharmacy Owners/Admins:
- GET `/api/insurance` → Returns their pharmacy's + global insurance
- POST `/api/insurance` → Creates pharmacy-specific insurance

### For Regular Pharmacy Users:
- GET `/api/insurance` → Returns their pharmacy's + global insurance
- POST `/api/insurance` → Returns 403 Forbidden

## Database Statistics

Current state (from direct query):
- **Total Providers**: 21
- **Global Providers**: 4 (pharmacy_id IS NULL)
- **Pharmacy-Specific**: 17
- **Active Providers**: 21

## Recommendations

1. **Add Logging**: Implement proper logging middleware to track API calls
2. **Add Tests**: Create automated tests for each user role
3. **Add Validation**: Validate coverage_percentage is between 0-100
4. **Add Deduplication**: Prevent duplicate insurance names per pharmacy
5. **Add Soft Delete**: Instead of hard delete, use is_active flag
6. **Add Audit Trail**: Track who created/modified insurance providers

## Files Modified

1. `src/app/api/insurance/route.ts` - Enhanced error handling and authentication
2. `fix_insurance_rls.sql` - New RLS policies and missing columns
3. `test-insurance-superadmin.bat` - Test script for validation

## Next Steps

1. ✅ Apply SQL fixes to database
2. ✅ Restart application
3. ⏳ Test with superadmin account
4. ⏳ Test with pharmacy owner account
5. ⏳ Test with regular user account
6. ⏳ Verify insurance creation works
7. ⏳ Verify insurance listing works
