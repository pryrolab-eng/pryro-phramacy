-- DASHBOARD DATABASE CONNECTION TESTS
-- Run these queries to verify each dashboard's data connections

-- ==============================================
-- 1. PHARMACIST DASHBOARD TESTS
-- ==============================================

-- Test 1: Pharmacist Dashboard Stats (/api/pharmacist/dashboard)
SELECT 'PHARMACIST_DASHBOARD_STATS' as test_name;

-- Check prescriptions table
SELECT 
  'prescriptions' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_count
FROM prescriptions;

-- Check sales table for pharmacist stats
SELECT 
  'sales' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_sales
FROM sales;

-- Test 2: Prescription Processing Times
SELECT 
  'prescription_processing' as table_name,
  COUNT(*) as total_rows,
  AVG(processing_time_minutes) as avg_processing_time
FROM prescription_processing
WHERE DATE(created_at) = CURRENT_DATE;

-- Test 3: Inventory Checks
SELECT 
  'inventory_checks' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_checks
FROM inventory_checks;

-- ==============================================
-- 2. PHARMACY DASHBOARD TESTS  
-- ==============================================

-- Test 4: Pharmacy Dashboard Stats (/api/pharmacy/dashboard)
SELECT 'PHARMACY_DASHBOARD_STATS' as test_name;

-- Today's sales total
SELECT 
  'todays_sales' as metric,
  COALESCE(SUM(total_amount), 0) as value
FROM sales 
WHERE DATE(created_at) = CURRENT_DATE 
  AND pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Total products count
SELECT 
  'total_products' as metric,
  COUNT(*) as value
FROM medications 
WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Total customers count
SELECT 
  'total_customers' as metric,
  COUNT(DISTINCT customer_name) as value
FROM sales 
WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ==============================================
-- 3. STOCK ALERTS TESTS
-- ==============================================

-- Test 5: Stock Alerts (/api/stock-alerts)
SELECT 'STOCK_ALERTS_TEST' as test_name;

-- Low stock items
SELECT 
  'low_stock_items' as alert_type,
  COUNT(*) as count
FROM inventory i
JOIN medications m ON i.medication_id = m.id
WHERE i.quantity_in_stock <= i.minimum_stock_level
  AND i.pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Expiring items (within 60 days)
SELECT 
  'expiring_items' as alert_type,
  COUNT(*) as count
FROM inventory i
JOIN medications m ON i.medication_id = m.id
WHERE i.expiry_date <= CURRENT_DATE + INTERVAL '60 days'
  AND i.expiry_date > CURRENT_DATE
  AND i.pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ==============================================
-- 4. SALES CHART DATA TESTS
-- ==============================================

-- Test 6: Sales Chart Data (/api/pharmacy/sales-chart)
SELECT 'SALES_CHART_TEST' as test_name;

-- Monthly sales data (last 6 months)
SELECT 
  EXTRACT(MONTH FROM created_at) as month,
  TO_CHAR(created_at, 'Mon') as month_name,
  COUNT(*) as sales_count,
  SUM(total_amount) as total_revenue
FROM sales 
WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
  AND pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Mon')
ORDER BY month;

-- ==============================================
-- 5. PHARMACIST ACTIVITIES TESTS
-- ==============================================

-- Test 7: Recent Activities (/api/pharmacist/activities)
SELECT 'PHARMACIST_ACTIVITIES_TEST' as test_name;

-- Recent sales as activities
SELECT 
  id,
  customer_name,
  total_amount,
  created_at,
  'sale' as activity_type
FROM sales 
ORDER BY created_at DESC 
LIMIT 5;

-- ==============================================
-- 6. TABLE EXISTENCE CHECK
-- ==============================================

-- Test 8: Verify all required tables exist
SELECT 'TABLE_EXISTENCE_CHECK' as test_name;

SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'medications', 'inventory', 'sales', 'sale_items', 
    'prescriptions', 'prescription_processing', 
    'inventory_checks', 'alert_actions', 'pharmacies'
  )
ORDER BY table_name;

-- ==============================================
-- 7. SAMPLE DATA CHECK
-- ==============================================

-- Test 9: Check if tables have sample data
SELECT 'SAMPLE_DATA_CHECK' as test_name;

SELECT 
  'medications' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN 'HAS_DATA' ELSE 'EMPTY' END as status
FROM medications
UNION ALL
SELECT 
  'inventory' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN 'HAS_DATA' ELSE 'EMPTY' END as status
FROM inventory
UNION ALL
SELECT 
  'sales' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN 'HAS_DATA' ELSE 'EMPTY' END as status
FROM sales;