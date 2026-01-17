-- Test 1: Check your current user and role
SELECT 
    'Current User Info' as test,
    u.id,
    u.email,
    pu.role,
    pu.pharmacy_id
FROM auth.users u
LEFT JOIN pharmacy_users pu ON pu.user_id = u.id
WHERE u.email = 'abdousentore@gmail.com';

-- Test 2: Direct INSERT as superadmin (should work if RLS allows)
INSERT INTO insurance_providers (
    pharmacy_id,
    name,
    coverage_percentage,
    is_active
) VALUES (
    NULL,
    'Direct SQL Test Insurance',
    80,
    true
) RETURNING *;

-- Test 3: Check if insert worked
SELECT * FROM insurance_providers WHERE name = 'Direct SQL Test Insurance';

-- Cleanup
DELETE FROM insurance_providers WHERE name = 'Direct SQL Test Insurance';
