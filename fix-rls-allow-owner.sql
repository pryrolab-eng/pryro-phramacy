-- Drop existing INSERT policy
DROP POLICY IF EXISTS "insurance_insert" ON insurance_providers;

-- New policy: Allow superadmin OR pharmacy_owner/admin roles
CREATE POLICY "insurance_insert" ON insurance_providers
    FOR INSERT 
    WITH CHECK (
        -- Superadmin can insert with NULL pharmacy_id
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
        OR 
        -- Pharmacy owner/admin can insert for their pharmacy
        (
            pharmacy_id IS NOT NULL 
            AND pharmacy_id = ANY(get_user_pharmacy_ids())
            AND EXISTS (
                SELECT 1 FROM pharmacy_users 
                WHERE user_id = auth.uid() 
                AND pharmacy_id = insurance_providers.pharmacy_id
                AND role IN ('pharmacy_owner', 'admin')
            )
        )
    );
