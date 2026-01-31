-- Check existing RLS policies on subscriptions
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'subscriptions';
