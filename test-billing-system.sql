-- Test 1: Check if billing tables exist
SELECT 'Checking billing tables...' as test;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'payments', 'payment_methods');

-- Test 2: Check sample data
SELECT 'Checking payment methods...' as test;
SELECT id, pharmacy_id, method_type, is_default 
FROM payment_methods 
LIMIT 5;

SELECT 'Checking invoices...' as test;
SELECT id, pharmacy_id, invoice_number, amount, status, plan_name 
FROM invoices 
LIMIT 5;

-- Test 3: Verify RLS policies
SELECT 'Checking RLS policies...' as test;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('invoices', 'payments', 'payment_methods');
