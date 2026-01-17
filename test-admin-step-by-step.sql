-- Step 1: Who am I?
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_email;

-- Step 2: Am I the superadmin?
SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'abdousentore@gmail.com'
) as is_superadmin_check;

-- Step 3: What are my pharmacies?
SELECT get_user_pharmacy_ids() as my_pharmacy_ids;

-- Step 4: My pharmacy_users records
SELECT pu.*, p.name as pharmacy_name
FROM pharmacy_users pu
LEFT JOIN pharmacies p ON p.id = pu.pharmacy_id
WHERE pu.user_id = auth.uid();

-- Step 5: Test the INSERT WITH CHECK condition manually
SELECT 
    -- First condition: superadmin check
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com') as superadmin_passes,
    -- Second condition: pharmacy check (would fail for NULL pharmacy_id)
    (NULL IS NOT NULL AND NULL = ANY(get_user_pharmacy_ids())) as pharmacy_check_passes,
    -- Combined OR result
    (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
        OR 
        (NULL IS NOT NULL AND NULL = ANY(get_user_pharmacy_ids()))
    ) as should_allow_insert;

-- Step 6: Current policies
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'insurance_providers' 
AND cmd = 'INSERT';

-- Step 7: Try actual insert
INSERT INTO insurance_providers (name, coverage_percentage, pharmacy_id, is_active)
VALUES ('Admin Test ' || now(), 80, NULL, true)
RETURNING *;
