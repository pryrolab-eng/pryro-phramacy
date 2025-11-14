-- FINAL COMPLETE SYSTEM CHECK
-- This will verify ALL dashboard connections and data

-- ==============================================
-- 1. TABLE EXISTENCE CHECK
-- ==============================================
SELECT '=== TABLE EXISTENCE CHECK ===' as check_type;

SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'medications', 'inventory', 'sales', 'sale_items', 
    'prescriptions', 'prescription_processing', 
    'inventory_checks', 'alert_actions', 'pharmacies'
  )
ORDER BY table_name;

-- ==============================================
-- 2. DATA AVAILABILITY CHECK
-- ==============================================
SELECT '=== DATA AVAILABILITY CHECK ===' as check_type;

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
SELECT 'alert_actions', COUNT(*) FROM alert_actions;

-- ==============================================
-- 3. PHARMACIST DASHBOARD API TESTS
-- ==============================================
SELECT '=== PHARMACIST DASHBOARD API TESTS ===' as check_type;

-- /api/pharmacist/dashboard data
SELECT 
  'pharmacist_stats' as api_endpoint,
  COUNT(*) as total_prescriptions,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_prescriptions,
  COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_prescriptions
FROM prescriptions;

-- /api/pharmacist/prescriptions data
SELECT 
  'pharmacist_prescriptions' as api_endpoint,
  COUNT(*) as pending_count
FROM prescriptions
WHERE status = 'pending';

-- /api/pharmacist/activities data
SELECT 
  'pharmacist_activities' as api_endpoint,
  COUNT(*) as recent_sales
FROM sales
ORDER BY created_at DESC
LIMIT 4;

-- ==============================================
-- 4. PHARMACY DASHBOARD API TESTS
-- ==============================================
SELECT '=== PHARMACY DASHBOARD API TESTS ===' as check_type;

-- /api/pharmacy/dashboard data
SELECT 
  'pharmacy_stats' as api_endpoint,
  COUNT(*) as total_medications,
  COALESCE(SUM(CASE WHEN DATE(s.created_at) = CURRENT_DATE THEN s.total_amount ELSE 0 END), 0) as today_sales
FROM medications m
LEFT JOIN sales s ON s.pharmacy_id = m.pharmacy_id
WHERE m.pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- /api/stock-alerts data
SELECT 
  'stock_alerts' as api_endpoint,
  COUNT(*) as total_inventory_items,
  COUNT(CASE WHEN i.quantity_in_stock <= i.minimum_stock_level THEN 1 END) as low_stock_items,
  COUNT(CASE WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 1 END) as expiring_items
FROM inventory i
WHERE i.pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ==============================================
-- 5. API ENDPOINT SIMULATION
-- ==============================================
SELECT '=== API ENDPOINT SIMULATION ===' as check_type;

-- Simulate exact queries from each API endpoint
-- Pharmacist Dashboard Stats
SELECT 
  'API: /api/pharmacist/dashboard' as endpoint,
  jsonb_build_object(
    'prescriptionsToday', COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END),
    'pendingPrescriptions', COUNT(CASE WHEN status = 'pending' THEN 1 END),
    'completedSales', (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = CURRENT_DATE),
    'averageWaitTime', COALESCE((SELECT AVG(processing_time_minutes) FROM prescription_processing WHERE DATE(created_at) = CURRENT_DATE), 8)
  ) as response_data
FROM prescriptions;

-- Pharmacy Dashboard Stats  
SELECT 
  'API: /api/pharmacy/dashboard' as endpoint,
  jsonb_build_object(
    'totalProducts', (SELECT COUNT(*) FROM medications WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'todaySales', COALESCE((SELECT SUM(total_amount) FROM sales WHERE DATE(created_at) = CURRENT_DATE AND pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 0),
    'totalCustomers', (SELECT COUNT(DISTINCT customer_name) FROM sales WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  ) as response_data;

-- Stock Alerts
SELECT 
  'API: /api/stock-alerts' as endpoint,
  jsonb_build_object(
    'lowStock', COUNT(CASE WHEN i.quantity_in_stock <= i.minimum_stock_level THEN 1 END),
    'expiring', COUNT(CASE WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '60 days' AND i.expiry_date > CURRENT_DATE THEN 1 END),
    'total', COUNT(*)
  ) as response_data
FROM inventory i
WHERE i.pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ==============================================
-- 6. SAMPLE DATA PREVIEW
-- ==============================================
SELECT '=== SAMPLE DATA PREVIEW ===' as check_type;

-- Sample prescriptions
SELECT 'PRESCRIPTIONS SAMPLE' as data_type, patient_name, status, priority, created_at
FROM prescriptions LIMIT 3;

-- Sample inventory with alerts
SELECT 
  'INVENTORY SAMPLE' as data_type,
  i.batch_number,
  i.quantity_in_stock,
  i.minimum_stock_level,
  m.name as medication_name,
  CASE 
    WHEN i.quantity_in_stock <= i.minimum_stock_level THEN '⚠️ LOW STOCK'
    WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN '⏰ EXPIRING'
    ELSE '✅ OK'
  END as status
FROM inventory i
LEFT JOIN medications m ON i.medication_id = m.id
WHERE i.pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
LIMIT 3;

-- Sample sales
SELECT 'SALES SAMPLE' as data_type, customer_name, total_amount, payment_method, created_at
FROM sales 
WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ORDER BY created_at DESC LIMIT 3;

-- ==============================================
-- 7. FINAL STATUS SUMMARY
-- ==============================================
SELECT '=== FINAL STATUS SUMMARY ===' as check_type;

WITH system_status AS (
  SELECT 
    'Prescriptions Table' as component,
    CASE WHEN EXISTS(SELECT 1 FROM prescriptions) THEN '✅ READY' ELSE '❌ NO DATA' END as status
  UNION ALL
  SELECT 
    'Inventory System',
    CASE WHEN EXISTS(SELECT 1 FROM inventory) THEN '✅ READY' ELSE '❌ NO DATA' END
  UNION ALL
  SELECT 
    'Sales System',
    CASE WHEN EXISTS(SELECT 1 FROM sales) THEN '✅ READY' ELSE '❌ NO DATA' END
  UNION ALL
  SELECT 
    'Medications Catalog',
    CASE WHEN EXISTS(SELECT 1 FROM medications) THEN '✅ READY' ELSE '❌ NO DATA' END
  UNION ALL
  SELECT 
    'Processing Tracking',
    CASE WHEN EXISTS(SELECT 1 FROM prescription_processing) THEN '✅ READY' ELSE '❌ NO DATA' END
)
SELECT component, status FROM system_status;

SELECT 
  '🎉 SYSTEM CHECK COMPLETE' as result,
  'Both dashboards should now connect to database properly!' as message;