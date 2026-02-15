-- Check current user's role
SELECT u.email, pu.role 
FROM auth.users u
LEFT JOIN pharmacy_users pu ON u.id = pu.user_id
WHERE u.email = 'admin@test.com';

-- If no admin role exists, update it
UPDATE pharmacy_users 
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@test.com');

-- If no pharmacy_users record exists, insert one
INSERT INTO pharmacy_users (pharmacy_id, user_id, role, is_active)
SELECT 
  (SELECT id FROM pharmacies LIMIT 1),
  (SELECT id FROM auth.users WHERE email = 'admin@test.com'),
  'admin'::user_role,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_users 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@test.com')
);

-- Verify
SELECT u.email, pu.role 
FROM auth.users u
LEFT JOIN pharmacy_users pu ON u.id = pu.user_id
WHERE u.email = 'admin@test.com';
