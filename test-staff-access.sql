-- Test Staff Access Isolation
-- This verifies staff only see their pharmacy's data

-- STEP 1: Show all pharmacies and their staff
SELECT 
    p.id as pharmacy_id,
    p.name as pharmacy_name,
    au.email as staff_email,
    pu.role,
    pu.is_active
FROM pharmacies p
LEFT JOIN pharmacy_users pu ON p.id = pu.pharmacy_id
LEFT JOIN auth.users au ON pu.user_id = au.id
ORDER BY p.name, pu.role;

-- STEP 2: Show inventory per pharmacy
SELECT 
    p.id as pharmacy_id,
    p.name as pharmacy_name,
    COUNT(i.id) as inventory_count,
    STRING_AGG(m.name, ', ') as medications
FROM pharmacies p
LEFT JOIN inventory i ON p.id = i.pharmacy_id
LEFT JOIN medications m ON i.medication_id = m.id
GROUP BY p.id, p.name
ORDER BY p.name;

-- STEP 3: Test what each user can see (simulate RLS)
-- For muzungu@gmail.com (Kipharma owner)
SELECT 
    'muzungu@gmail.com' as test_user,
    i.id,
    i.pharmacy_id,
    p.name as pharmacy_name,
    m.name as medication_name
FROM inventory i
JOIN medications m ON i.medication_id = m.id
JOIN pharmacies p ON i.pharmacy_id = p.id
WHERE i.pharmacy_id IN (
    SELECT pharmacy_id 
    FROM pharmacy_users pu
    JOIN auth.users au ON pu.user_id = au.id
    WHERE au.email = 'muzungu@gmail.com'
    AND pu.is_active = true
);

-- For staff2rrr2muzunggu@gmail.com (should see same as muzungu)
SELECT 
    'staff2rrr2muzunggu@gmail.com' as test_user,
    i.id,
    i.pharmacy_id,
    p.name as pharmacy_name,
    m.name as medication_name
FROM inventory i
JOIN medications m ON i.medication_id = m.id
JOIN pharmacies p ON i.pharmacy_id = p.id
WHERE i.pharmacy_id IN (
    SELECT pharmacy_id 
    FROM pharmacy_users pu
    JOIN auth.users au ON pu.user_id = au.id
    WHERE au.email = 'staff2rrr2muzunggu@gmail.com'
    AND pu.is_active = true
);

-- For jeanbizi@gmail.com (different pharmacy)
SELECT 
    'jeanbizi@gmail.com' as test_user,
    i.id,
    i.pharmacy_id,
    p.name as pharmacy_name,
    m.name as medication_name
FROM inventory i
JOIN medications m ON i.medication_id = m.id
JOIN pharmacies p ON i.pharmacy_id = p.id
WHERE i.pharmacy_id IN (
    SELECT pharmacy_id 
    FROM pharmacy_users pu
    JOIN auth.users au ON pu.user_id = au.id
    WHERE au.email = 'jeanbizi@gmail.com'
    AND pu.is_active = true
);

-- STEP 4: Check if staff are in correct pharmacies
SELECT 
    au.email,
    pu.pharmacy_id,
    p.name as pharmacy_name,
    pu.role,
    CASE 
        WHEN au.email LIKE '%muzungu%' AND p.name = 'Kipharma' THEN '✓ CORRECT'
        WHEN au.email LIKE '%muzungu%' AND p.name != 'Kipharma' THEN '✗ WRONG PHARMACY'
        ELSE 'CHECK MANUALLY'
    END as status
FROM auth.users au
JOIN pharmacy_users pu ON au.id = pu.user_id
JOIN pharmacies p ON pu.pharmacy_id = p.id
WHERE au.email LIKE '%staff%' OR au.email LIKE '%muzungu%'
ORDER BY p.name;

-- STEP 5: Fix staff associations (if needed)
-- Example: Move staff2rrr2muzunggu to Kipharma
/*
UPDATE pharmacy_users 
SET pharmacy_id = (SELECT id FROM pharmacies WHERE name = 'Kipharma')
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'staff2rrr2muzunggu@gmail.com');
*/
