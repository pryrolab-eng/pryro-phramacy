const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc'
);

async function test() {
  // Login with the current user credentials
  console.log('Enter email and password:');
  const email = 'pharmacy@test.com'; // Change this
  const password = 'Test@123'; // Change this
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }

  console.log('✅ Logged in as:', authData.user.email);
  console.log('Access token:', authData.session.access_token.substring(0, 50) + '...');

  // Test insert directly via Supabase client
  console.log('\n=== Testing direct insert ===');
  const { data, error } = await supabase
    .from('insurance_providers')
    .insert({
      name: 'Direct Test ' + Date.now(),
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

test();
