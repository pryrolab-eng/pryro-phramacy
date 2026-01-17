-- Find users who should be owners but don't have pharmacies
SELECT 
    au.id,
    au.email,
    pu.pharmacy_id,
    p.name as current_pharmacy
FROM auth.users au
LEFT JOIN pharmacies owned ON au.id = owned.owner_id
JOIN pharmacy_users pu ON au.id = pu.user_id
JOIN pharmacies p ON pu.pharmacy_id = p.id
WHERE owned.id IS NULL
AND au.email LIKE '%pharmacy%' OR au.email LIKE '%@test.com';

-- Create pharmacies for users who don't have them
INSERT INTO pharmacies (id, name, license_number, owner_id, status)
SELECT 
    gen_random_uuid(),
    'Pharmacy - ' || au.email,
    'LIC-' || substring(au.id::text, 1, 8),
    au.id,
    'active'
FROM auth.users au
LEFT JOIN pharmacies p ON au.id = p.owner_id
WHERE p.id IS NULL
AND (au.email LIKE '%pharmacy%' OR au.email LIKE '%@test.com')
RETURNING *;

-- Update pharmacy_users to link users to their own pharmacies
UPDATE pharmacy_users pu
SET pharmacy_id = p.id,
    role = 'pharmacy_owner'
FROM pharmacies p
WHERE p.owner_id = pu.user_id
AND pu.pharmacy_id != p.id;

-- Verify the fix
SELECT 
    au.email,
    pu.pharmacy_id,
    p.name as pharmacy_name,
    pu.role,
    CASE WHEN p.owner_id = au.id THEN '✓ OWNER' ELSE '✗ STAFF' END as status
FROM auth.users au
JOIN pharmacy_users pu ON au.id = pu.user_id
JOIN pharmacies p ON pu.pharmacy_id = p.id
ORDER BY p.name;
