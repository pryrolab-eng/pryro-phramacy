-- ADD COMPLETE SAMPLE DATA FOR ALL DASHBOARD FEATURES

-- 1. ADD SAMPLE MEDICATIONS (if empty)
INSERT INTO medications (id, name, category, requires_prescription, is_active, pharmacy_id, unit_price, manufacturer)
SELECT 
  gen_random_uuid(),
  name, category, requires_prescription, true,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  price, manufacturer
FROM (VALUES 
  ('Paracetamol 500mg', 'Pain Relief', false, 500, 'Pharma Ltd'),
  ('Amoxicillin 250mg', 'Antibiotics', true, 1200, 'MedCorp'),
  ('Vitamin C Tablets', 'Vitamins', false, 800, 'HealthCo'),
  ('Ibuprofen 400mg', 'Pain Relief', false, 600, 'Pharma Ltd'),
  ('Omeprazole 20mg', 'Gastric', true, 1500, 'MedCorp'),
  ('Aspirin 100mg', 'Cardiovascular', false, 300, 'CardioMed'),
  ('Metformin 500mg', 'Diabetes', true, 900, 'DiabetCare'),
  ('Cetirizine 10mg', 'Antihistamine', false, 400, 'AllergyFree')
) AS meds(name, category, requires_prescription, price, manufacturer)
WHERE NOT EXISTS (SELECT 1 FROM medications WHERE name = meds.name);

-- 2. ADD SAMPLE INVENTORY WITH EXPIRATION ALERTS
INSERT INTO inventory (id, medication_id, batch_number, quantity_in_stock, minimum_stock_level, expiry_date, pharmacy_id, purchase_price, selling_price)
SELECT 
  gen_random_uuid(),
  m.id,
  'BATCH' || LPAD(ROW_NUMBER() OVER()::text, 3, '0'),
  stock_qty,
  min_stock,
  expiry,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  m.unit_price * 0.7,
  m.unit_price
FROM medications m
CROSS JOIN (VALUES 
  (5, 20, CURRENT_DATE + INTERVAL '15 days'),   -- Expiring soon + Low stock
  (50, 30, CURRENT_DATE + INTERVAL '45 days'),  -- Expiring soon
  (8, 25, CURRENT_DATE + INTERVAL '10 days'),   -- Critical: Expiring + Low stock
  (100, 50, CURRENT_DATE + INTERVAL '180 days'), -- Good stock
  (15, 40, CURRENT_DATE + INTERVAL '30 days')   -- Expiring soon
) AS stock_data(stock_qty, min_stock, expiry)
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE medication_id = m.id);

-- 3. ADD SAMPLE SALES DATA
INSERT INTO sales (id, customer_name, total_amount, payment_method, status, created_at, pharmacy_id, insurance_provider, insurance_claim_amount)
SELECT 
  gen_random_uuid(),
  customer,
  amount,
  payment,
  'completed',
  CURRENT_DATE - (days || ' days')::interval + (hours || ' hours')::interval,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  insurance,
  CASE WHEN insurance != 'None' THEN amount * 0.8 ELSE 0 END
FROM (VALUES 
  ('John Doe', 2500, 'Insurance', 0, 2, 'RSSB'),
  ('Mary Smith', 1800, 'Cash', 0, 4, 'None'),
  ('Peter Wilson', 3200, 'Insurance', 0, 8, 'MMI'),
  ('Sarah Johnson', 950, 'Mobile Money', 1, 2, 'None'),
  ('David Brown', 4500, 'Insurance', 1, 6, 'RSSB'),
  ('Lisa Davis', 1200, 'Cash', 2, 3, 'None'),
  ('Mike Taylor', 2800, 'Insurance', 2, 5, 'Radiant'),
  ('Anna White', 1600, 'Mobile Money', 3, 1, 'None')
) AS sales_data(customer, amount, payment, days, hours, insurance)
WHERE NOT EXISTS (SELECT 1 FROM sales WHERE customer_name = sales_data.customer);

-- 4. ADD INSURANCE PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS insurance_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  coverage_percentage DECIMAL(5,2) DEFAULT 80.00,
  is_active BOOLEAN DEFAULT true,
  contact_info JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO insurance_providers (name, coverage_percentage, contact_info)
VALUES 
  ('RSSB', 80.00, '{"phone": "+250788123456", "email": "claims@rssb.rw"}'),
  ('MMI', 75.00, '{"phone": "+250788654321", "email": "support@mmi.rw"}'),
  ('Radiant Insurance', 70.00, '{"phone": "+250788987654", "email": "claims@radiant.rw"}'),
  ('Sonarwa', 85.00, '{"phone": "+250788456789", "email": "health@sonarwa.rw"}')
ON CONFLICT (name) DO NOTHING;

-- 5. VERIFY ALL DATA
SELECT 'MEDICATIONS' as table_name, COUNT(*) as count FROM medications
UNION ALL
SELECT 'INVENTORY', COUNT(*) FROM inventory
UNION ALL
SELECT 'SALES', COUNT(*) FROM sales
UNION ALL
SELECT 'INSURANCE_PROVIDERS', COUNT(*) FROM insurance_providers;

-- 6. CHECK ALERTS
SELECT 'LOW_STOCK_ALERTS' as alert_type, COUNT(*) as count
FROM inventory 
WHERE quantity_in_stock <= minimum_stock_level
UNION ALL
SELECT 'EXPIRATION_ALERTS', COUNT(*)
FROM inventory 
WHERE expiry_date <= CURRENT_DATE + INTERVAL '60 days';

-- 7. CHECK INSURANCE CLAIMS
SELECT 'INSURANCE_SALES' as metric, COUNT(*) as count, SUM(insurance_claim_amount) as total_claims
FROM sales 
WHERE insurance_provider != 'None';

SELECT '✅ COMPLETE DATA ADDED' as status;