-- Show all RLS policies with full details
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NULL THEN 'NO USING CLAUSE'
        ELSE qual 
    END as using_clause,
    CASE 
        WHEN with_check IS NULL THEN 'NO WITH CHECK CLAUSE'
        ELSE with_check 
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'insurance_providers'
ORDER BY cmd, policyname;
