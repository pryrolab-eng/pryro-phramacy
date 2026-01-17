-- Safe Staff Association Fix
-- This checks everything before making changes

-- STEP 1: Check current state
SELECT 
    au.email,
    pu.pharmacy_id as current_pharmacy_id,
    p.name as current_pharmacy_name,
    pu.role
FROM auth.users au
JOIN pharmacy_users pu ON au.id = pu.user_id
JOIN pharmacies p ON pu.pharmacy_id = p.id
WHERE au.email = 'staff2rrr2muzunggu@gmail.com';

-- STEP 2: Find the correct pharmacy (Kipharma owned by muzungu@gmail.com)
SELECT 
    p.id as kipharma_id,
    p.name,
    au.email as owner_email
FROM pharmacies p
JOIN auth.users au ON p.owner_id = au.id
WHERE au.email = 'muzungu@gmail.com';

-- STEP 3: Preview the change (doesn't update, just shows what will change)
SELECT 
    au.email as staff_email,
    pu.pharmacy_id as old_pharmacy_id,
    p_old.name as old_pharmacy_name,
    (SELECT id FROM pharmacies WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'muzungu@gmail.com')) as new_pharmacy_id,
    (SELECT name FROM pharmacies WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'muzungu@gmail.com')) as new_pharmacy_name
FROM auth.users au
JOIN pharmacy_users pu ON au.id = pu.user_id
JOIN pharmacies p_old ON pu.pharmacy_id = p_old.id
WHERE au.email = 'staff2rrr2muzunggu@gmail.com';

-- STEP 4: Only run this if the preview looks correct
-- Fix staff association to link to muzungu's pharmacy
UPDATE pharmacy_users 
SET pharmacy_id = (
    SELECT p.id 
    FROM pharmacies p
    JOIN auth.users au ON p.owner_id = au.id
    WHERE au.email = 'muzungu@gmail.com'
)
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'staff2rrr2muzunggu@gmail.com'
);

-- STEP 5: Verify the fix
SELECT 
    au.email,
    pu.pharmacy_id,
    p.name as pharmacy_name,
    pu.role,
    CASE 
        WHEN p.owner_id = (SELECT id FROM auth.users WHERE email = 'muzungu@gmail.com') 
        THEN '✓ CORRECT - Staff linked to muzungu pharmacy'
        ELSE '✗ WRONG - Still linked to wrong pharmacy'
    END as status
FROM auth.users au
JOIN pharmacy_users pu ON au.id = pu.user_id
JOIN pharmacies p ON pu.pharmacy_id = p.id
WHERE au.email = 'staff2rrr2muzunggu@gmail.com';
