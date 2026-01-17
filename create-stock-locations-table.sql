-- Create stock_locations table
CREATE TABLE IF NOT EXISTS stock_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_locations_pharmacy ON stock_locations(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_stock_locations_active ON stock_locations(is_active);

-- Insert default locations for existing pharmacies
INSERT INTO stock_locations (pharmacy_id, name, description, is_active)
SELECT 
  id as pharmacy_id,
  'Main Store' as name,
  'Primary location' as description,
  true as is_active
FROM pharmacies
WHERE NOT EXISTS (
  SELECT 1 FROM stock_locations 
  WHERE stock_locations.pharmacy_id = pharmacies.id 
  AND stock_locations.name = 'Main Store'
);

INSERT INTO stock_locations (pharmacy_id, name, description, is_active)
SELECT 
  id as pharmacy_id,
  'Branch' as name,
  'Secondary location' as description,
  true as is_active
FROM pharmacies
WHERE NOT EXISTS (
  SELECT 1 FROM stock_locations 
  WHERE stock_locations.pharmacy_id = pharmacies.id 
  AND stock_locations.name = 'Branch'
);

INSERT INTO stock_locations (pharmacy_id, name, description, is_active)
SELECT 
  id as pharmacy_id,
  'Cold Storage' as name,
  'Temperature controlled' as description,
  true as is_active
FROM pharmacies
WHERE NOT EXISTS (
  SELECT 1 FROM stock_locations 
  WHERE stock_locations.pharmacy_id = pharmacies.id 
  AND stock_locations.name = 'Cold Storage'
);

INSERT INTO stock_locations (pharmacy_id, name, description, is_active)
SELECT 
  id as pharmacy_id,
  'Warehouse' as name,
  'Bulk storage' as description,
  true as is_active
FROM pharmacies
WHERE NOT EXISTS (
  SELECT 1 FROM stock_locations 
  WHERE stock_locations.pharmacy_id = pharmacies.id 
  AND stock_locations.name = 'Warehouse'
);

-- Add RLS policies
ALTER TABLE stock_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view locations for their pharmacy
CREATE POLICY "Users can view their pharmacy locations"
  ON stock_locations FOR SELECT
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacy_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policy: Users can insert locations for their pharmacy
CREATE POLICY "Users can insert locations for their pharmacy"
  ON stock_locations FOR INSERT
  WITH CHECK (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacy_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policy: Users can update locations for their pharmacy
CREATE POLICY "Users can update their pharmacy locations"
  ON stock_locations FOR UPDATE
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacy_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
