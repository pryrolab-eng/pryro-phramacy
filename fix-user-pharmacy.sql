-- Fix user pharmacy access and add test data

-- 1. Add user to pharmacy (using existing test pharmacy)
INSERT INTO pharmacy_users (pharmacy_id, user_id, role, is_active)
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '48fa73ee-1a11-475d-bdc6-8785f69d1954',
  'pharmacy_owner',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_users 
  WHERE user_id = '48fa73ee-1a11-475d-bdc6-8785f69d1954'
);

-- 2. Add test medication
INSERT INTO medications (id, pharmacy_id, name, category, requires_prescription, is_active)
VALUES (
  'med-test-001',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Test Paracetamol 500mg',
  'otc',
  false,
  true
) ON CONFLICT (id) DO NOTHING;

-- 3. Add test inventory
INSERT INTO inventory (
  pharmacy_id, 
  medication_id, 
  batch_number, 
  quantity_in_stock, 
  unit_cost, 
  selling_price, 
  minimum_stock_level, 
  expiry_date
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'med-test-001',
  'TEST001',
  100,
  400,
  500,
  20,
  '2025-12-31'
) ON CONFLICT DO NOTHING;