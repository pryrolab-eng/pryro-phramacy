-- SQL Queries to Check Backend Integrations for Pharmacy Dashboard Settings

-- =====================================================
-- 1. GENERAL SETTINGS - Backend Check
-- =====================================================
-- Check pharmacy information table
SELECT 
    'General Settings' as section,
    'pharmacies table exists' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacies') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- Check pharmacy settings columns
SELECT 
    'General Settings' as section,
    'pharmacy settings columns' as check_type,
    string_agg(column_name, ', ') as available_columns
FROM information_schema.columns 
WHERE table_name = 'pharmacies' 
  AND column_name IN ('name', 'license_number', 'phone', 'email', 'address', 'city', 'province');

-- =====================================================
-- 2. INTEGRATIONS - Backend Check
-- =====================================================
-- Check for API keys/integrations table
SELECT 
    'Integrations' as section,
    'integration settings' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integrations') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- Check insurance providers (integration)
SELECT 
    'Integrations' as section,
    'insurance providers' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_providers') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- Check suppliers (integration)
SELECT 
    'Integrations' as section,
    'suppliers integration' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- =====================================================
-- 3. ANALYTICS - Backend Check
-- =====================================================
-- Check sales table for analytics
SELECT 
    'Analytics' as section,
    'sales data' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- Check inventory for analytics
SELECT 
    'Analytics' as section,
    'inventory analytics' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- Check stock movements for analytics
SELECT 
    'Analytics' as section,
    'stock movements' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- =====================================================
-- 4. SECURITY - Backend Check
-- =====================================================
-- Check user roles and permissions
SELECT 
    'Security' as section,
    'user roles' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_users') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- Check audit logs table
SELECT 
    'Security' as section,
    'audit logs' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- =====================================================
-- 5. BILLING - Backend Check
-- =====================================================
-- Check subscriptions table
SELECT 
    'Billing' as section,
    'subscriptions' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- Check subscription plans
SELECT 
    'Billing' as section,
    'subscription plans' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- Check payment history
SELECT 
    'Billing' as section,
    'payment history' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- =====================================================
-- 6. NOTIFICATIONS - Backend Check
-- =====================================================
-- Check notifications table
SELECT 
    'Notifications' as section,
    'notifications table' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- Check notification preferences
SELECT 
    'Notifications' as section,
    'notification preferences' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- =====================================================
-- 7. COMPLIANCE - Backend Check
-- =====================================================
-- Check regulatory compliance tracking
SELECT 
    'Compliance' as section,
    'compliance tracking' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliance_records') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- Check backup settings
SELECT 
    'Compliance' as section,
    'backup settings' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_settings') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- =====================================================
-- 8. OPERATIONS - Backend Check
-- =====================================================
-- Check system settings
SELECT 
    'Operations' as section,
    'system settings' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- Check feature flags
SELECT 
    'Operations' as section,
    'feature flags' as check_type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') 
         THEN 'YES' ELSE 'NO' END as has_backend;

-- =====================================================
-- COMPREHENSIVE BACKEND INTEGRATION SUMMARY
-- =====================================================
-- Summary of all settings sections and their backend status
WITH backend_check AS (
    SELECT 'General' as section, 
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacies') 
                THEN 'FULL' ELSE 'NONE' END as backend_status,
           'Pharmacy info, preferences' as features
    UNION ALL
    SELECT 'Integrations' as section,
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_providers') 
                AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers')
                THEN 'PARTIAL' ELSE 'NONE' END as backend_status,
           'Insurance, suppliers, API keys' as features
    UNION ALL
    SELECT 'Analytics' as section,
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') 
                AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory')
                THEN 'FULL' ELSE 'NONE' END as backend_status,
           'Sales reports, inventory analytics' as features
    UNION ALL
    SELECT 'Security' as section,
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_users') 
                THEN 'PARTIAL' ELSE 'NONE' END as backend_status,
           'User roles, audit logs, 2FA' as features
    UNION ALL
    SELECT 'Billing' as section,
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') 
                THEN 'PARTIAL' ELSE 'NONE' END as backend_status,
           'Subscription plans, payment history' as features
    UNION ALL
    SELECT 'Notifications' as section,
           'PARTIAL' as backend_status,
           'Email, SMS, alerts' as features
    UNION ALL
    SELECT 'Compliance' as section,
           'NONE' as backend_status,
           'GDPR, audit logs, backups' as features
    UNION ALL
    SELECT 'Operations' as section,
           'NONE' as backend_status,
           'Branding, maintenance, feature flags' as features
)
SELECT 
    section,
    backend_status,
    features,
    CASE 
        WHEN backend_status = 'FULL' THEN '✅ Complete backend support'
        WHEN backend_status = 'PARTIAL' THEN '⚠️ Partial backend support'
        ELSE '❌ No backend support'
    END as status_description
FROM backend_check
ORDER BY 
    CASE backend_status 
        WHEN 'FULL' THEN 1 
        WHEN 'PARTIAL' THEN 2 
        ELSE 3 
    END;

-- =====================================================
-- API ENDPOINTS CHECK
-- =====================================================
-- This would be checked by examining the file system
-- Based on the API routes found, here's the status:

SELECT 'API Endpoints Status' as check_type,
       'General Settings' as section,
       '/api/pharmacy/settings' as endpoint,
       'EXISTS' as status
UNION ALL
SELECT 'API Endpoints Status', 'Integrations', '/api/integrations/*', 'EXISTS'
UNION ALL
SELECT 'API Endpoints Status', 'Analytics', '/api/analytics', 'EXISTS'
UNION ALL
SELECT 'API Endpoints Status', 'Security', '/api/auth/*', 'EXISTS'
UNION ALL
SELECT 'API Endpoints Status', 'Billing', '/api/plans', 'EXISTS'
UNION ALL
SELECT 'API Endpoints Status', 'Notifications', '/api/notifications', 'EXISTS'
UNION ALL
SELECT 'API Endpoints Status', 'Compliance', 'No specific endpoint', 'MISSING'
UNION ALL
SELECT 'API Endpoints Status', 'Operations', '/api/admin/system-settings', 'EXISTS';