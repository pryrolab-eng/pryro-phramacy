-- Debug: Check which pharmacy each user belongs to
SELECT 
  u.email,
  pu.role,
  pu.pharmacy_id,
  p.name as pharmacy_name,
  pu.is_active
FROM auth.users u
JOIN pharmacy_users pu ON u.id = pu.user_id
JOIN pharmacies p ON pu.pharmacy_id = p.id
ORDER BY p.name;

-- Check if a user belongs to multiple pharmacies
SELECT 
  user_id,
  COUNT(DISTINCT pharmacy_id) as pharmacy_count,
  array_agg(DISTINCT pharmacy_id) as pharmacy_ids
FROM pharmacy_users
WHERE is_active = true
GROUP BY user_id
HAVING COUNT(DISTINCT pharmacy_id) > 1;
