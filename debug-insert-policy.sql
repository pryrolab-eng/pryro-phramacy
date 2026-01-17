-- 1. Who am I?
SELECT auth.uid() as my_id, (SELECT email FROM auth.users WHERE id = auth.uid()) as my_email;

-- 2. My pharmacy_users record
SELECT * FROM pharmacy_users WHERE user_id = auth.uid();

-- 3. My pharmacy IDs
SELECT get_user_pharmacy_ids() as my_pharmacies;

-- 4. Test each part of the INSERT policy
SELECT 
    -- Part 1: Am I superadmin?
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com') as superadmin_check,
    
    -- Part 2: For a test pharmacy_id, check if it's in my list
    (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() LIMIT 1) as my_pharmacy_id,
    
    -- Part 3: Is my pharmacy in the array?
    (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() LIMIT 1) = ANY(get_user_pharmacy_ids()) as pharmacy_in_array,
    
    -- Part 4: Check if NOT NULL
    (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() LIMIT 1) IS NOT NULL as pharmacy_not_null;

-- 5. Current INSERT policy
SELECT policyname, with_check FROM pg_policies WHERE tablename = 'insurance_providers' AND cmd = 'INSERT';

-- 6. Try to insert with MY pharmacy_id
INSERT INTO insurance_providers (name, coverage_percentage, pharmacy_id, is_active)
VALUES (
    'Test Insert ' || now(), 
    80, 
    (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() LIMIT 1),
    true
)
RETURNING *;
