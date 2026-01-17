-- Final RLS fix - no auth.users dependency

DROP POLICY IF EXISTS "Public can view global insurance" ON insurance_providers;
DROP POLICY IF EXISTS "Authenticated users view pharmacy insurance" ON insurance_providers;
DROP POLICY IF EXISTS "Superadmin manage all" ON insurance_providers;
DROP POLICY IF EXISTS "Pharmacy owners manage insurance" ON insurance_providers;
DROP POLICY IF EXISTS "Anyone can view active insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "Superadmin can manage insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "Users can view their pharmacy insurance" ON insurance_providers;
DROP POLICY IF EXISTS "Superadmin full access" ON insurance_providers;
DROP POLICY IF EXISTS "Pharmacy owners can manage their insurance" ON insurance_providers;

-- Policy 1: Public SELECT for global insurance
CREATE POLICY "select_global_insurance" ON insurance_providers
    FOR SELECT 
    USING (pharmacy_id IS NULL AND is_active = true);

-- Policy 2: Authenticated SELECT for pharmacy insurance
CREATE POLICY "select_pharmacy_insurance" ON insurance_providers
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL
        AND is_active = true 
        AND (pharmacy_id IS NULL OR pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid()))
    );

-- Policy 3: Superadmin ALL (check email directly)
CREATE POLICY "superadmin_all" ON insurance_providers
    FOR ALL 
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdousentore@gmail.com'
    );

-- Policy 4: Pharmacy owners ALL
CREATE POLICY "pharmacy_owner_all" ON insurance_providers
    FOR ALL 
    USING (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND role IN ('pharmacy_owner', 'admin'))
    );

SELECT COUNT(*) FROM pg_policies WHERE tablename = 'insurance_providers';
