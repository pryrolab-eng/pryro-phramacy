-- Check current staff associations
SELECT 
    au.email,
    pu.role,
    pu.pharmacy_id,
    p.name as pharmacy_name,
    p.owner_id
FROM auth.users au
JOIN pharmacy_users pu ON au.id = pu.user_id
JOIN pharmacies p ON pu.pharmacy_id = p.id
WHERE pu.role != 'pharmacy_owner'
ORDER BY p.name;

-- The problem: Staff added by muzungu@gmail.com should be linked to Kipharma (d80dec24-fcef-4d60-9dcb-1ca3f08c7a57)
-- But they're linked to Test Pharmacy (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)

-- Fix: You need to manually update staff to correct pharmacy
-- Example: If staff2rrr2muzunggu@gmail.com belongs to muzungu@gmail.com's pharmacy:

UPDATE pharmacy_users 
SET pharmacy_id = 'd80dec24-fcef-4d60-9dcb-1ca3f08c7a57'
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'staff2rrr2muzunggu@gmail.com'
);

-- Verify
SELECT 
    au.email,
    pu.role,
    p.name as pharmacy_name
FROM auth.users au
JOIN pharmacy_users pu ON au.id = pu.user_id
JOIN pharmacies p ON pu.pharmacy_id = p.id
WHERE au.email LIKE '%staff%'
ORDER BY p.name;
