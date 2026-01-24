-- Check if api_keys table exists and show its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'api_keys'
ORDER BY 
    ordinal_position;

-- Also check if table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'api_keys'
) as table_exists;
