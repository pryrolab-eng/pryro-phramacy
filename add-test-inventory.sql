-- Add test inventory to Test Pharmacy (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)

-- First, create a medication
INSERT INTO medications (id, pharmacy_id, name, category, is_active)
VALUES (
  gen_random_uuid(),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Test Medicine XYZ',
  'otc',
  true
)
RETURNING id;

-- Copy the medication ID from above and use it here
-- Replace 'MEDICATION_ID_HERE' with the actual ID
INSERT INTO inventory (
  pharmacy_id,
  medication_id,
  batch_number,
  quantity_in_stock,
  unit_cost,
  selling_price,
  minimum_stock_level,
  expiry_date
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'MEDICATION_ID_HERE',
  'BATCH-TEST-001',
  100,
  500,
  750,
  20,
  '2025-12-31'
);

-- Verify it was added
SELECT 
  i.id,
  i.pharmacy_id,
  m.name,
  i.quantity_in_stock,
  p.name as pharmacy_name
FROM inventory i
JOIN medications m ON i.medication_id = m.id
JOIN pharmacies p ON i.pharmacy_id = p.id
WHERE i.pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ORDER BY i.created_at DESC;
