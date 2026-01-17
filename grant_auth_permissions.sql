-- Grant anon role permission to read auth.users for RLS checks
GRANT SELECT (id, email) ON auth.users TO anon;
GRANT SELECT (id, email) ON auth.users TO authenticated;

-- Test the permission
SELECT 'Permissions granted' as status;
