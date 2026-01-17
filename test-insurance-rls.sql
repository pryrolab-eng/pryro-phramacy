-- Test 1: Check current RLS policies
SELECT 
    policyname,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'insurance_providers'
ORDER BY cmd, policyname;

-- Test 2: Check if superadmin user exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'abdousentore@gmail.com';

-- Test 3: Check pharmacy_users for superadmin
SELECT pu.*, p.name as pharmacy_name
FROM pharmacy_users pu
JOIN pharmacies p ON p.id = pu.pharmacy_id
WHERE pu.user_id IN (SELECT id FROM auth.users WHERE email = 'abdousentore@gmail.com');

-- Test 4: Test the helper function
SELECT get_user_pharmacy_ids();

-- Test 5: Check existing insurance providers
SELECT id, name, pharmacy_id, is_active, created_at 
FROM insurance_providers 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 6: Try to insert as superadmin (run this after logging in as superadmin)
-- This will fail if RLS is blocking
INSERT INTO insurance_providers (name, coverage_percentage, is_active)
VALUES ('SQL Test Insurance', 85, true)
RETURNING *;
