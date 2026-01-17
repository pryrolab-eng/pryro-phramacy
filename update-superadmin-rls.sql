-- Update superadmin policy to include muzungu@gmail.com
DROP POLICY IF EXISTS "superadmin_all" ON insurance_providers;

CREATE POLICY "superadmin_all" ON insurance_providers
    FOR ALL 
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('abdousentore@gmail.com', 'muzungu@gmail.com')
    )
    WITH CHECK (
        (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('abdousentore@gmail.com', 'muzungu@gmail.com')
    );

-- Verify
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'insurance_providers' AND policyname = 'superadmin_all';
