-- Add 'superadmin' to the user_role enum type
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- Now update the user
UPDATE pharmacy_users 
SET 
  role = 'superadmin',
  pharmacy_id = NULL
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';

-- Verify
SELECT user_id, pharmacy_id, role, is_active 
FROM pharmacy_users 
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
