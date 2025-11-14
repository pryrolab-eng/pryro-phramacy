-- Check all tables in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if staff table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'staff' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if pharmacy_users table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'pharmacy_users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if users table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing data in pharmacy_users
SELECT * FROM pharmacy_users LIMIT 5;

-- Check existing data in pharmacies
SELECT id, name, owner_id FROM pharmacies LIMIT 5;