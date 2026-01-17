-- Set the user context to superadmin
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Check current policies
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'insurance_providers';

-- Test INSERT as superadmin
INSERT INTO insurance_providers (
    pharmacy_id,
    name,
    coverage_percentage,
    is_active
) VALUES (
    NULL,
    'Test Insurance RLS',
    80,
    true
);

-- If successful, delete test data
DELETE FROM insurance_providers WHERE name = 'Test Insurance RLS';
