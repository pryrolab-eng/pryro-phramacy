// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';

// Test credentials
const ADMIN_CREDS = { email: 'abdousentore@gmail.com', password: '123456' };
const PHARMACY_CREDS = { email: 'pharmacy3@example.com', password: '123456' };
const PHARMACIST_CREDS = { email: 'pharmacist3@example.com', password: '123456' };

class KPaySystemTester {
  constructor() {
    this.adminToken = null;
    this.pharmacyToken = null;
    this.pharmacistToken = null;
  }

  async login(credentials, role) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${role} login successful`);
        return data.token || 'logged-in';
      } else {
        console.log(`❌ ${role} login failed:`, data.error);
        return null;
      }
    } catch (error) {
      console.log(`❌ ${role} login error:`, error.message);
      return null;
    }
  }

  async testAdminPlanManagement() {
    console.log('\n🔧 Testing Admin Plan Management...');
    
    try {
      // Get plans
      const response = await fetch(`${BASE_URL}/api/admin/plans`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      
      const plans = await response.json();
      
      if (response.ok) {
        console.log('✅ Admin can fetch plans:', plans.length, 'plans found');
        
        // Test creating a new plan
        const newPlan = {
          name: 'Test Plan',
          price: 30000,
          period: 'per month',
          features: ['Test feature 1', 'Test feature 2']
        };
        
        const createResponse = await fetch(`${BASE_URL}/api/admin/plans`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.adminToken}`
          },
          body: JSON.stringify(newPlan)
        });
        
        const createResult = await createResponse.json();
        
        if (createResponse.ok) {
          console.log('✅ Admin can create plans');
        } else {
          console.log('❌ Admin plan creation failed:', createResult.error);
        }
        
      } else {
        console.log('❌ Admin plan fetch failed:', plans.error);
      }
    } catch (error) {
      console.log('❌ Admin plan management error:', error.message);
    }
  }

  async testKPayPayment(token, role, paymentData) {
    console.log(`\n💳 Testing KPay Payment for ${role}...`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/kpay/initiate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${role} payment initiation successful`);
        console.log('   Transaction ID:', result.transaction?.id);
        console.log('   KPay TID:', result.transaction?.tid);
        console.log('   Status:', result.transaction?.status);
        
        if (result.transaction?.id) {
          await this.testPaymentStatus(token, result.transaction.id, role);
        }
        
        return result.transaction;
      } else {
        console.log(`❌ ${role} payment failed:`, result.error);
        return null;
      }
    } catch (error) {
      console.log(`❌ ${role} payment error:`, error.message);
      return null;
    }
  }

  async testPaymentStatus(token, transactionId, role) {
    console.log(`\n📊 Testing Payment Status Check for ${role}...`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/kpay/status?transactionId=${transactionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${role} can check payment status`);
        console.log('   Status:', result.transaction?.status);
        console.log('   KPay Status:', result.transaction?.kpay_status_desc);
      } else {
        console.log(`❌ ${role} status check failed:`, result.error);
      }
    } catch (error) {
      console.log(`❌ ${role} status check error:`, error.message);
    }
  }

  async testSubscriptionManagement() {
    console.log('\n⏰ Testing Subscription Time Counter...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/subscriptions/status`, {
        headers: { 'Authorization': `Bearer ${this.pharmacyToken}` }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Subscription status check successful');
        console.log('   Plan:', result.plan?.name);
        console.log('   Status:', result.status);
        console.log('   Days remaining:', result.daysRemaining);
      } else {
        console.log('❌ Subscription status check failed:', result.error);
      }
    } catch (error) {
      console.log('❌ Subscription status error:', error.message);
    }
  }

  async testPublicPlans() {
    console.log('\n🌐 Testing Public Plans API...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/plans`);
      const plans = await response.json();
      
      if (response.ok) {
        console.log('✅ Public plans API working:', plans.length, 'plans available');
        plans.forEach(plan => {
          console.log(`   - ${plan.name}: RWF ${plan.price.toLocaleString()} ${plan.period}`);
        });
      } else {
        console.log('❌ Public plans API failed:', plans.error);
      }
    } catch (error) {
      console.log('❌ Public plans API error:', error.message);
    }
  }

  async runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive KPay System Test...\n');
    
    // 1. Test logins
    this.adminToken = await this.login(ADMIN_CREDS, 'Super Admin');
    this.pharmacyToken = await this.login(PHARMACY_CREDS, 'Pharmacy Owner');
    this.pharmacistToken = await this.login(PHARMACIST_CREDS, 'Pharmacist');
    
    // 2. Test admin functionality
    if (this.adminToken) {
      await this.testAdminPlanManagement();
    }
    
    // 3. Test public plans
    await this.testPublicPlans();
    
    // 4. Test pharmacy owner payments
    if (this.pharmacyToken) {
      const pharmacyPayment = {
        amount: 50000,
        paymentMethod: 'momo',
        bankId: '63510',
        customerName: 'Pharmacy Test Customer',
        customerPhone: '+250788123456',
        customerEmail: 'pharmacy.test@example.com',
        details: 'Subscription payment test',
        subscriptionId: 'test-sub-' + Date.now()
      };
      
      await this.testKPayPayment(this.pharmacyToken, 'Pharmacy Owner', pharmacyPayment);
      await this.testSubscriptionManagement();
    }
    
    // 5. Test pharmacist payments
    if (this.pharmacistToken) {
      const pharmacistPayment = {
        amount: 25000,
        paymentMethod: 'momo',
        bankId: '63514', // Airtel Money
        customerName: 'Pharmacist Test Customer',
        customerPhone: '+250788654321',
        customerEmail: 'pharmacist.test@example.com',
        details: 'POS sale payment test',
        saleId: 'test-sale-' + Date.now()
      };
      
      await this.testKPayPayment(this.pharmacistToken, 'Pharmacist', pharmacistPayment);
    }
    
    console.log('\n🏁 Comprehensive KPay System Test Completed!');
    console.log('\n📋 Test Summary:');
    console.log('   - Super Admin: Plan management and oversight');
    console.log('   - Pharmacy Owner: Subscription payments and management');
    console.log('   - Pharmacist: POS sale payments');
    console.log('   - Public API: Plan information access');
    console.log('   - KPay Integration: Payment processing and status tracking');
    console.log('   - Time Counter: Subscription expiry tracking');
  }
}

// Run the test
const tester = new KPaySystemTester();
tester.runComprehensiveTest().catch(console.error);