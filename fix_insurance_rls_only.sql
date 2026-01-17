-- Fix insurance_providers RLS policies ONLY
-- Columns already exist, just need to fix access policies

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "Superadmin can manage insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "Pharmacy users can view their insurance" ON insurance_providers;

-- Create new policies

-- Policy 1: Allow viewing active global insurance providers (pharmacy_id is null)
CREATE POLICY "Anyone can view global insurance providers" ON insurance_providers
    FOR SELECT 
    USING (is_active = true AND pharmacy_id IS NULL);

-- Policy 2: Allow authenticated users to view their pharmacy's insurance
CREATE POLICY "Users can view their pharmacy insurance" ON insurance_providers
    FOR SELECT 
    USING (
        is_active = true 
        AND (
            pharmacy_id IS NULL 
            OR pharmacy_id IN (
                SELECT pharmacy_id 
                FROM pharmacy_users 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy 3: Superadmin can do everything
CREATE POLICY "Superadmin full access" ON insurance_providers
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'abdousentore@gmail.com'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'abdousentore@gmail.com'
        )
    );

-- Policy 4: Pharmacy owners can manage their own insurance providers
CREATE POLICY "Pharmacy owners can manage their insurance" ON insurance_providers
    FOR ALL 
    USING (
        pharmacy_id IN (
            SELECT pu.pharmacy_id 
            FROM pharmacy_users pu
            WHERE pu.user_id = auth.uid() 
            AND pu.role IN ('pharmacy_owner', 'admin')
        )
    )
    WITH CHECK (
        pharmacy_id IN (
            SELECT pu.pharmacy_id 
            FROM pharmacy_users pu
            WHERE pu.user_id = auth.uid() 
            AND pu.role IN ('pharmacy_owner', 'admin')
        )
    );

-- Verify the fix
SELECT 
    'RLS Policies Updated' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'insurance_providers';
