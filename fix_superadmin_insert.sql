-- Fix superadmin policy to allow INSERT/UPDATE/DELETE

DROP POLICY IF EXISTS "superadmin_all" ON insurance_providers;

CREATE POLICY "superadmin_all" ON insurance_providers
    FOR ALL 
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdousentore@gmail.com'
    )
    WITH CHECK (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdousentore@gmail.com'
    );

SELECT 'Policy updated' as status;
