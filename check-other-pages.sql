-- CHECK OTHER IMPORTANT PAGES AND FEATURES

-- 1. POS System - Check if products are available
SELECT 'POS_PRODUCTS' as feature, COUNT(*) as available_products
FROM medications m
JOIN inventory i ON m.id = i.medication_id
WHERE m.is_active = true AND i.quantity_in_stock > 0;

-- 2. Customer Management - Check customers table
SELECT 'CUSTOMERS' as feature, 
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') 
    THEN 'TABLE_EXISTS' 
    ELSE 'TABLE_MISSING' 
  END as status;

-- 3. Staff Management - Check staff/users
SELECT 'STAFF' as feature,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN 'TABLE_EXISTS' 
    ELSE 'TABLE_MISSING' 
  END as status;

-- 4. Reports - Check if we have data for reports
SELECT 'REPORTS_DATA' as feature, 
  COUNT(DISTINCT DATE(created_at)) as days_with_sales
FROM sales;

-- 5. Settings - Check pharmacy settings
SELECT 'PHARMACY_SETTINGS' as feature,
  COUNT(*) as pharmacy_count
FROM pharmacies;