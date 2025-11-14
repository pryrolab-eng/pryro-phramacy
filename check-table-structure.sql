-- CHECK TABLE STRUCTURES FIRST

-- 1. Check medications table structure
SELECT 
  column_name, 
  data_type, 
  udt_name,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'medications' 
ORDER BY ordinal_position;

-- 2. Check inventory table structure  
SELECT 
  column_name, 
  data_type, 
  udt_name,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'inventory' 
ORDER BY ordinal_position;

-- 3. Check sales table structure
SELECT 
  column_name, 
  data_type, 
  udt_name,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position;

-- 4. Check if medication_category enum exists
SELECT 
  enumlabel as category_values
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'medication_category');

-- 5. Check current data counts
SELECT 'medications' as table_name, COUNT(*) as count FROM medications
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'sales', COUNT(*) FROM sales;