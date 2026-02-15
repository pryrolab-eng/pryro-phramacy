const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function testSubscriptions() {
  console.log('=== Testing Admin Subscriptions ===\n');
  
  // 1. Check if table exists
  console.log('1. Checking subscription_plans table...');
  const { data: plans, error: readError } = await supabase
    .from('subscription_plans')
    .select('*')
    .limit(5);
  
  if (readError) {
    console.log('   ❌ Error:', readError.message);
    console.log('\n⚠️  Table may not exist. Create it with:');
    console.log(`
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  period TEXT DEFAULT 'per month',
  features JSONB,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`);
    return;
  }
  
  console.log('   ✅ Table exists');
  console.log('   Plans found:', plans?.length || 0);
  
  // 2. Test insert
  console.log('\n2. Testing insert...');
  const testPlan = {
    name: 'Test Plan ' + Date.now(),
    price: 10000,
    period: 'per month',
    features: ['Feature 1', 'Feature 2'],
    is_popular: false,
    is_active: true
  };
  
  const { data: inserted, error: insertError } = await supabase
    .from('subscription_plans')
    .insert(testPlan)
    .select()
    .single();
  
  if (insertError) {
    console.log('   ❌ Insert error:', insertError.message);
  } else {
    console.log('   ✅ Insert success');
    
    // Clean up
    await supabase.from('subscription_plans').delete().eq('id', inserted.id);
  }
  
  // 3. Summary
  console.log('\n=== Summary ===');
  console.log('Subscriptions page:', !readError && !insertError ? '✅ Working' : '❌ Has issues');
  
  if (plans && plans.length > 0) {
    console.log('\nExisting plans:');
    plans.forEach(p => console.log(`  - ${p.name}: RWF ${p.price}`));
  }
}

testSubscriptions();
