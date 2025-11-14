-- API ENDPOINT SQL TESTS
-- Test the exact queries used by each API endpoint

-- ==============================================
-- /api/pharmacist/dashboard
-- ==============================================
SELECT '=== PHARMACIST DASHBOARD API TEST ===' as test;

-- Query 1: Prescriptions stats
SELECT 
  'prescriptions_query' as query_name,
  COUNT(*) as total_prescriptions,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_prescriptions,
  COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as prescriptions_today
FROM prescriptions;

-- Query 2: Sales stats  
SELECT 
  'sales_query' as query_name,
  COUNT(*) as total_sales,
  COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as sales_today
FROM sales;

-- Query 3: Processing times
SELECT 
  'processing_times_query' as query_name,
  COUNT(*) as total_records,
  AVG(processing_time_minutes) as avg_processing_time
FROM prescription_processing
WHERE DATE(created_at) = CURRENT_DATE
  AND processing_time_minutes IS NOT NULL;

-- ==============================================
-- /api/pharmacy/dashboard  
-- ==============================================
SELECT '=== PHARMACY DASHBOARD API TEST ===' as test;

-- Query 1: Today's sales
SELECT 
  'todays_sales_query' as query_name,
  COUNT(*) as sales_count,
  COALESCE(SUM(total_amount::numeric), 0) as total_amount
FROM sales 
WHERE created_at >= CURRENT_DATE
  AND pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Query 2: Total products
SELECT 
  'total_products_query' as query_name,
  COUNT(*) as total_products
FROM medications 
WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Query 3: Total customers
SELECT 
  'total_customers_query' as query_name,
  COUNT(DISTINCT customer_name) as unique_customers
FROM sales 
WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ==============================================
-- /api/stock-alerts
-- ==============================================
SELECT '=== STOCK ALERTS API TEST ===' as test;

-- Main inventory query with medications join
SELECT 
  'stock_alerts_main_query' as query_name,
  i.id,
  i.batch_number,
  i.quantity_in_stock,
  i.minimum_stock_level,
  i.expiry_date,
  m.name as medication_name,
  m.category,
  EXTRACT(DAY FROM (i.expiry_date - CURRENT_DATE)) as days_to_expiry,
  CASE 
    WHEN i.quantity_in_stock <= i.minimum_stock_level THEN 'LOW_STOCK'
    WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'EXPIRING'
    ELSE 'OK'
  END as alert_type
FROM inventory i
LEFT JOIN medications m ON i.medication_id = m.id
WHERE i.pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
LIMIT 10;

-- ==============================================
-- /api/pharmacist/prescriptions
-- ==============================================
SELECT '=== PHARMACIST PRESCRIPTIONS API TEST ===' as test;

-- Pending prescriptions query
SELECT 
  'pending_prescriptions_query' as query_name,
  id,
  patient_name,
  doctor_name,
  medications,
  priority,
  created_at,
  insurance_provider
FROM prescriptions
WHERE status = 'pending'
ORDER BY 
  CASE priority 
    WHEN 'high' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'low' THEN 3 
  END,
  created_at
LIMIT 5;

-- ==============================================
-- /api/pharmacist/activities
-- ==============================================
SELECT '=== PHARMACIST ACTIVITIES API TEST ===' as test;

-- Recent sales as activities
SELECT 
  'recent_activities_query' as query_name,
  id,
  customer_name,
  total_amount,
  created_at
FROM sales
ORDER BY created_at DESC
LIMIT 4;

-- ==============================================
-- /api/pharmacy/sales-chart
-- ==============================================
SELECT '=== PHARMACY SALES CHART API TEST ===' as test;

-- Last 6 months sales data
SELECT 
  'sales_chart_query' as query_name,
  EXTRACT(MONTH FROM created_at) as month_num,
  TO_CHAR(created_at, 'Mon') as month_name,
  COUNT(*) as sales_count,
  SUM(total_amount::numeric) as total_revenue
FROM sales
WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
  AND pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Mon')
ORDER BY month_num;

-- ==============================================
-- CONNECTION TEST SUMMARY
-- ==============================================
SELECT '=== CONNECTION TEST SUMMARY ===' as test;

-- Check if all required tables exist and have data
WITH table_stats AS (
  SELECT 'medications' as table_name, COUNT(*) as row_count FROM medications
  UNION ALL
  SELECT 'inventory', COUNT(*) FROM inventory  
  UNION ALL
  SELECT 'sales', COUNT(*) FROM sales
  UNION ALL
  SELECT 'prescriptions', COUNT(*) FROM prescriptions
  UNION ALL
  SELECT 'prescription_processing', COUNT(*) FROM prescription_processing
  UNION ALL
  SELECT 'inventory_checks', COUNT(*) FROM inventory_checks
  UNION ALL
  SELECT 'alert_actions', COUNT(*) FROM alert_actions
)
SELECT 
  table_name,
  row_count,
  CASE 
    WHEN row_count = 0 THEN '❌ EMPTY - Dashboard will show fallback data'
    WHEN row_count < 5 THEN '⚠️ LOW DATA - May need sample data'
    ELSE '✅ HAS DATA - Dashboard should work'
  END as status
FROM table_stats
ORDER BY table_name;