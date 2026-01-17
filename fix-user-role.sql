-- Check current user and role
SELECT 
    u.email,
    pu.role,
    pu.pharmacy_id
FROM auth.users u
LEFT JOIN pharmacy_users pu ON pu.user_id = u.id
WHERE u.email IN ('abdousentore@gmail.com', 'superadmin@pyro.rw');

-- Fix: Update role to pharmacy_owner or admin
UPDATE pharmacy_users 
SET role = 'pharmacy_owner'
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'abdousentore@gmail.com'
);

-- Verify
SELECT 
    u.email,
    pu.role
FROM auth.users u
JOIN pharmacy_users pu ON pu.user_id = u.id
WHERE u.email = 'abdousentore@gmail.com';
