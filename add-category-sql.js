const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function addCategory() {
  console.log('Adding category using raw SQL...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO categories (pharmacy_id, name, description, is_active)
      VALUES ('11111111-1111-1111-1111-111111111111', 'Test Category', 'Testing', true)
      RETURNING *;
    `
  });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

addCategory();
