const fs = require('fs');
const path = require('path');

console.log('Testing Subscription Creation Fix...\n');

// Check settings page
const settingsPath = path.join(__dirname, 'src', 'app', '(dashboard)', 'settings', 'page.tsx');
const settingsContent = fs.readFileSync(settingsPath, 'utf8');

const usesUpgradeEndpoint = settingsContent.includes("'/api/subscriptions/upgrade'");
const usesPlanName = settingsContent.includes('planId: plan.name');
const noStatusEndpoint = !settingsContent.includes("'/api/subscriptions/status',\n        method: 'POST'");

console.log('Settings Page:');
console.log(`✓ Uses /api/subscriptions/upgrade: ${usesUpgradeEndpoint ? 'YES' : 'NO'}`);
console.log(`✓ Passes plan.name: ${usesPlanName ? 'YES' : 'NO'}`);
console.log(`✓ No POST to status endpoint: ${noStatusEndpoint ? 'YES' : 'NO'}`);

// Check upgrade route
const upgradePath = path.join(__dirname, 'src', 'app', 'api', 'subscriptions', 'upgrade', 'route.ts');
const upgradeContent = fs.readFileSync(upgradePath, 'utf8');

const lookupByName = upgradeContent.includes(".eq('name', planId)");

console.log('\nUpgrade Route:');
console.log(`✓ Looks up plan by name: ${lookupByName ? 'YES' : 'NO'}`);

console.log('\n=== Result ===');
if (usesUpgradeEndpoint && usesPlanName && noStatusEndpoint && lookupByName) {
  console.log('✅ Subscription creation should work now!');
} else {
  console.log('❌ Still has issues');
}
