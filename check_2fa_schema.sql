-- Check if 2FA columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('two_factor_secret', 'two_factor_enabled', 'two_factor_backup_codes');

-- Check if 2FA sessions table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'two_factor_sessions';
