-- Check actual columns in medications table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'medications' 
ORDER BY ordinal_position;