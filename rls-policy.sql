-- First, drop existing policies that might be blocking
DROP POLICY IF EXISTS "pharmacy add pharmacists" ON pharmacy_users;
DROP POLICY IF EXISTS "superadmin add pharmacists" ON pharmacy_users;

-- Simple policy: allow authenticated users to insert pharmacists
CREATE POLICY "allow_pharmacist_creation" ON pharmacy_users
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND role IN ('pharmacist', 'cashier', 'staff')
);

-- Allow pharmacy owners to manage their pharmacy users
CREATE POLICY "pharmacy_owner_manage" ON pharmacy_users
FOR ALL
USING (
  pharmacy_id IN (
    SELECT id FROM pharmacies WHERE owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM pharmacy_users pu 
    WHERE pu.user_id = auth.uid() 
    AND pu.role = 'pharmacy_owner'
    AND pu.pharmacy_id = pharmacy_users.pharmacy_id
  )
);

-- Allow superadmin full access
CREATE POLICY "superadmin_full_access" ON pharmacy_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_users pu 
    WHERE pu.user_id = auth.uid() 
    AND pu.role = 'superadmin'
  )
);