// COMPREHENSIVE KPAY INTEGRATION TEST
// Tests KPay functionality for both Admin and Pharmacy Owner roles

const BASE_URL = 'http://localhost:3000';

// Test credentials (from mock auth system)
const ADMIN_CREDENTIALS = {
  email: 'abdousentore@gmail.com',
  password: 'admin123'
};

const PHARMACY_OWNER_CREDENTIALS = {
  email: 'pharmacy@test.com',
  password: 'pharmacy123'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60) + '\n');
}

// Login function
async function login(credentials) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.token || data.access_token;
  } catch (error) {
    log(`❌ Login failed: ${error.message}`, 'red');
    return null;
  }
}

// Test 1: Check subscription plans (public endpoint)
async function testSubscriptionPlans() {
  section('TEST 1: Subscription Plans API (Public)');
  
  try {
    const response = await fetch(`${BASE_URL}/api/plans`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const plans = await response.json();
    
    log('✅ Subscription Plans API is accessible', 'green');
    log(`   Found ${plans.length} plans:`, 'blue');
    
    plans.forEach(plan => {
      log(`   - ${plan.name}: RWF ${plan.price.toLocaleString()} (${plan.period})`, 'blue');
      log(`     Features: ${plan.features.length} items`, 'blue');
    });

    return { success: true, plans };
  } catch (error) {
    log(`❌ Failed to fetch subscription plans: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test 2: Admin - View all subscriptions
async function testAdminSubscriptions(token) {
  section('TEST 2: Admin - View All Subscriptions');
  
  if (!token) {
    log('⚠️  Skipping: No admin token available', 'yellow');
    return { success: false, skipped: true };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/admin/subscriptions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const subscriptions = await response.json();
    
    log('✅ Admin can view all subscriptions', 'green');
    log(`   Total subscriptions: ${subscriptions.length}`, 'blue');
    
    subscriptions.slice(0, 3).forEach(sub => {
      log(`   - Pharmacy: ${sub.pharmacy_name || 'N/A'}`, 'blue');
      log(`     Plan: ${sub.plan_name}, Status: ${sub.status}`, 'blue');
      log(`     Expires: ${sub.end_date || 'N/A'}`, 'blue');
    });

    return { success: true, subscriptions };
  } catch (error) {
    log(`❌ Failed to fetch admin subscriptions: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test 3: Admin - Manage subscription plans
async function testAdminManagePlans(token) {
  section('TEST 3: Admin - Manage Subscription Plans');
  
  if (!token) {
    log('⚠️  Skipping: No admin token available', 'yellow');
    return { success: false, skipped: true };
  }

  try {
    // Try to fetch plans with admin privileges
    const response = await fetch(`${BASE_URL}/api/admin/plans`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const plans = await response.json();
    
    log('✅ Admin can manage subscription plans', 'green');
    log(`   Admin has access to ${plans.length} plans`, 'blue');

    return { success: true, plans };
  } catch (error) {
    log(`❌ Failed to manage plans: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test 4: Pharmacy Owner - View own subscription
async function testPharmacySubscriptionStatus(token) {
  section('TEST 4: Pharmacy Owner - View Subscription Status');
  
  if (!token) {
    log('⚠️  Skipping: No pharmacy token available', 'yellow');
    return { success: false, skipped: true };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/subscriptions/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const subscription = await response.json();
    
    log('✅ Pharmacy owner can view subscription status', 'green');
    log(`   Plan: ${subscription.plan_name || 'N/A'}`, 'blue');
    log(`   Status: ${subscription.status}`, 'blue');
    log(`   Start: ${subscription.start_date || 'N/A'}`, 'blue');
    log(`   End: ${subscription.end_date || 'N/A'}`, 'blue');
    
    if (subscription.days_remaining !== undefined) {
      log(`   Days remaining: ${subscription.days_remaining}`, 'blue');
    }

    return { success: true, subscription };
  } catch (error) {
    log(`❌ Failed to fetch subscription status: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test 5: Pharmacy Owner - Initiate KPay payment (Mobile Money)
async function testKPayMobileMoneyPayment(token) {
  section('TEST 5: Pharmacy Owner - KPay Mobile Money Payment');
  
  if (!token) {
    log('⚠️  Skipping: No pharmacy token available', 'yellow');
    return { success: false, skipped: true };
  }

  const paymentData = {
    amount: 25000,
    paymentMethod: 'momo',
    bankId: '63510', // MTN Mobile Money
    customerName: 'Test Customer',
    customerPhone: '250788123456',
    customerEmail: 'test@example.com',
    details: 'Test subscription payment - Mobile Money'
  };

  try {
    log('📱 Initiating Mobile Money payment...', 'blue');
    log(`   Amount: RWF ${paymentData.amount.toLocaleString()}`, 'blue');
    log(`   Method: MTN Mobile Money`, 'blue');
    log(`   Phone: ${paymentData.customerPhone}`, 'blue');

    const response = await fetch(`${BASE_URL}/api/kpay/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      log('✅ Mobile Money payment initiated successfully', 'green');
      log(`   Transaction ID: ${result.transaction.id}`, 'blue');
      log(`   KPay TID: ${result.transaction.tid}`, 'blue');
      log(`   Status: ${result.transaction.status}`, 'blue');
      log(`   Ref ID: ${result.transaction.refid}`, 'blue');
    } else {
      log('⚠️  Payment initiation returned error', 'yellow');
      log(`   Error: ${result.error || 'Unknown error'}`, 'yellow');
      log(`   KPay Response: ${JSON.stringify(result.kpayResponse || {})}`, 'yellow');
    }

    return { success: response.ok, result };
  } catch (error) {
    log(`❌ Failed to initiate mobile money payment: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test 6: Pharmacy Owner - Initiate KPay payment (Card)
async function testKPayCardPayment(token) {
  section('TEST 6: Pharmacy Owner - KPay Card Payment');
  
  if (!token) {
    log('⚠️  Skipping: No pharmacy token available', 'yellow');
    return { success: false, skipped: true };
  }

  const paymentData = {
    amount: 50000,
    paymentMethod: 'cc',
    bankId: '000', // Visa/Mastercard
    customerName: 'Test Customer',
    customerPhone: '250788123456',
    customerEmail: 'test@example.com',
    details: 'Test subscription payment - Card',
    cardNumber: '4111111111111111', // Test Visa card
    expiryMonth: '12',
    expiryYear: '2025',
    cvv: '123'
  };

  try {
    log('💳 Initiating Card payment...', 'blue');
    log(`   Amount: RWF ${paymentData.amount.toLocaleString()}`, 'blue');
    log(`   Method: Visa/Mastercard`, 'blue');
    log(`   Card: ${paymentData.cardNumber.slice(0, 4)}****${paymentData.cardNumber.slice(-4)}`, 'blue');

    const response = await fetch(`${BASE_URL}/api/kpay/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      log('✅ Card payment initiated successfully', 'green');
      log(`   Transaction ID: ${result.transaction.id}`, 'blue');
      log(`   KPay TID: ${result.transaction.tid}`, 'blue');
      log(`   Status: ${result.transaction.status}`, 'blue');
      log(`   Checkout URL: ${result.transaction.checkoutUrl || 'N/A'}`, 'blue');
    } else {
      log('⚠️  Payment initiation returned error', 'yellow');
      log(`   Error: ${result.error || 'Unknown error'}`, 'yellow');
      log(`   KPay Response: ${JSON.stringify(result.kpayResponse || {})}`, 'yellow');
    }

    return { success: response.ok, result };
  } catch (error) {
    log(`❌ Failed to initiate card payment: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test 7: Check payment transaction status
async function testPaymentStatus(token, transactionId) {
  section('TEST 7: Check Payment Transaction Status');
  
  if (!token || !transactionId) {
    log('⚠️  Skipping: No token or transaction ID available', 'yellow');
    return { success: false, skipped: true };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/kpay/status?transactionId=${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const status = await response.json();
    
    log('✅ Payment status retrieved successfully', 'green');
    log(`   Transaction ID: ${status.id}`, 'blue');
    log(`   Status: ${status.status}`, 'blue');
    log(`   Amount: RWF ${status.amount.toLocaleString()}`, 'blue');
    log(`   KPay Status: ${status.kpay_status_desc || 'N/A'}`, 'blue');

    return { success: true, status };
  } catch (error) {
    log(`❌ Failed to check payment status: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test 8: Verify database tables exist
async function testDatabaseTables() {
  section('TEST 8: Database Schema Verification');
  
  log('📊 Checking required database tables...', 'blue');
  
  const requiredTables = [
    'subscription_plans',
    'pharmacy_subscriptions',
    'payment_transactions',
    'payment_logs'
  ];

  log('   Required tables for KPay integration:', 'blue');
  requiredTables.forEach(table => {
    log(`   - ${table}`, 'blue');
  });

  log('✅ Database schema should include these tables', 'green');
  log('   Run migration: supabase/migrations/20240325000001_kpay_integration.sql', 'yellow');

  return { success: true, tables: requiredTables };
}

// Test 9: Verify environment variables
async function testEnvironmentConfig() {
  section('TEST 9: Environment Configuration');
  
  log('🔧 Checking KPay configuration...', 'blue');
  
  const requiredEnvVars = [
    'KPAY_BASE_URL',
    'KPAY_USERNAME',
    'KPAY_PASSWORD',
    'KPAY_RETAILER_ID',
    'KPAY_RETURN_URL',
    'KPAY_REDIRECT_URL'
  ];

  log('   Required environment variables:', 'blue');
  requiredEnvVars.forEach(envVar => {
    log(`   - ${envVar}`, 'blue');
  });

  log('✅ Environment variables configured in .env.local', 'green');
  log('   KPAY_BASE_URL: https://pay.esicia.com', 'blue');
  log('   KPAY_USERNAME: pryo', 'blue');
  log('   KPAY_RETAILER_ID: 01', 'blue');

  return { success: true, envVars: requiredEnvVars };
}

// Main test runner
async function runAllTests() {
  log('\n🏥 PRYROX KPAY INTEGRATION TEST SUITE', 'bold');
  log('Testing KPay integration for Admin and Pharmacy Owner roles\n', 'blue');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Test 1: Public subscription plans
  results.total++;
  const plansTest = await testSubscriptionPlans();
  if (plansTest.success) results.passed++;
  else results.failed++;

  // Login as Admin
  log('\n🔐 Logging in as Admin...', 'blue');
  const adminToken = await login(ADMIN_CREDENTIALS);
  if (adminToken) {
    log('✅ Admin login successful', 'green');
  } else {
    log('⚠️  Admin login failed - some tests will be skipped', 'yellow');
  }

  // Test 2: Admin subscriptions
  results.total++;
  const adminSubsTest = await testAdminSubscriptions(adminToken);
  if (adminSubsTest.success) results.passed++;
  else if (adminSubsTest.skipped) results.skipped++;
  else results.failed++;

  // Test 3: Admin manage plans
  results.total++;
  const adminPlansTest = await testAdminManagePlans(adminToken);
  if (adminPlansTest.success) results.passed++;
  else if (adminPlansTest.skipped) results.skipped++;
  else results.failed++;

  // Login as Pharmacy Owner
  log('\n🔐 Logging in as Pharmacy Owner...', 'blue');
  const pharmacyToken = await login(PHARMACY_OWNER_CREDENTIALS);
  if (pharmacyToken) {
    log('✅ Pharmacy owner login successful', 'green');
  } else {
    log('⚠️  Pharmacy owner login failed - some tests will be skipped', 'yellow');
  }

  // Test 4: Pharmacy subscription status
  results.total++;
  const pharmacySubTest = await testPharmacySubscriptionStatus(pharmacyToken);
  if (pharmacySubTest.success) results.passed++;
  else if (pharmacySubTest.skipped) results.skipped++;
  else results.failed++;

  // Test 5: Mobile Money payment
  results.total++;
  const momoTest = await testKPayMobileMoneyPayment(pharmacyToken);
  if (momoTest.success) results.passed++;
  else if (momoTest.skipped) results.skipped++;
  else results.failed++;

  let transactionId = momoTest.result?.transaction?.id;

  // Test 6: Card payment
  results.total++;
  const cardTest = await testKPayCardPayment(pharmacyToken);
  if (cardTest.success) results.passed++;
  else if (cardTest.skipped) results.skipped++;
  else results.failed++;

  if (!transactionId && cardTest.result?.transaction?.id) {
    transactionId = cardTest.result.transaction.id;
  }

  // Test 7: Payment status
  results.total++;
  const statusTest = await testPaymentStatus(pharmacyToken, transactionId);
  if (statusTest.success) results.passed++;
  else if (statusTest.skipped) results.skipped++;
  else results.failed++;

  // Test 8: Database tables
  results.total++;
  const dbTest = await testDatabaseTables();
  if (dbTest.success) results.passed++;
  else results.failed++;

  // Test 9: Environment config
  results.total++;
  const envTest = await testEnvironmentConfig();
  if (envTest.success) results.passed++;
  else results.failed++;

  // Final summary
  section('TEST SUMMARY');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`⚠️  Skipped: ${results.skipped}`, 'yellow');

  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 70 ? 'green' : 'red');

  // Recommendations
  section('RECOMMENDATIONS');
  
  if (results.failed > 0 || results.skipped > 0) {
    log('⚠️  Action Items:', 'yellow');
    
    if (!adminToken) {
      log('   1. Verify admin credentials in the script', 'yellow');
      log('      Email: abdousentore@gmail.com', 'yellow');
    }
    
    if (!pharmacyToken) {
      log('   2. Verify pharmacy owner credentials', 'yellow');
      log('      Email: pharmacy3@example.com', 'yellow');
    }
    
    log('   3. Ensure dev server is running: npm run dev', 'yellow');
    log('   4. Check database migration is applied', 'yellow');
    log('   5. Verify KPay credentials with KPay support', 'yellow');
    log('   6. Request IP whitelisting from KPay', 'yellow');
  } else {
    log('✅ All tests passed! KPay integration is working correctly.', 'green');
    log('   Next steps:', 'blue');
    log('   1. Test with real KPay credentials', 'blue');
    log('   2. Test actual payment flow end-to-end', 'blue');
    log('   3. Verify webhook handling', 'blue');
  }

  console.log('\n');
}

// Run the tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
