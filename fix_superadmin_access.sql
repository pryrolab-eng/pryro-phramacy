-- Fix superadmin access to pharmacies and enable global sharing

-- Update RLS policies for pharmacies to allow superadmin full access
DROP POLICY IF EXISTS "Users can view their pharmacies" ON pharmacies;
CREATE POLICY "Users can view their pharmacies" ON pharmacies
    FOR SELECT USING (
        id = ANY(get_user_pharmacy_ids()) OR 
        owner_id = auth.uid() OR 
        is_admin() OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'abdousentore@gmail.com'
        )
    );

DROP POLICY IF EXISTS "Pharmacy owners can update their pharmacies" ON pharmacies;
CREATE POLICY "Pharmacy owners can update their pharmacies" ON pharmacies
    FOR UPDATE USING (
        owner_id = auth.uid() OR 
        is_admin() OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'abdousentore@gmail.com'
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create pharmacies" ON pharmacies;
CREATE POLICY "Authenticated users can create pharmacies" ON pharmacies
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            auth.uid() IS NOT NULL OR
            EXISTS (
                SELECT 1 FROM auth.users 
                WHERE id = auth.uid() 
                AND email = 'abdousentore@gmail.com'
            )
        )
    );

-- Allow superadmin to delete pharmacies
CREATE POLICY "Superadmin can delete pharmacies" ON pharmacies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'abdousentore@gmail.com'
        )
    );

-- Update insurance providers to allow global access
-- Add a pharmacy_id column that can be NULL for global providers
ALTER TABLE insurance_providers ALTER COLUMN pharmacy_id DROP NOT NULL;

-- Update RLS policies for insurance providers
DROP POLICY IF EXISTS "Pharmacy staff can view insurance providers" ON insurance_providers;
CREATE POLICY "Pharmacy staff can view insurance providers" ON insurance_providers
    FOR SELECT USING (
        pharmacy_id = ANY(get_user_pharmacy_ids()) OR 
        pharmacy_id IS NULL OR  -- Global providers
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'abdousentore@gmail.com'
        )
    );

DROP POLICY IF EXISTS "Pharmacy staff can manage insurance providers" ON insurance_providers;
CREATE POLICY "Pharmacy staff can manage insurance providers" ON insurance_providers
    FOR ALL USING (
        pharmacy_id = ANY(get_user_pharmacy_ids()) OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'abdousentore@gmail.com'
        )
    );

-- Insert some global insurance providers (pharmacy_id = NULL)
INSERT INTO insurance_providers (name, coverage_percentage, pharmacy_id, is_active) VALUES
    ('RSSB', 80.00, NULL, true),
    ('MMI', 90.00, NULL, true),
    ('Radiant Insurance', 85.00, NULL, true),
    ('SONARWA', 75.00, NULL, true)
ON CONFLICT DO NOTHING;