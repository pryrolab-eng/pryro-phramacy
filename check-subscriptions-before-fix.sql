-- Check subscriptions table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Check existing RLS policies on subscriptions
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
WHERE tablename = 'subscriptions';

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'subscriptions';

-- Check current user's role
SELECT 
    pu.user_id,
    pu.pharmacy_id,
    pu.role,
    au.email
FROM pharmacy_users pu
JOIN auth.users au ON au.id = pu.user_id
WHERE pu.user_id = auth.uid();

-- Check existing subscriptions
SELECT 
    id,
    pharmacy_id,
    plan,
    amount,
    is_active,
    created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;
