-- ADD SIMPLE SAMPLE DATA (using existing columns only)

-- 1. ADD MEDICATIONS
INSERT INTO medications (id, name, category, requires_prescription, is_active, pharmacy_id)
SELECT 
  gen_random_uuid(), name, category, requires_prescription, true,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
FROM (VALUES 
  ('Paracetamol 500mg', 'Pain Relief', false),
  ('Amoxicillin 250mg', 'Antibiotics', true),
  ('Vitamin C Tablets', 'Vitamins', false),
  ('Ibuprofen 400mg', 'Pain Relief', false)
) AS meds(name, category, requires_prescription)
WHERE NOT EXISTS (SELECT 1 FROM medications WHERE name = meds.name);

-- 2. ADD INVENTORY WITH ALERTS
INSERT INTO inventory (id, medication_id, batch_number, quantity_in_stock, minimum_stock_level, expiry_date, pharmacy_id)
SELECT 
  gen_random_uuid(),
  m.id,
  'BATCH' || ROW_NUMBER() OVER(),
  stock_qty,
  min_stock,
  expiry_date,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
FROM medications m
CROSS JOIN (VALUES 
  (5, 20, CURRENT_DATE + INTERVAL '15 days'),   -- Low stock + Expiring
  (8, 25, CURRENT_DATE + INTERVAL '10 days')    -- Low stock + Expiring soon
) AS stock_data(stock_qty, min_stock, expiry_date)
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE medication_id = m.id)
LIMIT 4;

-- 3. ADD SALES WITH INSURANCE
INSERT INTO sales (id, customer_name, total_amount, payment_method, status, created_at, pharmacy_id)
VALUES 
  (gen_random_uuid(), 'John Doe', 2500, 'Insurance', 'completed', NOW() - INTERVAL '1 hour', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  (gen_random_uuid(), 'Mary Smith', 1800, 'Cash', 'completed', NOW() - INTERVAL '2 hours', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  (gen_random_uuid(), 'Peter Wilson', 3200, 'Insurance', 'completed', NOW() - INTERVAL '3 hours', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- 4. VERIFY ALERTS
SELECT 'LOW_STOCK' as alert_type, COUNT(*) as count 
FROM inventory 
WHERE quantity_in_stock <= minimum_stock_level;

SELECT 'EXPIRING' as alert_type, COUNT(*) as count 
FROM inventory 
WHERE expiry_date <= CURRENT_DATE + INTERVAL '60 days';

SELECT '✅ SAMPLE DATA ADDED' as status;