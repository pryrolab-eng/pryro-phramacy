-- ADMIN PAGE DATABASE CONNECTION CHECK

-- 1. Check if admin-related tables exist
SELECT 'TABLE_CHECK' as test_type;

SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'pharmacies', 'subscription_plans', 'subscriptions', 
    'categories', 'insurance_templates', 'audit_logs'
  )
ORDER BY table_name;

-- 2. Check pharmacies data (for "Total Shops" card)
SELECT 'PHARMACIES_DATA' as test_type;
SELECT 
  COUNT(*) as total_pharmacies,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month,
  COUNT(CASE WHEN subscription_expires_at < CURRENT_DATE THEN 1 END) as expired_businesses
FROM pharmacies;

-- 3. Check subscription plans (for "Total Plans" card)
SELECT 'SUBSCRIPTION_PLANS' as test_type;
SELECT 
  COUNT(*) as total_plans,
  STRING_AGG(name, ', ') as plan_names
FROM subscription_plans
WHERE is_active = true;

-- 4. Check categories (for "Total Categories" card)
SELECT 'CATEGORIES_DATA' as test_type;
SELECT COUNT(*) as total_categories
FROM categories
WHERE is_active = true;

-- 5. Check subscription revenue (for "Plan Subscriptions" card)
SELECT 'SUBSCRIPTION_REVENUE' as test_type;
SELECT 
  COUNT(*) as active_subscriptions,
  SUM(sp.price) as monthly_revenue
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status = 'active' AND s.expires_at > CURRENT_DATE;

-- 6. Check recent pharmacy registrations
SELECT 'RECENT_REGISTRATIONS' as test_type;
SELECT 
  name as pharmacy_name,
  email,
  created_at,
  subscription_plan
FROM pharmacies
ORDER BY created_at DESC
LIMIT 5;

-- 7. Admin API endpoints data check
SELECT 'API_ENDPOINTS_CHECK' as test_type;

-- Check if we have data for each admin API endpoint
SELECT 
  '/api/admin/pharmacies' as endpoint,
  COUNT(*) as data_count
FROM pharmacies
UNION ALL
SELECT 
  '/api/admin/plans',
  COUNT(*)
FROM subscription_plans
UNION ALL
SELECT 
  '/api/admin/stores',
  COUNT(*)
FROM pharmacies;