-- Diagnose Inventory Isolation Issue
-- Run this to identify why inventory is being shared across pharmacies

-- 1. Check all pharmacies and their IDs
SELECT id, name, owner_id, status 
FROM pharmacies 
ORDER BY created_at;

-- 2. Check pharmacy_users associations
SELECT 
    pu.id,
    pu.user_id,
    pu.pharmacy_id,
    pu.role,
    pu.is_active,
    p.name as pharmacy_name,
    au.email
FROM pharmacy_users pu
JOIN pharmacies p ON pu.pharmacy_id = p.id
LEFT JOIN auth.users au ON pu.user_id = au.id
ORDER BY pu.pharmacy_id, pu.created_at;

-- 3. Check inventory with pharmacy associations
SELECT 
    i.id,
    i.pharmacy_id,
    p.name as pharmacy_name,
    m.name as medication_name,
    m.pharmacy_id as medication_pharmacy_id,
    i.quantity_in_stock,
    i.batch_number,
    i.created_at
FROM inventory i
JOIN pharmacies p ON i.pharmacy_id = p.id
JOIN medications m ON i.medication_id = m.id
ORDER BY i.created_at DESC;

-- 4. Check for medications without proper pharmacy_id
SELECT 
    m.id,
    m.name,
    m.pharmacy_id,
    p.name as pharmacy_name,
    COUNT(i.id) as inventory_count
FROM medications m
LEFT JOIN pharmacies p ON m.pharmacy_id = p.id
LEFT JOIN inventory i ON m.id = i.medication_id
GROUP BY m.id, m.name, m.pharmacy_id, p.name
ORDER BY m.created_at DESC;

-- 5. Check for mismatched pharmacy_ids between inventory and medications
SELECT 
    i.id as inventory_id,
    i.pharmacy_id as inventory_pharmacy_id,
    ip.name as inventory_pharmacy_name,
    m.id as medication_id,
    m.name as medication_name,
    m.pharmacy_id as medication_pharmacy_id,
    mp.name as medication_pharmacy_name
FROM inventory i
JOIN medications m ON i.medication_id = m.id
JOIN pharmacies ip ON i.pharmacy_id = ip.id
LEFT JOIN pharmacies mp ON m.pharmacy_id = mp.id
WHERE i.pharmacy_id != m.pharmacy_id OR m.pharmacy_id IS NULL;

-- 6. Check RLS policies on inventory table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('inventory', 'medications')
ORDER BY tablename, policyname;

-- 7. Test the get_user_pharmacy_ids() function
-- Replace 'USER_UUID_HERE' with actual user UUID
-- SELECT get_user_pharmacy_ids();

-- 8. Count inventory per pharmacy
SELECT 
    p.id,
    p.name as pharmacy_name,
    COUNT(i.id) as inventory_count,
    COUNT(DISTINCT m.id) as unique_medications
FROM pharmacies p
LEFT JOIN inventory i ON p.id = i.pharmacy_id
LEFT JOIN medications m ON p.id = m.pharmacy_id
GROUP BY p.id, p.name
ORDER BY p.name;
