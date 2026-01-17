-- Check if user exists and their pharmacy relationship
SELECT 
  u.email,
  u.id as user_id,
  pu.pharmacy_id,
  pu.role,
  pu.is_active,
  p.name as pharmacy_name
FROM auth.users u
LEFT JOIN pharmacy_users pu ON u.id = pu.user_id
LEFT JOIN pharmacies p ON pu.pharmacy_id = p.id
WHERE u.email = 'pharmacy3@test.com';

-- If user exists but not linked to Test Pharmacy, run this:
-- INSERT INTO pharmacy_users (pharmacy_id, user_id, role, is_active)
-- SELECT 
--   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
--   id,
--   'pharmacist',
--   true
-- FROM auth.users
-- WHERE email = 'pharmacy3@test.com';
