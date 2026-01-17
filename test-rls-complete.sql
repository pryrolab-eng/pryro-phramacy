-- 1. Show all current RLS policies
SELECT 
    '=== CURRENT RLS POLICIES ===' as info;

SELECT 
    policyname,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'insurance_providers'
ORDER BY cmd, policyname;

-- 2. Check if RLS is enabled
SELECT 
    '=== RLS STATUS ===' as info;

SELECT relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'insurance_providers';

-- 3. Check superadmin user
SELECT 
    '=== SUPERADMIN USER ===' as info;

SELECT id, email 
FROM auth.users 
WHERE email = 'abdousentore@gmail.com';

-- 4. Test INSERT (this will likely fail with RLS error)
SELECT 
    '=== TESTING INSERT ===' as info;

INSERT INTO insurance_providers (
    pharmacy_id,
    name,
    coverage_percentage,
    contact_email,
    is_active
) VALUES (
    NULL,
    'Test RLS Insurance',
    80,
    'test@test.com',
    true
);

-- 5. If insert succeeded, clean up
DELETE FROM insurance_providers WHERE name = 'Test RLS Insurance';
