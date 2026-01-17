-- Fix insurance_providers table issues

-- 1. Add missing invoice_template column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'insurance_providers' 
        AND column_name = 'invoice_template'
    ) THEN
        ALTER TABLE insurance_providers 
        ADD COLUMN invoice_template text DEFAULT 'default';
    END IF;
END $$;

-- 2. Add missing template_config column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'insurance_providers' 
        AND column_name = 'template_config'
    ) THEN
        ALTER TABLE insurance_providers 
        ADD COLUMN template_config jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Fix RLS policies to allow proper access
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
            AND pu.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        pharmacy_id IN (
            SELECT pu.pharmacy_id 
            FROM pharmacy_users pu
            WHERE pu.user_id = auth.uid() 
            AND pu.role IN ('owner', 'admin')
        )
    );

-- Update existing records to have default values
UPDATE insurance_providers 
SET invoice_template = 'default' 
WHERE invoice_template IS NULL;

UPDATE insurance_providers 
SET template_config = '{}'::jsonb 
WHERE template_config IS NULL;

-- Show results
SELECT 
    COUNT(*) as total_providers,
    COUNT(*) FILTER (WHERE pharmacy_id IS NULL) as global_providers,
    COUNT(*) FILTER (WHERE pharmacy_id IS NOT NULL) as pharmacy_specific,
    COUNT(*) FILTER (WHERE is_active = true) as active_providers
FROM insurance_providers;
