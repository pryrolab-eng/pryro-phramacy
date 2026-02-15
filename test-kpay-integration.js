// Test KPay Integration
const fs = require('fs');
const path = require('path');

console.log('Testing KPay Integration...\n');

// Read the KPay service file
const kpayPath = path.join(__dirname, 'src', 'lib', 'kpay.ts');
const kpayContent = fs.readFileSync(kpayPath, 'utf8');

console.log('✓ KPay service file found');

// Check for required methods
const hasInitiatePayment = kpayContent.includes('async initiatePayment');
const hasCheckStatus = kpayContent.includes('async checkTransactionStatus');
const hasGetAuthHeader = kpayContent.includes('getAuthHeader');

console.log(`✓ initiatePayment method: ${hasInitiatePayment ? 'EXISTS' : 'MISSING'}`);
console.log(`✓ checkTransactionStatus method: ${hasCheckStatus ? 'EXISTS' : 'MISSING'}`);
console.log(`✓ getAuthHeader method: ${hasGetAuthHeader ? 'EXISTS' : 'MISSING'}`);

// Read the KPay initiate route
const initiatePath = path.join(__dirname, 'src', 'app', 'api', 'kpay', 'initiate', 'route.ts');
const initiateContent = fs.readFileSync(initiatePath, 'utf8');

console.log('\n✓ KPay initiate route found');

// Check for proper parameter handling
const hasPhoneValidation = initiateContent.includes('PhoneNumberValidator');
const hasCardValidation = initiateContent.includes('CardValidator');
const hasKPayService = initiateContent.includes('kpayService.initiatePayment');
const noReturnUrl = !initiateContent.includes('returnUrl:');

console.log(`✓ Phone validation: ${hasPhoneValidation ? 'IMPLEMENTED' : 'MISSING'}`);
console.log(`✓ Card validation: ${hasCardValidation ? 'IMPLEMENTED' : 'MISSING'}`);
console.log(`✓ KPay service call: ${hasKPayService ? 'IMPLEMENTED' : 'MISSING'}`);
console.log(`✓ No returnUrl parameter: ${noReturnUrl ? 'FIXED' : 'STILL PRESENT'}`);

// Read the settings page
const settingsPath = path.join(__dirname, 'src', 'app', '(dashboard)', 'settings', 'page.tsx');
const settingsContent = fs.readFileSync(settingsPath, 'utf8');

console.log('\n✓ Settings page found');

// Check for upgrade dialog
const hasUpgradeDialog = settingsContent.includes('isUpgradeDialogOpen');
const hasProcessUpgradePayment = settingsContent.includes('const processUpgradePayment');
const noPlanNameError = !settingsContent.includes('planId: plan.id || planName');

console.log(`✓ Upgrade dialog: ${hasUpgradeDialog ? 'IMPLEMENTED' : 'MISSING'}`);
console.log(`✓ processUpgradePayment function: ${hasProcessUpgradePayment ? 'IMPLEMENTED' : 'MISSING'}`);
console.log(`✓ planName variable fixed: ${noPlanNameError ? 'FIXED' : 'STILL HAS ERROR'}`);

// Check for proper plan.name usage
const correctPlanUsage = settingsContent.includes('planId: plan.id || plan.name');
console.log(`✓ Correct plan.name usage: ${correctPlanUsage ? 'FIXED' : 'NEEDS FIX'}`);

console.log('\n=== Test Summary ===');
const allPassed = hasInitiatePayment && hasCheckStatus && hasGetAuthHeader && 
                  hasPhoneValidation && hasCardValidation && hasKPayService && 
                  noReturnUrl && hasUpgradeDialog && hasProcessUpgradePayment && 
                  noPlanNameError && correctPlanUsage;

if (allPassed) {
  console.log('✅ All checks passed! Card upgrade should work.');
} else {
  console.log('❌ Some checks failed. Review the output above.');
}
