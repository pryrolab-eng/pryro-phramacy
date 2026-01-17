-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS categories CASCADE;

-- Create categories table with correct structure
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index
CREATE INDEX idx_categories_pharmacy_id ON categories(pharmacy_id);

-- Create trigger for updated_at
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert test data
INSERT INTO categories (pharmacy_id, name, description, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Antibiotics', 'Antibiotic medications', true),
  ('11111111-1111-1111-1111-111111111111', 'Pain Relief', 'Pain relief medications', true),
  ('11111111-1111-1111-1111-111111111111', 'Vitamins', 'Vitamin supplements', true);

-- Verify
SELECT * FROM categories;
