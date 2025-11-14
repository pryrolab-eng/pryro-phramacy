-- FIX DASHBOARD DATABASE CONNECTIONS
-- Run this to ensure all tables exist and have sample data

-- Check table existence
SELECT 
  'TABLE_CHECK' as step,
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('medications', 'inventory', 'sales', 'prescriptions')
ORDER BY table_name;

-- Insert sample medications if empty
INSERT INTO medications (id, name, category, requires_prescription, is_active, pharmacy_id)
SELECT 
  gen_random_uuid(),
  name,
  category,
  requires_prescription,
  true,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
FROM (VALUES 
  ('Paracetamol 500mg', 'Pain Relief', false),
  ('Amoxicillin 250mg', 'Antibiotics', true),
  ('Vitamin C Tablets', 'Vitamins', false),
  ('Ibuprofen 400mg', 'Pain Relief', false),
  ('Omeprazole 20mg', 'Gastric', true)
) AS sample_meds(name, category, requires_prescription)
WHERE NOT EXISTS (SELECT 1 FROM medications LIMIT 1);

-- Insert sample inventory if empty
INSERT INTO inventory (id, medication_id, batch_number, quantity_in_stock, minimum_stock_level, expiry_date, pharmacy_id)
SELECT 
  gen_random_uuid(),
  m.id,
  'BATCH' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  CASE 
    WHEN ROW_NUMBER() OVER() % 3 = 0 THEN 5  -- Low stock
    ELSE 50 + (ROW_NUMBER() OVER() * 10)
  END,
  20,
  CURRENT_DATE + INTERVAL '30 days' + (ROW_NUMBER() OVER() * INTERVAL '10 days'),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
FROM medications m
WHERE NOT EXISTS (SELECT 1 FROM inventory LIMIT 1);

-- Insert sample sales if empty
INSERT INTO sales (id, customer_name, total_amount, payment_method, status, created_at, pharmacy_id)
SELECT 
  gen_random_uuid(),
  'Customer ' || generate_series,
  (50 + (generate_series * 25))::numeric,
  CASE generate_series % 3 
    WHEN 0 THEN 'Cash'
    WHEN 1 THEN 'Insurance' 
    ELSE 'Mobile Money'
  END,
  'completed',
  CURRENT_DATE - (generate_series || ' hours')::interval,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
FROM generate_series(1, 10)
WHERE NOT EXISTS (SELECT 1 FROM sales LIMIT 1);

-- Insert sample prescriptions if empty
INSERT INTO prescriptions (id, patient_name, doctor_name, medications, priority, status, insurance_provider, created_at)
SELECT 
  gen_random_uuid(),
  'Patient ' || generate_series,
  'Dr. Smith',
  ARRAY['Paracetamol 500mg', 'Vitamin C'],
  CASE generate_series % 3 
    WHEN 0 THEN 'high'
    WHEN 1 THEN 'medium'
    ELSE 'low'
  END,
  CASE generate_series % 2 WHEN 0 THEN 'pending' ELSE 'completed' END,
  'RSSB',
  CURRENT_DATE - (generate_series || ' hours')::interval
FROM generate_series(1, 8)
WHERE NOT EXISTS (SELECT 1 FROM prescriptions LIMIT 1);

-- Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS prescription_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id),
  processing_time_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID,
  check_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50),
  reference_id UUID,
  action VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verify the fix worked
SELECT 
  'VERIFICATION' as step,
  table_name,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND information_schema.tables.table_name = t.table_name) as exists,
  CASE t.table_name
    WHEN 'medications' THEN (SELECT COUNT(*) FROM medications)
    WHEN 'inventory' THEN (SELECT COUNT(*) FROM inventory)
    WHEN 'sales' THEN (SELECT COUNT(*) FROM sales)
    WHEN 'prescriptions' THEN (SELECT COUNT(*) FROM prescriptions)
    ELSE 0
  END as row_count
FROM (VALUES ('medications'), ('inventory'), ('sales'), ('prescriptions')) AS t(table_name);

SELECT '✅ Dashboard database connections should now work!' as result;