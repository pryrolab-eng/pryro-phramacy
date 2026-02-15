const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function updateToSuperAdmin() {
  console.log('=== Updating user to superadmin role ===\n');
  
  const userId = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
  
  // Update the user's role to superadmin and remove pharmacy_id
  const { data, error } = await supabase
    .from('pharmacy_users')
    .update({ 
      role: 'superadmin',
      pharmacy_id: null
    })
    .eq('user_id', userId)
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('✅ Successfully updated to superadmin role');
  console.log('Updated record:', data);
  
  // Verify the change
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

updateToSuperAdmin();
