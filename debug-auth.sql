-- Check current user context
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_email,
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com') as is_superadmin,
    get_user_pharmacy_ids() as user_pharmacies;

-- Check current policies
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'insurance_providers' 
ORDER BY cmd;
