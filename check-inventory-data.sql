-- CHECK IF INVENTORY DATA IS SAVED TO DATABASE

-- 1. Check recent inventory additions
SELECT 
  'RECENT_INVENTORY' as check_type,
  i.id,
  i.batch_number,
  i.quantity_in_stock,
  i.minimum_stock_level,
  i.expiry_date,
  m.name as medication_name,
  i.created_at
FROM inventory i
LEFT JOIN medications m ON i.medication_id = m.id
ORDER BY i.created_at DESC
LIMIT 5;

-- 2. Check if any inventory was added today
SELECT 
  'TODAYS_ADDITIONS' as check_type,
  COUNT(*) as count
FROM inventory 
WHERE DATE(created_at) = CURRENT_DATE;

-- 3. Check total inventory count
SELECT 
  'TOTAL_INVENTORY' as check_type,
  COUNT(*) as total_count
FROM inventory;