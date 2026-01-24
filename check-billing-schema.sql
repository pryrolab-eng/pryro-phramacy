-- Check if billing tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'payments', 'payment_methods', 'subscriptions');

-- Check pharmacies table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pharmacies' 
AND column_name IN ('subscription_plan', 'subscription_expires_at', 'status');

-- Check existing subscriptions data
SELECT id, pharmacy_id, plan, start_date, end_date, is_active, amount 
FROM subscriptions 
LIMIT 5;

-- Check pharmacies subscription info
SELECT id, name, subscription_plan, status, subscription_expires_at 
FROM pharmacies 
LIMIT 5;
