-- Add pharmacy access for missing users
INSERT INTO pharmacy_users (pharmacy_id, user_id, role, is_active)
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  id,
  'cashier',
  true
FROM auth.users 
WHERE email IN ('muzungu@gmail.com', 'user1758467099574@gmail.com', 'user1758467085299@gmail.com')
AND id NOT IN (SELECT user_id FROM pharmacy_users);