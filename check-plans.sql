-- Check if subscription_plans table exists and has data
SELECT * FROM subscription_plans;

-- Check plan names
SELECT id, name, price, period, is_active FROM subscription_plans;

-- Check if there's a plan named 'Premium', 'Standard', or 'Basic'
SELECT * FROM subscription_plans WHERE name IN ('Premium', 'Standard', 'Basic');
