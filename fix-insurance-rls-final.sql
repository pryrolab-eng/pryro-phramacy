-- Fix insurance_providers RLS policies - FINAL VERSION

-- Drop all existing policies
DROP POLICY IF EXISTS "Pharmacy staff can view insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "Pharmacy staff can manage insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "Anyone can view active insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "Superadmin can manage insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "view_active_insurance_providers" ON insurance_providers;
DROP POLICY IF EXISTS "superadmin_manage_insurance" ON insurance_providers;
DROP POLICY IF EXISTS "pharmacy_manage_insurance" ON insurance_providers;

-- SELECT policy: Anyone can view active insurance, staff can view their pharmacy's
CREATE POLICY "insurance_select_policy" ON insurance_providers
    FOR SELECT USING (
        is_active = true 
        OR pharmacy_id = ANY(get_user_pharmacy_ids())
        OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
    );

-- INSERT policy: Superadmin can insert anything, staff can insert for their pharmacy
CREATE POLICY "insurance_insert_policy" ON insurance_providers
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
        OR pharmacy_id = ANY(get_user_pharmacy_ids())
    );

-- UPDATE policy: Superadmin can update anything, staff can update their pharmacy's
CREATE POLICY "insurance_update_policy" ON insurance_providers
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
        OR pharmacy_id = ANY(get_user_pharmacy_ids())
    );

-- DELETE policy: Superadmin can delete anything, staff can delete their pharmacy's
CREATE POLICY "insurance_delete_policy" ON insurance_providers
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'abdousentore@gmail.com')
        OR pharmacy_id = ANY(get_user_pharmacy_ids())
    );
