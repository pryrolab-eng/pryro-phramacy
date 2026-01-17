-- Check all pharmacies
SELECT id, name, owner_id FROM pharmacies ORDER BY created_at;

-- Check all pharmacy_users associations
SELECT 
    pu.user_id,
    pu.pharmacy_id,
    p.name as pharmacy_name,
    au.email
FROM pharmacy_users pu
JOIN pharmacies p ON pu.pharmacy_id = p.id
LEFT JOIN auth.users au ON pu.user_id = au.id
ORDER BY pu.pharmacy_id;

-- Find users with wrong pharmacy association
SELECT 
    au.email,
    pu.pharmacy_id,
    p.name as assigned_pharmacy,
    p2.name as owned_pharmacy
FROM auth.users au
LEFT JOIN pharmacy_users pu ON au.id = pu.user_id
LEFT JOIN pharmacies p ON pu.pharmacy_id = p.id
LEFT JOIN pharmacies p2 ON au.id = p2.owner_id
WHERE p.id != p2.id OR p.id IS NULL OR p2.id IS NULL;

-- Fix: Update pharmacy_users to match pharmacy ownership
UPDATE pharmacy_users pu
SET pharmacy_id = p.id
FROM pharmacies p
WHERE p.owner_id = pu.user_id
AND pu.pharmacy_id != p.id;

-- Verify fix
SELECT 
    au.email,
    pu.pharmacy_id,
    p.name as pharmacy_name,
    CASE WHEN p.owner_id = au.id THEN 'OWNER' ELSE 'STAFF' END as relationship
FROM auth.users au
JOIN pharmacy_users pu ON au.id = pu.user_id
JOIN pharmacies p ON pu.pharmacy_id = p.id
ORDER BY p.name;
