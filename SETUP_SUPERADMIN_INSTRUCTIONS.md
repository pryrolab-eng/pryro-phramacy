# Setup Superadmin Role - Manual Steps

## You need to run this SQL in Supabase SQL Editor:

```sql
-- Step 1: Add 'superadmin' to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- Step 2: Update the user to superadmin role and remove pharmacy_id
UPDATE pharmacy_users 
SET 
  role = 'superadmin',
  pharmacy_id = NULL
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';

-- Step 3: Verify the change
SELECT user_id, pharmacy_id, role, is_active 
FROM pharmacy_users 
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
```

## How to run:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Paste the SQL above
5. Click "Run" button

## What was changed in the code:

✅ `src/app/(dashboard)/layout.tsx` - Now checks for role = 'superadmin'
✅ `src/app/api/admin/system-settings/route.ts` - Now requires role = 'superadmin'

## After running the SQL:

- Super admin will have role = 'superadmin'
- Super admin will have pharmacy_id = NULL (no pharmacy needed)
- Only superadmin can access /admin/settings page
- Only superadmin can save platform settings
