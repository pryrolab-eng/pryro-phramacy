-- 1. Check who you are logged in as
SELECT 
    auth.uid() as my_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as my_email,
    (SELECT raw_user_meta_data FROM auth.users WHERE id = auth.uid()) as my_metadata;

-- 2. Check if superadmin check works
SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'abdousentore@gmail.com'
) as am_i_superadmin;

-- 3. Check my pharmacy access
SELECT get_user_pharmacy_ids() as my_pharmacies;

-- 4. Check my pharmacy_users record
SELECT * FROM pharmacy_users WHERE user_id = auth.uid();

-- 5. Check current RLS policies
SELECT 
    policyname,
    cmd,
    CASE WHEN with_check IS NULL THEN 'NO CHECK' ELSE with_check END as with_check_clause
FROM pg_policies 
WHERE tablename = 'insurance_providers'
ORDER BY cmd;

-- 6. Test if I can insert (this will show exact error)
INSERT INTO insurance_providers (name, coverage_percentage, is_active)
VALUES ('RLS Test ' || now(), 80, true)
RETURNING *;
