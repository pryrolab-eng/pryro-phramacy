-- Detailed Implementation Analysis for Pharmacy Dashboard Settings
-- Run these queries to understand current backend implementation status

-- =====================================================
-- CURRENT DATABASE TABLES ANALYSIS
-- =====================================================

-- 1. List all existing tables
SELECT 
    'Database Tables' as analysis_type,
    table_name,
    CASE 
        WHEN table_name IN ('pharmacies', 'pharmacy_users', 'subscriptions') THEN 'Core Settings'
        WHEN table_name IN ('insurance_providers', 'suppliers') THEN 'Integrations'
        WHEN table_name IN ('sales', 'inventory', 'stock_movements') THEN 'Analytics Data'
        WHEN table_name IN ('notifications') THEN 'Notifications'
        ELSE 'Other'
    END as settings_category
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY settings_category, table_name;

-- =====================================================
-- MISSING TABLES FOR COMPLETE SETTINGS IMPLEMENTATION
-- =====================================================

-- Check what's missing for each settings section
WITH required_tables AS (
    SELECT 'General' as section, 'pharmacies' as table_name, 'Core pharmacy info' as purpose
    UNION ALL SELECT 'General', 'system_preferences', 'Currency, language, regional settings'
    UNION ALL SELECT 'Integrations', 'api_keys', 'Third-party API credentials'
    UNION ALL SELECT 'Integrations', 'webhooks', 'Webhook configurations'
    UNION ALL SELECT 'Integrations', 'integration_logs', 'Integration activity logs'
    UNION ALL SELECT 'Analytics', 'analytics_settings', 'Report preferences and schedules'
    UNION ALL SELECT 'Analytics', 'dashboard_widgets', 'Custom dashboard configurations'
    UNION ALL SELECT 'Security', 'security_settings', '2FA, IP whitelist, session settings'
    UNION ALL SELECT 'Security', 'audit_logs', 'Security and access audit trail'
    UNION ALL SELECT 'Billing', 'subscription_plans', 'Available subscription tiers'
    UNION ALL SELECT 'Billing', 'payment_history', 'Billing and payment records'
    UNION ALL SELECT 'Billing', 'invoices', 'Generated invoices'
    UNION ALL SELECT 'Notifications', 'notification_preferences', 'User notification settings'
    UNION ALL SELECT 'Notifications', 'notification_templates', 'Email/SMS templates'
    UNION ALL SELECT 'Compliance', 'compliance_settings', 'GDPR, data retention policies'
    UNION ALL SELECT 'Compliance', 'backup_schedules', 'Automated backup configurations'
    UNION ALL SELECT 'Operations', 'feature_flags', 'Feature toggles and beta access'
    UNION ALL SELECT 'Operations', 'maintenance_schedules', 'System maintenance windows'
    UNION ALL SELECT 'Operations', 'branding_settings', 'White-label customizations'
),
existing_tables AS (
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
)
SELECT 
    rt.section,
    rt.table_name,
    rt.purpose,
    CASE WHEN et.table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM required_tables rt
LEFT JOIN existing_tables et ON rt.table_name = et.table_name
ORDER BY rt.section, rt.table_name;

-- =====================================================
-- PHARMACY SETTINGS CURRENT IMPLEMENTATION
-- =====================================================

-- Check current pharmacy table structure
SELECT 
    'Pharmacy Table Structure' as analysis,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('name', 'license_number', 'phone', 'email') THEN 'Basic Info'
        WHEN column_name IN ('address', 'city', 'district', 'province') THEN 'Location'
        WHEN column_name IN ('subscription_plan', 'subscription_expires_at') THEN 'Billing'
        WHEN column_name IN ('status') THEN 'Operations'
        ELSE 'System'
    END as settings_category
FROM information_schema.columns 
WHERE table_name = 'pharmacies'
ORDER BY settings_category, column_name;

-- =====================================================
-- INTEGRATION CAPABILITIES ANALYSIS
-- =====================================================

