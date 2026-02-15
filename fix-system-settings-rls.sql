-- Fix RLS policies for system_settings table

-- Drop existing policies
DROP POLICY IF EXISTS "Superadmin full access" ON system_settings;
DROP POLICY IF EXISTS "superadmin_all_access" ON system_settings;

-- Create new policy for superadmin
CREATE POLICY "superadmin_all_access" ON system_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_users
    WHERE pharmacy_users.user_id = auth.uid()
    AND pharmacy_users.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pharmacy_users
    WHERE pharmacy_users.user_id = auth.uid()
    AND pharmacy_users.role = 'superadmin'
  )
);
