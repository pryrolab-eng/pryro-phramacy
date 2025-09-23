-- Add invoice template fields to insurance providers
ALTER TABLE insurance_providers 
ADD COLUMN IF NOT EXISTS invoice_template text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS template_config jsonb DEFAULT '{}';

-- Make pharmacy_id nullable
ALTER TABLE insurance_providers ALTER COLUMN pharmacy_id DROP NOT NULL;

-- Update RLS policy for global access
DROP POLICY IF EXISTS "Pharmacy staff can view insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "Anyone can view insurance providers" ON insurance_providers;
CREATE POLICY "Anyone can view insurance providers" ON insurance_providers
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Pharmacy staff can manage insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "Superadmin can manage insurance providers" ON insurance_providers;
CREATE POLICY "Superadmin can manage insurance providers" ON insurance_providers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'abdousentore@gmail.com'
        )
    );