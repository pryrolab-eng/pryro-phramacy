-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'insurance_providers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON insurance_providers';
    END LOOP;
END $$;

-- Create fresh policies
CREATE POLICY "select_global" ON insurance_providers
    FOR SELECT 
    USING (pharmacy_id IS NULL AND is_active = true);

CREATE POLICY "select_authenticated" ON insurance_providers
    FOR SELECT 
    TO authenticated
    USING (
        is_active = true 
        AND (pharmacy_id IS NULL OR pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid()))
    );

CREATE POLICY "superadmin_all" ON insurance_providers
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
    );

CREATE POLICY "pharmacy_owner_all" ON insurance_providers
    FOR ALL 
    TO authenticated
    USING (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND role IN ('pharmacy_owner', 'admin'))
    )
    WITH CHECK (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND role IN ('pharmacy_owner', 'admin'))
    );

SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'insurance_providers';
