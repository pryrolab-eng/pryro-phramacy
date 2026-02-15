-- Migration: Add superadmin role support
-- This allows superadmin users to exist without a pharmacy_id

-- Step 1: Update the super admin user's role
UPDATE pharmacy_users 
SET 
  role = 'superadmin',
  pharmacy_id = NULL
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';

-- Step 2: Verify the update
SELECT user_id, pharmacy_id, role, is_active 
FROM pharmacy_users 
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
