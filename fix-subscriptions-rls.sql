-- Fix subscriptions RLS policy for payment creation

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their pharmacy subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert their pharmacy subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their pharmacy subscriptions" ON subscriptions;

-- Allow viewing subscriptions
CREATE POLICY "Users can view their pharmacy subscriptions"
ON subscriptions FOR SELECT
USING (
  pharmacy_id IN (
    SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid()
  )
);

-- Allow inserting subscriptions (pharmacy owners and admins only)
CREATE POLICY "Pharmacy owners can create subscriptions"
ON subscriptions FOR INSERT
WITH CHECK (
  pharmacy_id IN (
    SELECT pharmacy_id 
    FROM pharmacy_users 
    WHERE user_id = auth.uid() 
    AND role IN ('pharmacy_owner', 'admin')
  )
);

-- Allow updating subscriptions (pharmacy owners and admins only)
CREATE POLICY "Pharmacy owners can update subscriptions"
ON subscriptions FOR UPDATE
USING (
  pharmacy_id IN (
    SELECT pharmacy_id 
    FROM pharmacy_users 
    WHERE user_id = auth.uid() 
    AND role IN ('pharmacy_owner', 'admin')
  )
);
