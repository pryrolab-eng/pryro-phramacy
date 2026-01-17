-- Remove all duplicate/old policies
DROP POLICY IF EXISTS "Pharmacy owners manage insurance" ON insurance_providers;
DROP POLICY IF EXISTS "Superadmin manage all" ON insurance_providers;
DROP POLICY IF EXISTS "Anyone can view insurance providers" ON insurance_providers;
DROP POLICY IF EXISTS "Authenticated users view pharmacy insurance" ON insurance_providers;
DROP POLICY IF EXISTS "Public can view global insurance" ON insurance_providers;
DROP POLICY IF EXISTS "select_authenticated" ON insurance_providers;
DROP POLICY IF EXISTS "select_global" ON insurance_providers;

-- Keep only these 3 policies
-- 1. SELECT for global
-- 2. SELECT for pharmacy users
-- 3. ALL for superadmin and pharmacy owners

-- Verify remaining policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'insurance_providers';
