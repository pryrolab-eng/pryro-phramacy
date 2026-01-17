-- Check if RLS is blocking inventory inserts

-- 1. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('inventory', 'medications');

-- 2. Check INSERT policies for inventory
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'inventory'
AND cmd = 'INSERT';

-- 3. Check INSERT policies for medications
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'medications'
AND cmd = 'INSERT';

-- 4. Test if current user can insert (run as authenticated user)
-- This will show if the policy allows the insert
DO $$
BEGIN
    -- Try to check if user has pharmacy association
    IF EXISTS (
        SELECT 1 FROM pharmacy_users 
        WHERE user_id = auth.uid() 
        AND is_active = true
    ) THEN
        RAISE NOTICE 'User has pharmacy association';
    ELSE
        RAISE NOTICE 'User does NOT have pharmacy association';
    END IF;
END $$;

-- 5. Check pharmacy_users for current user
-- Replace with actual user_id
SELECT 
    pu.id,
    pu.user_id,
    pu.pharmacy_id,
    pu.role,
    pu.is_active,
    p.name as pharmacy_name
FROM pharmacy_users pu
JOIN pharmacies p ON pu.pharmacy_id = p.id
WHERE pu.user_id = auth.uid();

-- 6. Check if there are any triggers that might be blocking
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('inventory', 'medications')
AND event_manipulation = 'INSERT';
