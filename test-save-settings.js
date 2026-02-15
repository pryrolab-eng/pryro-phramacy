const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function testSaveSettings() {
  console.log('=== Testing Admin Settings Save ===\n');
  
  const userId = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
  
  // Check user role
  const { data: user } = await supabase
    .from('pharmacy_users')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  console.log('User role:', user?.role);
  
  // Test upsert to system_settings
  console.log('\nTesting upsert to system_settings...');
  const { data, error } = await supabase
    .from('system_settings')
    .upsert(
      { 
        setting_key: 'platformName', 
        setting_value: 'Pryrox Test',
        pharmacy_id: null,
        updated_at: new Date().toISOString()
      },
      { 
        onConflict: 'pharmacy_id,setting_key',
        ignoreDuplicates: false 
      }
    )
    .select();
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
    console.log('\n=== Fix Required ===');
    console.log('Run this SQL to fix RLS policies:\n');
    console.log(`-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Superadmin full access" ON system_settings;

-- Create policy for superadmin
CREATE POLICY "Superadmin full access" ON system_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pharmacy_users
    WHERE pharmacy_users.user_id = auth.uid()
    AND pharmacy_users.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pharmacy_users
    WHERE pharmacy_users.user_id = auth.uid()
    AND pharmacy_users.role = 'superadmin'
  )
);`);
  } else {
    console.log('✅ Success:', data);
  }
}

testSaveSettings();
