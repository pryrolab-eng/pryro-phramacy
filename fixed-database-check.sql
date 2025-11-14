-- Check table row counts
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