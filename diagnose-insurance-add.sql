-- Check insurance_providers table structure and RLS policies
SELECT 'Table Structure' as check_type;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'insurance_providers'
ORDER BY ordinal_position;

SELECT 'RLS Policies' as check_type;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'insurance_providers';

SELECT 'RLS Enabled' as check_type;
SELECT relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'insurance_providers';

-- Test insert as superadmin
SELECT 'Test Insert' as check_type;
