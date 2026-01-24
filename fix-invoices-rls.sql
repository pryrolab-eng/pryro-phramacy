-- Add INSERT policy for invoices
DROP POLICY IF EXISTS "Users can insert their pharmacy invoices" ON invoices;
CREATE POLICY "Users can insert their pharmacy invoices"
  ON invoices FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid()));
