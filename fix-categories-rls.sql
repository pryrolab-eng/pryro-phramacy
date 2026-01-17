-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Add policies for categories
CREATE POLICY "Pharmacy staff can view categories" ON categories
  FOR SELECT USING (pharmacy_id = ANY(get_user_pharmacy_ids()));

CREATE POLICY "Pharmacy staff can manage categories" ON categories
  FOR ALL USING (pharmacy_id = ANY(get_user_pharmacy_ids()));