-- Check insurance providers setup (Integration capability)
SELECT 
    'Insurance Integration' as integration_type,
    COUNT(*) as total_providers,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_providers,
    AVG(coverage_percentage) as avg_coverage
FROM insurance_providers
WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Check suppliers setup (Integration capability)
SELECT 
    'Supplier Integration' as integration_type,
    COUNT(*) as total_suppliers,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_suppliers
FROM suppliers
WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- =====================================================
-- ANALYTICS DATA AVAILABILITY
-- =====================================================

-- Check sales data for analytics
SELECT 
    'Sales Analytics Data' as data_type,
    COUNT(*) as total_sales,
    SUM(total_amount) as total_revenue,
    COUNT(DISTINCT DATE(created_at)) as days_with_data,
    MIN(created_at) as earliest_sale,
    MAX(created_at) as latest_sale
FROM sales
WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Check inventory data for analytics
SELECT 
    'Inventory Analytics Data' as data_type,
    COUNT(*) as total_items,
    COUNT(CASE WHEN quantity_in_stock <= minimum_stock_level THEN 1 END) as low_stock_items,
    COUNT(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon
FROM inventory
WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- =====================================================
-- NOTIFICATION SYSTEM STATUS
-- =====================================================

-- Check if notifications table exists and has data
SELECT 
    'Notification System' as system_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
         THEN 'Table Exists' ELSE 'Table Missing' END as table_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
         THEN (SELECT COUNT(*)::text FROM notifications WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
         ELSE '0' END as notification_count;

-- =====================================================
-- SECURITY IMPLEMENTATION STATUS
-- =====================================================

-- Check user roles and permissions
SELECT 
    'Security - User Roles' as security_aspect,
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
FROM pharmacy_users
WHERE pharmacy_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
GROUP BY role;

-- =====================================================
-- BILLING SYSTEM STATUS
-- =====================================================

-- Check subscription status
SELECT 
    'Billing System' as system_type,
    subscription_plan as current_plan,
    status as pharmacy_status,
    subscription_expires_at,
    CASE 
        WHEN subscription_expires_at > CURRENT_TIMESTAMP THEN 'Active'
        WHEN subscription_expires_at <= CURRENT_TIMESTAMP THEN 'Expired'
        ELSE 'No Expiry Set'
    END as subscription_status
FROM pharmacies
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- =====================================================
-- RECOMMENDATIONS FOR IMPLEMENTATION
-- =====================================================

-- Generate implementation recommendations
WITH implementation_status AS (
    SELECT 'General Settings' as section, 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacies') 
                THEN 85 ELSE 0 END as completion_percentage,
           'Add system_preferences table for currency/language settings' as recommendation
    UNION ALL
    SELECT 'Integrations', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_providers') 
                THEN 40 ELSE 0 END,
           'Create api_keys, webhooks, and integration_logs tables'
    UNION ALL
    SELECT 'Analytics', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') 
                THEN 70 ELSE 0 END,
           'Add analytics_settings and dashboard_widgets tables'
    UNION ALL
    SELECT 'Security', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_users') 
                THEN 30 ELSE 0 END,
           'Create security_settings and audit_logs tables'
    UNION ALL
    SELECT 'Billing', 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') 
                THEN 50 ELSE 0 END,
           'Create subscription_plans and payment_history tables'
    UNION ALL
    SELECT 'Notifications', 25, 'Create notification_preferences and templates tables'
    UNION ALL
    SELECT 'Compliance', 10, 'Create compliance_settings and backup_schedules tables'
    UNION ALL
    SELECT 'Operations', 15, 'Create feature_flags, maintenance_schedules, branding_settings tables'
)
SELECT 
    section,
    completion_percentage || '%' as implementation_status,
    CASE 
        WHEN completion_percentage >= 80 THEN '🟢 Nearly Complete'
        WHEN completion_percentage >= 50 THEN '🟡 Partially Implemented'
        WHEN completion_percentage >= 20 THEN '🟠 Basic Implementation'
        ELSE '🔴 Needs Implementation'
    END as priority_level,
    recommendation
FROM implementation_status
ORDER BY completion_percentage DESC;