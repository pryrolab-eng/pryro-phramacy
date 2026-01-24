-- Test 1: Verify tables exist
SELECT 'TEST 1: Tables exist' as test_name;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'payments', 'payment_methods');

-- Test 2: Check payment methods created
SELECT 'TEST 2: Payment methods' as test_name;
SELECT COUNT(*) as total_payment_methods FROM payment_methods;
SELECT pharmacy_id, method_type, is_default FROM payment_methods LIMIT 5;

-- Test 3: Check invoices created
SELECT 'TEST 3: Invoices' as test_name;
SELECT COUNT(*) as total_invoices FROM invoices;
SELECT pharmacy_id, invoice_number, amount, status, plan_name, due_date 
FROM invoices 
ORDER BY created_at DESC 
LIMIT 10;

-- Test 4: Check pharmacies have expiration dates
SELECT 'TEST 4: Pharmacy expiration dates' as test_name;
SELECT name, subscription_plan, subscription_expires_at 
FROM pharmacies 
WHERE subscription_expires_at IS NOT NULL
LIMIT 5;

-- Test 5: Check RLS policies
SELECT 'TEST 5: RLS Policies' as test_name;
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('invoices', 'payments', 'payment_methods');

-- Test 6: Sample billing data for one pharmacy
SELECT 'TEST 6: Sample pharmacy billing' as test_name;
SELECT 
    p.name,
    p.subscription_plan,
    p.subscription_expires_at,
    pm.method_type,
    COUNT(i.id) as invoice_count
FROM pharmacies p
LEFT JOIN payment_methods pm ON p.id = pm.pharmacy_id
LEFT JOIN invoices i ON p.id = i.pharmacy_id
GROUP BY p.id, p.name, p.subscription_plan, p.subscription_expires_at, pm.method_type
LIMIT 3;
