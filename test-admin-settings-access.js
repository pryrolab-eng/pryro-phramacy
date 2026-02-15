const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function testAdminAccess() {
  console.log('=== Testing Admin Settings Access ===\n');
  
  const superAdminEmail = 'abdousentore@gmail.com';
  const userId = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
  
  // Check current role
  console.log('Step 1: Checking current user role...');
  const { data: currentUser, error: userError } = await supabase
    .from('pharmacy_users')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (userError) {
    console.error('❌ Error fetching user:', userError.message);
    return;
  }
  
  console.log('Current User Data:');
  console.log('  Email:', superAdminEmail);
  console.log('  User ID:', currentUser.user_id);
  console.log('  Current Role:', currentUser.role);
  console.log('  Pharmacy ID:', currentUser.pharmacy_id);
  console.log('  Is Active:', currentUser.is_active);
  
  // Check if role is superadmin
  if (currentUser.role === 'superadmin') {
    console.log('\n✅ User already has superadmin role - Access should work!');
  } else {
    console.log('\n❌ ISSUE FOUND: User role is "' + currentUser.role + '" but needs to be "superadmin"');
    console.log('\nStep 2: Updating user to superadmin role...');
    
    const { data: updated, error: updateError } = await supabase
      .from('pharmacy_users')
      .update({ 
        role: 'superadmin',
        pharmacy_id: null
      })
      .eq('user_id', userId)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError.message);
      console.log('\n⚠️  Manual SQL needed:');
      console.log(`UPDATE pharmacy_users SET role = 'superadmin', pharmacy_id = NULL WHERE user_id = '${userId}';`);
      return;
    }
    
    console.log('✅ Successfully updated to superadmin role');
    console.log('Updated record:', updated[0]);
  }
  
  // Verify access
  console.log('\n=== Verification ===');
  const { data: verified } = await supabase
    .from('pharmacy_users')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  console.log('Final User Data:');
  console.log('  Role:', verified.role);
  console.log('  Pharmacy ID:', verified.pharmacy_id);
  console.log('  Can Access Admin Settings:', verified.role === 'superadmin' ? '✅ YES' : '❌ NO');
  
  console.log('\n=== Summary ===');
  console.log('Hardcoded Email:', superAdminEmail);
  console.log('User ID:', userId);
  console.log('Access Status:', verified.role === 'superadmin' ? '✅ GRANTED' : '❌ DENIED');
}

testAdminAccess();
