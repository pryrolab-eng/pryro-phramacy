const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function testWithServiceRole() {
  console.log('=== Check current RLS policies ===');
  const { data: policies, error: policyError } = await supabase
    .rpc('exec_sql', {
      query: `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'insurance_providers' ORDER BY policyname;`
    });

  if (policyError) {
    console.log('Cannot query policies directly, checking user...');
  } else {
    console.log('Policies:', policies);
  }

  console.log('\n=== Check superadmin user ===');
  const { data: users, error: userError } = await supabase
    .from('auth.users')
    .select('id, email')
    .eq('email', 'abdousentore@gmail.com');

  console.log('User query result:', { users, userError });

  console.log('\n=== Test insert with service role (bypasses RLS) ===');
  const { data, error } = await supabase
    .from('insurance_providers')
    .insert({
      name: 'Test Insurance ' + Date.now(),
      coverage_percentage: 80,
      is_active: true
    })
    .select();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Success with service role:', data);
  }
}

testWithServiceRole();
