-- Add test inventory to Test Pharmacy in one query
WITH new_med AS (
  INSERT INTO medications (pharmacy_id, name, category, is_active)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Medicine XYZ', 'otc', true)
  RETURNING id
)
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
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  id,
  'BATCH-TEST-001',
  100,
  500,
  750,
  20,
  '2025-12-31'
FROM new_med;
