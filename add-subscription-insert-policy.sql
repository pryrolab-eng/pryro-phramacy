-- Add INSERT policy for pharmacy owners
CREATE POLICY "Pharmacy owners can create subscriptions"
ON subscriptions FOR INSERT
WITH CHECK (
  pharmacy_id IN (
    SELECT id FROM pharmacies WHERE owner_id = auth.uid()
  )
  OR is_admin()
);

-- Add UPDATE policy for pharmacy owners
CREATE POLICY "Pharmacy owners can update subscriptions"
ON subscriptions FOR UPDATE
USING (
  pharmacy_id IN (
    SELECT id FROM pharmacies WHERE owner_id = auth.uid()
  )
  OR is_admin()
);
