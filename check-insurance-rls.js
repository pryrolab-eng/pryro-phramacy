const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function checkRLS() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        policyname,
        cmd,
        CASE 
          WHEN qual IS NULL THEN 'NO USING CLAUSE'
          ELSE qual 
        END as using_clause,
        CASE 
          WHEN with_check IS NULL THEN 'NO WITH CHECK CLAUSE'
          ELSE with_check 
        END as with_check_clause
      FROM pg_policies 
      WHERE tablename = 'insurance_providers'
      ORDER BY cmd, policyname;
    `
  });

  if (error) {
    // Try direct query
    const { data: policies, error: err2 } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'insurance_providers');
    
    if (err2) {
      console.error('Error:', err2);
    } else {
      console.log('Current RLS Policies:', JSON.stringify(policies, null, 2));
    }
  } else {
    console.log('Current RLS Policies:', JSON.stringify(data, null, 2));
  }
}

checkRLS();
