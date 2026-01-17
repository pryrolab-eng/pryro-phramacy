-- Check if helper function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_pharmacy_ids';

-- Test the function (run as logged in user)
SELECT get_user_pharmacy_ids();

-- Check current user
SELECT auth.uid();

-- Simpler policy without helper function
DROP POLICY IF EXISTS "Pharmacy staff can manage categories" ON categories;

CREATE POLICY "Pharmacy staff can manage categories" ON categories
FOR ALL USING (
  pharmacy_id IN (
    SELECT pharmacy_id FROM pharmacy_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);
