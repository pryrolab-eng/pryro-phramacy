-- SIMPLE DATA CHECK (no EXTRACT function)

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
WHERE expiry_date <= CURRENT_DATE + INTERVAL '60 days';

-- 3. Check sales by payment method
SELECT 
  payment_method,
  COUNT(*) as count
FROM sales 
GROUP BY payment_method;

-- 4. Sample inventory status
SELECT 
  batch_number,
  quantity_in_stock,
  minimum_stock_level,
  expiry_date,
  CASE 
    WHEN quantity_in_stock <= minimum_stock_level THEN 'LOW_STOCK'
    WHEN expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'EXPIRING'
    ELSE 'OK'
  END as status
FROM inventory
LIMIT 5;