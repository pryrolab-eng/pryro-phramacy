const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ',
  { auth: { persistSession: false } }
);

async function testCategories() {
  console.log('Testing categories table...\n');
  
  // Get pharmacy
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('id')
    .limit(1)
    .single();
  
  console.log('Pharmacy ID:', pharmacy?.id);
  
  // Try to insert
  const { data, error } = await supabase
    .from('categories')
    .insert({
      pharmacy_id: pharmacy.id,
      name: 'Test Category',
      description: 'Testing'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success! Category created:', data);
  }
}

testCategories();
