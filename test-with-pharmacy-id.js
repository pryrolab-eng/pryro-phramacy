const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function test() {
  console.log('=== Check all users ===');
  const { data: users } = await supabase
    .from('pharmacy_users')
    .select('user_id, pharmacy_id, role, pharmacies(name)')
    .limit(10);
  
  console.log('Users:', JSON.stringify(users, null, 2));

  console.log('\n=== Check auth users ===');
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  console.log('Auth users:', authUsers.users.map(u => ({ id: u.id, email: u.email })));

  console.log('\n=== Test insert with pharmacy_id ===');
  const testPharmacyId = users?.[0]?.pharmacy_id;
  if (testPharmacyId) {
    const { data, error } = await supabase
      .from('insurance_providers')
      .insert({
        name: 'Service Role Test ' + Date.now(),
        coverage_percentage: 80,
        pharmacy_id: testPharmacyId,
        is_active: true
      })
      .select();

    console.log('Result:', { data, error });
  }
}

test();
