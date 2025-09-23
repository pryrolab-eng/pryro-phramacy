-- Multi-Branch Pharmacy Support Schema

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid REFERENCES pharmacies(id),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  phone text,
  manager_name text,
  is_main boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Update inventory to include branch_id
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id);

-- Stock transfers table
CREATE TABLE IF NOT EXISTS stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_branch_id uuid REFERENCES branches(id),
  to_branch_id uuid REFERENCES branches(id),
  product_id uuid REFERENCES inventory(id),
  quantity integer NOT NULL,
  transfer_date timestamp DEFAULT now(),
  status text DEFAULT 'pending', -- pending, approved, completed, cancelled
  requested_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamp DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users can view their pharmacy branches" ON branches
  FOR SELECT USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage stock transfers" ON stock_transfers
  FOR ALL USING (
    from_branch_id IN (
      SELECT b.id FROM branches b 
      JOIN user_profiles up ON b.pharmacy_id = up.pharmacy_id 
      WHERE up.user_id = auth.uid()
    )
    OR to_branch_id IN (
      SELECT b.id FROM branches b 
      JOIN user_profiles up ON b.pharmacy_id = up.pharmacy_id 
      WHERE up.user_id = auth.uid()
    )
  );