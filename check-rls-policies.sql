-- Check all RLS policies on insurance_providers
SELECT 
    policyname,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'insurance_providers'
ORDER BY cmd, policyname;
