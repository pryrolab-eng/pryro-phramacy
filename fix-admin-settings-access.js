const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function fixSuperAdminAccess() {
  console.log('=== Fixing Admin Settings Access ===\n');
  
  const superAdminEmail = 'abdousentore@gmail.com';
  const userId = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
  
  // Step 1: Add superadmin to enum using raw SQL
  console.log('Step 1: Adding superadmin to user_role enum...');
  const { data: enumData, error: enumError } = await supabase.rpc('exec_sql', {
    query: "ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';"
  });
  
  if (enumError) {
    console.log('Note: Trying alternative method...');
    // Try direct SQL execution
    const { error: sqlError } = await supabase
      .from('pharmacy_users')
      .select('role')
      .limit(0);
    
    console.log('⚠️  Need to run this SQL manually in Supabase SQL Editor:');
    console.log("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';");
    console.log('');
  } else {
    console.log('✅ Enum updated successfully');
  }
  
  // Step 2: Update user role
  console.log('\nStep 2: Updating user role to superadmin...');
  console.log('Run this SQL in Supabase SQL Editor:\n');
  console.log(`-- Add superadmin to enum if not exists`);
  console.log(`DO $$ BEGIN`);
  console.log(`  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'superadmin') THEN`);
  console.log(`    ALTER TYPE user_role ADD VALUE 'superadmin';`);
  console.log(`  END IF;`);
  console.log(`END $$;`);
  console.log('');
  console.log(`-- Update user to superadmin`);
  console.log(`UPDATE pharmacy_users`);
  console.log(`SET role = 'superadmin', pharmacy_id = NULL`);
  console.log(`WHERE user_id = '${userId}';`);
  console.log('');
  console.log(`-- Verify the change`);
  console.log(`SELECT user_id, role, pharmacy_id, is_active`);
  console.log(`FROM pharmacy_users`);
  console.log(`WHERE user_id = '${userId}';`);
  
  console.log('\n=== Current Status ===');
  const { data: currentUser } = await supabase
    .from('pharmacy_users')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  console.log('Email:', superAdminEmail);
  console.log('User ID:', userId);
  console.log('Current Role:', currentUser.role);
  console.log('Pharmacy ID:', currentUser.pharmacy_id);
  console.log('Admin Settings Access:', currentUser.role === 'superadmin' ? '✅ GRANTED' : '❌ DENIED (needs superadmin role)');
}

fixSuperAdminAccess();
