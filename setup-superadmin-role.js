const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function addSuperAdminRole() {
  console.log('=== Adding superadmin to enum and updating user ===\n');
  
  // Step 1: Add superadmin to enum
  console.log('Step 1: Adding superadmin to user_role enum...');
  const { error: enumError } = await supabase.rpc('exec_sql', {
    sql: "ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';"
  });
  
  if (enumError) {
    console.log('Note: Enum might already exist or need manual update');
    console.log('Error:', enumError.message);
  } else {
    console.log('✅ Enum updated');
  }
  
  // Step 2: Update the user
  console.log('\nStep 2: Updating user to superadmin role...');
  const userId = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
  
  const { data, error } = await supabase
    .from('pharmacy_users')
    .update({ 
      role: 'superadmin',
      pharmacy_id: null
    })
    .eq('user_id', userId)
    .select();
  
  if (error) {
    console.error('❌ Error updating user:', error.message);
    console.log('\n⚠️  You need to run this SQL manually in Supabase:');
    console.log("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';");
    console.log(`UPDATE pharmacy_users SET role = 'superadmin', pharmacy_id = NULL WHERE user_id = '${userId}';`);
    return;
  }
  
  console.log('✅ Successfully updated to superadmin role');
  console.log('Updated record:', data);
  
  // Verify
  const { data: verified } = await supabase
    .from('pharmacy_users')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  console.log('\n=== Verification ===');
  console.log('User ID:', verified.user_id);
  console.log('Role:', verified.role);
  console.log('Pharmacy ID:', verified.pharmacy_id);
  console.log('Is Active:', verified.is_active);
}

addSuperAdminRole();
