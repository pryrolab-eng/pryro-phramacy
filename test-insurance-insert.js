const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc'
);

async function testInsurance() {
  console.log('=== Login as Superadmin ===');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'abdousentore@gmail.com',
    password: 'Admin@123'
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }

  console.log('✅ Logged in as:', authData.user.email);
  console.log('User ID:', authData.user.id);

  console.log('\n=== Attempting to add insurance provider ===');
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
    console.log('✅ Success:', data);
  }
}

testInsurance();
