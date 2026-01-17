-- Temporarily use service role bypass for superadmin inserts
-- Drop all policies and recreate simpler ones

DROP POLICY IF EXISTS "select_global_insurance" ON insurance_providers;
DROP POLICY IF EXISTS "select_pharmacy_insurance" ON insurance_providers;
DROP POLICY IF EXISTS "superadmin_all" ON insurance_providers;
DROP POLICY IF EXISTS "pharmacy_owner_all" ON insurance_providers;

-- Policy 1: Public SELECT
CREATE POLICY "select_global" ON insurance_providers
    FOR SELECT 
    USING (pharmacy_id IS NULL AND is_active = true);

-- Policy 2: Authenticated SELECT
CREATE POLICY "select_authenticated" ON insurance_providers
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL
        AND is_active = true 
        AND (pharmacy_id IS NULL OR pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid()))
    );

-- Policy 3: Superadmin ALL (simplified - check if user exists with that email)
CREATE POLICY "superadmin_all" ON insurance_providers
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
    );

-- Policy 4: Pharmacy owners
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
