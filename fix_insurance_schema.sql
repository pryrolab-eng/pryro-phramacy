-- Fix insurance providers to allow global access

-- Make pharmacy_id nullable for global insurance providers
ALTER TABLE insurance_providers ALTER COLUMN pharmacy_id DROP NOT NULL;

-- Update RLS policies to allow global access
DROP POLICY IF EXISTS "Pharmacy staff can view insurance providers" ON insurance_providers;
CREATE POLICY "Anyone can view insurance providers" ON insurance_providers
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Pharmacy staff can manage insurance providers" ON insurance_providers;
CREATE POLICY "Superadmin can manage insurance providers" ON insurance_providers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'abdousentore@gmail.com'
        )
    );

-- Insert some default global insurance providers
INSERT INTO insurance_providers (name, coverage_percentage, pharmacy_id, is_active) VALUES
    ('RSSB', 80.00, NULL, true),
    ('MMI', 90.00, NULL, true),
    ('Radiant Insurance', 85.00, NULL, true),
    ('SONARWA', 75.00, NULL, true)
ON CONFLICT DO NOTHING;