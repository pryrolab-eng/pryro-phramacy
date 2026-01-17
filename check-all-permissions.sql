-- Check all users and their roles
SELECT 
    u.email,
    u.id as user_id,
    pu.pharmacy_id,
    p.name as pharmacy_name,
    pu.role,
    CASE 
        WHEN u.email = 'abdousentore@gmail.com' THEN 'SUPERADMIN (hardcoded)'
        WHEN pu.role = 'pharmacy_owner' THEN 'CAN ADD INSURANCE'
        WHEN pu.role = 'admin' THEN 'CAN ADD INSURANCE'
        ELSE 'CANNOT ADD INSURANCE'
    END as insurance_permission
FROM auth.users u
LEFT JOIN pharmacy_users pu ON pu.user_id = u.id
LEFT JOIN pharmacies p ON p.id = pu.pharmacy_id
ORDER BY u.email;

-- Check available roles
SELECT DISTINCT role 
FROM pharmacy_users 
ORDER BY role;

-- Check your specific user
SELECT 
    u.email,
    pu.role,
    CASE 
        WHEN u.email = 'abdousentore@gmail.com' THEN 'YES - Superadmin'
        WHEN pu.role IN ('pharmacy_owner', 'admin') THEN 'YES - Has role'
        ELSE 'NO - Need pharmacy_owner or admin role'
    END as can_add_insurance
FROM auth.users u
LEFT JOIN pharmacy_users pu ON pu.user_id = u.id
WHERE u.email = 'abdousentore@gmail.com';
