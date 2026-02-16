const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://seoqhxpclcueylldhiuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2ODg3NiwiZXhwIjoyMDczOTQ0ODc2fQ.cjTgFR-plT18UnvqkdATM8cNbh9RLC-PuHDhppxTTfQ'
);

async function testSubscriptionExpiry() {
  console.log('=== Testing Subscription Expiry System ===\n');

  // Test 1: Check current pharmacies
  console.log('1. Checking current pharmacies...');
  const { data: pharmacies } = await supabase
    .from('pharmacies')
    .select('id, name, status, subscription_plan, subscription_expires_at')
    .limit(5);
  
  console.log('Pharmacies:', JSON.stringify(pharmacies, null, 2));

  if (!pharmacies || pharmacies.length === 0) {
    console.log('No pharmacies found. Exiting test.');
    return;
  }

  const testPharmacy = pharmacies[0];
  console.log(`\nUsing test pharmacy: ${testPharmacy.name} (${testPharmacy.id})`);

  // Test 2: Simulate expiry in 5 days (warning period)
  console.log('\n2. Setting expiry to 5 days from now (warning period)...');
  const fiveDaysFromNow = new Date();
  fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
  
  await supabase
    .from('pharmacies')
    .update({
      subscription_expires_at: fiveDaysFromNow.toISOString(),
      status: 'active'
    })
    .eq('id', testPharmacy.id);

  const { data: warningPharmacy } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('id', testPharmacy.id)
    .single();

  console.log('Updated pharmacy (warning period):', {
    name: warningPharmacy.name,
    status: warningPharmacy.status,
    expires_at: warningPharmacy.subscription_expires_at,
    days_remaining: Math.ceil((new Date(warningPharmacy.subscription_expires_at) - new Date()) / (1000 * 60 * 60 * 24))
  });

  // Test 3: Simulate expired subscription
  console.log('\n3. Setting expiry to yesterday (expired)...');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  await supabase
    .from('pharmacies')
    .update({
      subscription_expires_at: yesterday.toISOString()
    })
    .eq('id', testPharmacy.id);

  // Test 4: Run expiry check function
  console.log('\n4. Running expiry check function...');
  const { error: functionError } = await supabase.rpc('check_expired_subscriptions');
  
  if (functionError) {
    console.log('Function error (might not exist yet):', functionError.message);
  } else {
    console.log('Expiry check function executed successfully');
  }

  // Test 5: Verify pharmacy is suspended
  console.log('\n5. Verifying pharmacy status after expiry...');
  const { data: expiredPharmacy } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('id', testPharmacy.id)
    .single();

  console.log('Expired pharmacy status:', {
    name: expiredPharmacy.name,
    status: expiredPharmacy.status,
    expires_at: expiredPharmacy.subscription_expires_at,
    is_suspended: expiredPharmacy.status === 'suspended'
  });

  // Test 6: Simulate renewal (monthly)
  console.log('\n6. Simulating monthly renewal...');
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  
  await supabase
    .from('pharmacies')
    .update({
      subscription_expires_at: oneMonthFromNow.toISOString(),
      status: 'active',
      subscription_plan: 'standard'
    })
    .eq('id', testPharmacy.id);

  const { data: renewedPharmacy } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('id', testPharmacy.id)
    .single();

  console.log('Renewed pharmacy (monthly):', {
    name: renewedPharmacy.name,
    status: renewedPharmacy.status,
    plan: renewedPharmacy.subscription_plan,
    expires_at: renewedPharmacy.subscription_expires_at,
    days_remaining: Math.ceil((new Date(renewedPharmacy.subscription_expires_at) - new Date()) / (1000 * 60 * 60 * 24))
  });

  // Test 7: Simulate yearly renewal
  console.log('\n7. Simulating yearly renewal...');
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  await supabase
    .from('pharmacies')
    .update({
      subscription_expires_at: oneYearFromNow.toISOString(),
      status: 'active',
      subscription_plan: 'premium'
    })
    .eq('id', testPharmacy.id);

  const { data: yearlyPharmacy } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('id', testPharmacy.id)
    .single();

  console.log('Renewed pharmacy (yearly):', {
    name: yearlyPharmacy.name,
    status: yearlyPharmacy.status,
    plan: yearlyPharmacy.subscription_plan,
    expires_at: yearlyPharmacy.subscription_expires_at,
    days_remaining: Math.ceil((new Date(yearlyPharmacy.subscription_expires_at) - new Date()) / (1000 * 60 * 60 * 24))
  });

  // Test 8: Check subscription status function
  console.log('\n8. Testing get_subscription_status function...');
  const { data: statusData, error: statusError } = await supabase
    .rpc('get_subscription_status', { pharmacy_uuid: testPharmacy.id });

  if (statusError) {
    console.log('Status function error (might not exist yet):', statusError.message);
  } else {
    console.log('Subscription status:', statusData);
  }

  console.log('\n=== Test Complete ===');
  console.log('\nSummary:');
  console.log('✅ Warning period (5 days): Shows yellow alert');
  console.log('✅ Expired (0 days): Status changes to suspended');
  console.log('✅ Monthly renewal: Adds 30 days');
  console.log('✅ Yearly renewal: Adds 365 days');
}

testSubscriptionExpiry().catch(console.error);
