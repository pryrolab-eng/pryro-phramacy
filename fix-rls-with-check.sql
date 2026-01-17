-- Drop ALL policies on insurance_providers
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'insurance_providers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON insurance_providers';
    END LOOP;
END $$;

-- Create new policies with WITH CHECK clause
CREATE POLICY "insurance_select" ON insurance_providers
    FOR SELECT USING (
        is_active = true 
        OR pharmacy_id = ANY(get_user_pharmacy_ids())
        OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
    );

CREATE POLICY "insurance_insert" ON insurance_providers
    FOR INSERT 
    WITH CHECK (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
        OR (pharmacy_id = ANY(get_user_pharmacy_ids()) AND pharmacy_id IS NOT NULL)
    );

CREATE POLICY "insurance_update" ON insurance_providers
    FOR UPDATE 
    USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
        OR pharmacy_id = ANY(get_user_pharmacy_ids())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
        OR (pharmacy_id = ANY(get_user_pharmacy_ids()) AND pharmacy_id IS NOT NULL)
    );

CREATE POLICY "insurance_delete" ON insurance_providers
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
        OR pharmacy_id = ANY(get_user_pharmacy_ids())
    );
