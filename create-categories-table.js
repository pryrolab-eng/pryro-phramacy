const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://seoqhxpclcueylldhiuy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCategoriesTable() {
  console.log('Creating categories table...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text,
        is_active boolean DEFAULT true,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );
      
      CREATE INDEX IF NOT EXISTS idx_categories_pharmacy_id ON categories(pharmacy_id);
      
      CREATE TRIGGER update_categories_updated_at 
        BEFORE UPDATE ON categories 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `
  });
  
  if (error) {
    console.error('Error:', error.message);
    console.log('\nTrying alternative method...\n');
    
    // Try direct SQL execution
    const { error: error2 } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (error2 && error2.message.includes('does not exist')) {
      console.log('Categories table does not exist. Please run this SQL in Supabase SQL Editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_pharmacy_id ON categories(pharmacy_id);
      `);
    } else {
      console.log('Categories table already exists!');
    }
  } else {
    console.log('Success! Categories table created.');
  }
}

createCategoriesTable();
