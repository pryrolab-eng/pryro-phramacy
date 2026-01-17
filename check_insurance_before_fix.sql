-- ========================================
-- PRE-FIX DIAGNOSTIC CHECKS
-- Run this BEFORE applying fix_insurance_rls.sql
-- ========================================

-- 1. Check if insurance_providers table exists
SELECT 
    'Table Exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'insurance_providers'
    ) THEN '✅ YES' ELSE '❌ NO' END as result;

-- 2. Check current columns in insurance_providers table
SELECT 
    'Current Columns' as check_name,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as result
FROM information_schema.columns 
WHERE table_name = 'insurance_providers';

-- 3. Check if invoice_template column exists
SELECT 
    'invoice_template column' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'insurance_providers' 
        AND column_name = 'invoice_template'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as result;

-- 4. Check if template_config column exists
SELECT 
    'template_config column' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'insurance_providers' 
        AND column_name = 'template_config'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as result;

-- 5. Check current RLS policies
SELECT 
    'Current RLS Policies' as check_name,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'insurance_providers';

-- 6. List all current RLS policies with details
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'insurance_providers'
ORDER BY policyname;

-- 7. Check data statistics
SELECT 
    'Data Statistics' as check_name,
    json_build_object(
        'total_records', COUNT(*),
        'active_records', COUNT(*) FILTER (WHERE is_active = true),
        'inactive_records', COUNT(*) FILTER (WHERE is_active = false),
        'global_providers', COUNT(*) FILTER (WHERE pharmacy_id IS NULL),
        'pharmacy_specific', COUNT(*) FILTER (WHERE pharmacy_id IS NOT NULL)
    ) as result
FROM insurance_providers;

-- 8. Check if RLS is enabled
SELECT 
    'RLS Enabled' as check_name,
    CASE WHEN relrowsecurity THEN '✅ YES' ELSE '❌ NO' END as result
FROM pg_class 
WHERE relname = 'insurance_providers';

-- 9. Sample data (first 5 records)
SELECT 
    id,
    pharmacy_id,
    name,
    coverage_percentage,
    is_active,
    CASE 
        WHEN pharmacy_id IS NULL THEN 'GLOBAL'
        ELSE 'PHARMACY-SPECIFIC'
    END as provider_type,
    created_at
FROM insurance_providers
ORDER BY created_at DESC
LIMIT 5;

-- 10. Check for duplicate names
SELECT 
    'Duplicate Names Check' as check_name,
    COUNT(*) as duplicate_count
FROM (
    SELECT name, pharmacy_id, COUNT(*) as cnt
    FROM insurance_providers
    GROUP BY name, pharmacy_id
    HAVING COUNT(*) > 1
) duplicates;

-- 11. Check pharmacy_users table exists (needed for RLS)
SELECT 
    'pharmacy_users table' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pharmacy_users'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as result;

-- 12. Check auth.users access (needed for superadmin check)
SELECT 
    'auth.users access' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
    ) THEN '✅ CAN ACCESS' ELSE '❌ NO ACCESS' END as result;

-- 13. Check if superadmin user exists
SELECT 
    'Superadmin User' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'abdousentore@gmail.com'
    ) THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END as result;

-- ========================================
-- SUMMARY
-- ========================================
SELECT 
    '=== DIAGNOSTIC SUMMARY ===' as summary,
    json_build_object(
        'table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_providers'),
        'invoice_template_exists', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insurance_providers' AND column_name = 'invoice_template'),
        'template_config_exists', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insurance_providers' AND column_name = 'template_config'),
        'rls_enabled', (SELECT relrowsecurity FROM pg_class WHERE relname = 'insurance_providers'),
        'policy_count', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'insurance_providers'),
        'total_records', (SELECT COUNT(*) FROM insurance_providers),
        'needs_column_fix', NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insurance_providers' AND column_name = 'invoice_template'),
        'needs_policy_fix', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'insurance_providers') < 3
    ) as diagnostic_results;
