-- Drop all policies
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'insurance_providers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON insurance_providers';
    END LOOP;
END $$;

-- Simple INSERT policy: allow if superadmin OR if pharmacy_id matches user's pharmacy
CREATE POLICY "insurance_insert" ON insurance_providers
    FOR INSERT 
    WITH CHECK (
        -- Superadmin can insert with NULL or any pharmacy_id
        (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com'))
        OR 
        -- Regular users can only insert for their pharmacy
        (pharmacy_id IS NOT NULL AND pharmacy_id = ANY(get_user_pharmacy_ids()))
    );

-- SELECT policy
CREATE POLICY "insurance_select" ON insurance_providers
    FOR SELECT USING (true);

-- UPDATE policy
CREATE POLICY "insurance_update" ON insurance_providers
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
        OR pharmacy_id = ANY(get_user_pharmacy_ids())
    );

-- DELETE policy  
CREATE POLICY "insurance_delete" ON insurance_providers
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
        OR pharmacy_id = ANY(get_user_pharmacy_ids())
    );
