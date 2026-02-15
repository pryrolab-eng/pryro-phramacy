const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function testNewSaveLogic() {
  console.log('=== Testing New Save Logic ===\n');
  
  const testSettings = {
    platformName: 'Pryrox',
    maxPharmacies: 100,
    enableRegistrations: true
  };
  
  for (const [key, value] of Object.entries(testSettings)) {
    console.log(`Testing ${key}...`);
    
    // Check if exists
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .eq('setting_key', key)
      .is('pharmacy_id', null)
      .single();
    
    let result;
    if (existing) {
      console.log(`  Found existing, updating...`);
      result = await supabase
        .from('system_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      console.log(`  Not found, inserting...`);
      result = await supabase
        .from('system_settings')
        .insert({ setting_key: key, setting_value: value, pharmacy_id: null });
    }
    
    if (result.error) {
      console.log(`  ❌ Error:`, result.error.message);
    } else {
      console.log(`  ✅ Success`);
    }
  }
  
  console.log('\n=== Verification ===');
  const { data: all } = await supabase
    .from('system_settings')
    .select('*')
    .is('pharmacy_id', null);
  
  console.log('Saved settings:', all);
}

testNewSaveLogic();
