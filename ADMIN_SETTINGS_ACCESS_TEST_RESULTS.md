# Admin Settings Access Issue - Test Results

## Issue Summary
The admin settings page (`/admin/settings`) is not accessible because the hardcoded superadmin email does not have the correct role in the database.

## Hardcoded Superadmin Email
**Email:** `abdousentore@gmail.com`  
**User ID:** `06fed0d6-ad6a-4989-97ec-bcc3bba93d5c`

## Current Status
- **Current Role:** `pharmacy_owner`
- **Required Role:** `superadmin`
- **Admin Settings Access:** ❌ **DENIED**

## Root Cause
1. The API route `/api/admin/system-settings/route.ts` checks if the user has role `superadmin`:
   ```typescript
   if (userError || userData?.role !== 'superadmin') {
     return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
   }
   ```

2. The user `abdousentore@gmail.com` currently has role `pharmacy_owner` instead of `superadmin`

3. The `user_role` enum may not have the `superadmin` value added yet

## Files with Hardcoded Email/User ID
1. `check-superadmin.js` - Line 10: `u.email === 'abdousentore@gmail.com'`
2. `setup-superadmin-role.js` - Line 25: `userId = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c'`
3. `update-to-superadmin.js` - Line 10: `userId = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c'`

## Fix Required

### Step 1: Add 'superadmin' to the user_role enum
Run this SQL in Supabase SQL Editor:

```sql
-- Add superadmin to enum if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'superadmin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'superadmin';
  END IF;
END $$;
```

### Step 2: Update the user role to superadmin
```sql
-- Update user to superadmin
UPDATE pharmacy_users
SET role = 'superadmin', pharmacy_id = NULL
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
```

### Step 3: Verify the change
```sql
-- Verify the change
SELECT user_id, role, pharmacy_id, is_active
FROM pharmacy_users
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
```

Expected result:
```
user_id: 06fed0d6-ad6a-4989-97ec-bcc3bba93d5c
role: superadmin
pharmacy_id: NULL
is_active: true
```

## After Fix
Once the SQL is executed:
- ✅ User will have `superadmin` role
- ✅ Admin settings page will be accessible
- ✅ All admin API endpoints will work

## Test Scripts Created
1. `test-admin-settings-access.js` - Tests and attempts to fix the access issue
2. `fix-admin-settings-access.js` - Shows the SQL needed to fix the issue

## Recommendation
Consider making the superadmin email configurable via environment variables instead of hardcoding it in multiple files:

```javascript
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'admin@pryrox.com';
```

This would make it easier to change the superadmin email without modifying multiple files.
