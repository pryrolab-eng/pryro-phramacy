-- Simplified RLS fix - remove auth.users dependency for SELECT

DROP POLICY IF EXISTS "Anyone can view global insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "Users can view their pharmacy insurance" ON insurance_providers;
DROP POLICY IF EXISTS "Superadmin full access" ON insurance_providers;
DROP POLICY IF EXISTS "Pharmacy owners can manage their insurance" ON insurance_providers;

-- Policy 1: Anyone can view global active insurance (no auth required)
CREATE POLICY "Public can view global insurance" ON insurance_providers
    FOR SELECT 
    USING (pharmacy_id IS NULL AND is_active = true);

-- Policy 2: Authenticated users can view their pharmacy insurance
CREATE POLICY "Authenticated users view pharmacy insurance" ON insurance_providers
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL
        AND is_active = true 
        AND (
            pharmacy_id IS NULL 
            OR pharmacy_id IN (
                SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid()
            )
        )
    );

-- Policy 3: Superadmin INSERT/UPDATE/DELETE
CREATE POLICY "Superadmin manage all" ON insurance_providers
    FOR ALL 
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email = 'abdousentore@gmail.com'
        )
    );

-- Policy 4: Pharmacy owners INSERT/UPDATE/DELETE their insurance
CREATE POLICY "Pharmacy owners manage insurance" ON insurance_providers
    FOR ALL 
    USING (
        pharmacy_id IN (
            SELECT pharmacy_id FROM pharmacy_users 
            WHERE user_id = auth.uid() AND role IN ('pharmacy_owner', 'admin')
        )
    );

SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'insurance_providers';
