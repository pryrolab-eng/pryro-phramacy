-- Step 2: Update user to superadmin (run this AFTER step 1 completes)
UPDATE pharmacy_users
SET role = 'superadmin', pharmacy_id = NULL
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';

-- Verify
SELECT user_id, role, pharmacy_id, is_active
FROM pharmacy_users
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
