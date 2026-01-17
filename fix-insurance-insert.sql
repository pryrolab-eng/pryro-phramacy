-- Fix insurance_providers INSERT policies

-- Drop existing policies
DROP POLICY IF EXISTS "select_global_insurance" ON insurance_providers;
DROP POLICY IF EXISTS "select_pharmacy_insurance" ON insurance_providers;
DROP POLICY IF EXISTS "superadmin_all" ON insurance_providers;
DROP POLICY IF EXISTS "pharmacy_owner_all" ON insurance_providers;

-- SELECT policies
CREATE POLICY "select_global_insurance" ON insurance_providers
    FOR SELECT 
    USING (pharmacy_id IS NULL AND is_active = true);

CREATE POLICY "select_pharmacy_insurance" ON insurance_providers
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL
        AND is_active = true 
        AND (pharmacy_id IS NULL OR pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid()))
    );

-- Superadmin full access
CREATE POLICY "superadmin_all" ON insurance_providers
    FOR ALL 
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdousentore@gmail.com'
    )
    WITH CHECK (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdousentore@gmail.com'
    );

-- Pharmacy owners can manage their pharmacy's insurance
CREATE POLICY "pharmacy_owner_manage" ON insurance_providers
    FOR ALL 
    USING (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND role IN ('pharmacy_owner', 'admin'))
    )
    WITH CHECK (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND role IN ('pharmacy_owner', 'admin'))
    );
