-- CHECK EXISTING DATA FOR DASHBOARD FEATURES

-- 1. Check stock alerts
SELECT 
  'LOW_STOCK_ALERTS' as alert_type,
  COUNT(*) as count
FROM inventory 
WHERE quantity_in_stock <= minimum_stock_level;

-- 2. Check expiration alerts  
SELECT 
  'EXPIRING_ALERTS' as alert_type,
  COUNT(*) as count
FROM inventory 
WHERE expiry_date <= CURRENT_DATE + INTERVAL '60 days'
  AND expiry_date > CURRENT_DATE;

-- 3. Check sales with insurance
SELECT 
  payment_method,
  COUNT(*) as count,
  SUM(total_amount) as total
FROM sales 
GROUP BY payment_method;

-- 4. Check today's activity
SELECT 
  'TODAYS_SALES' as metric,
  COUNT(*) as count,
  SUM(total_amount) as total
FROM sales 
WHERE DATE(created_at) = CURRENT_DATE;

-- 5. Sample inventory with alerts
SELECT 
  i.batch_number,
  i.quantity_in_stock,
  i.minimum_stock_level,
  i.expiry_date,
  EXTRACT(DAY FROM (i.expiry_date - CURRENT_DATE)) as days_to_expiry,
  CASE 
    WHEN i.quantity_in_stock <= i.minimum_stock_level THEN '⚠️ LOW STOCK'
    WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN '⏰ EXPIRING'
    ELSE '✅ OK'
  END as alert_status
FROM inventory i
LIMIT 5;