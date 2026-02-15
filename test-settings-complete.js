const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function testSettings() {
  console.log('=== Testing Admin Settings ===\n');
  
  const userId = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
  
  // 1. Check user role
  console.log('1. Checking user role...');
  const { data: user } = await supabase
    .from('pharmacy_users')
    .select('role')
    .eq('user_id', userId)
    .single();
  console.log('   Role:', user?.role, user?.role === 'superadmin' ? '✅' : '❌');
  
  // 2. Check RLS policies
  console.log('\n2. Testing RLS policies...');
  const { data: readTest, error: readError } = await supabase
    .from('system_settings')
    .select('*')
    .is('pharmacy_id', null)
    .limit(1);
  console.log('   Read access:', readError ? '❌ ' + readError.message : '✅');
  
  // 3. Test update
  console.log('\n3. Testing update...');
  let updateError = null;
  const { data: existing } = await supabase
    .from('system_settings')
    .select('id, setting_key')
    .eq('setting_key', 'platformName')
    .is('pharmacy_id', null)
    .maybeSingle();
  
  if (existing) {
    const result = await supabase
      .from('system_settings')
      .update({ setting_value: 'Pryroxdwe', updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    updateError = result.error;
    console.log('   Update access:', updateError ? '❌ ' + updateError.message : '✅');
  }
  
  // 4. Test insert
  console.log('\n4. Testing insert...');
  const testKey = 'test_' + Date.now();
  const { error: insertError } = await supabase
    .from('system_settings')
    .insert({ setting_key: testKey, setting_value: 'test', pharmacy_id: null });
  console.log('   Insert access:', insertError ? '❌ ' + insertError.message : '✅');
  
  // Clean up
  if (!insertError) {
    await supabase.from('system_settings').delete().eq('setting_key', testKey);
  }
  
  // 5. Summary
  console.log('\n=== Summary ===');
  console.log('User:', 'abdousentore@gmail.com');
  console.log('Role:', user?.role);
  console.log('Can save settings:', !readError && !insertError && !updateError ? '✅ YES' : '❌ NO');
  
  if (readError || insertError || updateError) {
    console.log('\n⚠️  Run fix-system-settings-rls.sql in Supabase');
  }
}

testSettings();
