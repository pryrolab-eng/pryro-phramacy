const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ',
  { db: { schema: 'pg_catalog' } }
);

async function checkRLS() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'insurance_providers' ORDER BY cmd, policyname;`
  });

  console.log('Result:', { data, error });
}

checkRLS();
