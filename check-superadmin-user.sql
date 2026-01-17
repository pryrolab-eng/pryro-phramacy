-- Check superadmin user details
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Also check if this user has pharmacy association
SELECT 
    user_id,
    pharmacy_id,
    role
FROM pharmacy_users 
WHERE user_id = '11111111-1111-1111-1111-111111111111';
