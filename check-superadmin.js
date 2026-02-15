const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function checkSuperAdmin() {
  console.log('=== Checking for Super Admin ===\n');
  
  // Check auth.users table
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const superAdmin = authUsers.users.find(u => u.email === 'abdousentore@gmail.com');
  
  console.log('Auth User:', superAdmin ? {
    id: superAdmin.id,
    email: superAdmin.email,
    created_at: superAdmin.created_at
  } : 'NOT FOUND');
  
  if (superAdmin) {
    // Check pharmacy_users table
    const { data: pharmacyUser } = await supabase
      .from('pharmacy_users')
      .select('*')
      .eq('user_id', superAdmin.id)
      .single();
    
    console.log('\nPharmacy User Record:', pharmacyUser || 'NOT FOUND');
  }
  
  console.log('\n=== All Auth Users ===');
  authUsers.users.forEach(u => {
    console.log(`- ${u.email} (${u.id})`);
  });
}

checkSuperAdmin();
