-- Check what tables exist and their row counts
SELECT 
  schemaname,
  tablename,
  n_tup_ins as total_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check medications table
SELECT 'MEDICATIONS' as table_name, count(*) as row_count FROM medications
UNION ALL
SELECT 'INVENTORY' as table_name, count(*) as row_count FROM inventory
UNION ALL  
SELECT 'SALES' as table_name, count(*) as row_count FROM sales
UNION ALL
SELECT 'SALE_ITEMS' as table_name, count(*) as row_count FROM sale_items
UNION ALL
SELECT 'PHARMACIES' as table_name, count(*) as row_count FROM pharmacies;

-- Sample medications data
SELECT 
  id, name, category, requires_prescription, is_active
FROM medications 
LIMIT 5;

-- Sample inventory with medication details
SELECT 
  i.id,
  i.batch_number,
  i.quantity_in_stock,
  i.minimum_stock_level,
  i.expiry_date,
  m.name as medication_name,
  m.category
FROM inventory i
LEFT JOIN medications m ON i.medication_id = m.id
LIMIT 5;

-- Recent sales data
SELECT 
  id,
  customer_name,
  total_amount,
  payment_method,
  status,
  created_at
FROM sales 
ORDER BY created_at DESC
LIMIT 5;

-- Low stock items
SELECT 
  i.batch_number,
  i.quantity_in_stock,
  i.minimum_stock_level,
  m.name as medication_name,
  m.category
FROM inventory i
LEFT JOIN medications m ON i.medication_id = m.id
WHERE i.quantity_in_stock <= i.minimum_stock_level
LIMIT 10;

-- Expiring items (within 60 days)
SELECT 
  i.batch_number,
  i.quantity_in_stock,
  i.expiry_date,
  EXTRACT(DAY FROM (i.expiry_date - CURRENT_DATE)) as days_to_expiry,
  m.name as medication_name,
  m.category
FROM inventory i
LEFT JOIN medications m ON i.medication_id = m.id
WHERE i.expiry_date <= CURRENT_DATE + INTERVAL '60 days'
  AND i.expiry_date > CURRENT_DATE
ORDER BY i.expiry_date
LIMIT 10;