const https = require('https');

const SUPABASE_URL = 'https://seoqhxpclcueylldhiuy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3FoeHBjbGN1ZXlsbGRoaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjg4NzYsImV4cCI6MjA3Mzk0NDg3Nn0.O5F356D4IK9dtLjoiGw8uUHCJmjyV85Z4NdVDC9vtuc';

console.log('=== Admin Settings System Test ===\n');

// Test 1: Check if system_settings table exists
async function checkSystemSettingsTable() {
  console.log('1. Checking system_settings table...');
  
  const options = {
    hostname: 'seoqhxpclcueylldhiuy.supabase.co',
    path: '/rest/v1/system_settings?select=*&limit=1',
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log('   ✓ Table exists');
          console.log(`   Data: ${data}\n`);
          resolve(true);
        } else if (res.statusCode === 404) {
          console.log('   ✗ Table does not exist\n');
          resolve(false);
        } else {
          console.log(`   Response: ${data}\n`);
          resolve(false);
        }
      });
    });
    req.on('error', (e) => {
      console.log(`   ✗ Error: ${e.message}\n`);
      resolve(false);
    });
    req.end();
  });
}

// Test 2: Check admin user and permissions
async function checkAdminUser() {
  console.log('2. Checking admin users...');
  
  const options = {
    hostname: 'seoqhxpclcueylldhiuy.supabase.co',
    path: '/rest/v1/users?select=id,email,role&role=eq.superadmin',
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          const users = JSON.parse(data);
          console.log(`   ✓ Found ${users.length} admin user(s)`);
          console.log(`   Data: ${JSON.stringify(users, null, 2)}\n`);
        } else {
          console.log(`   Response: ${data}\n`);
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      console.log(`   ✗ Error: ${e.message}\n`);
      resolve();
    });
    req.end();
  });
}

// Test 3: Test local API endpoint
async function testLocalAPI() {
  console.log('3. Testing local API endpoint...');
  console.log('   Note: Make sure Next.js dev server is running on port 3000\n');
  
  const http = require('http');
  
  // Test GET
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/system-settings',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   GET Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log('   ✓ API is working');
          console.log(`   Response: ${data}\n`);
        } else {
          console.log(`   Response: ${data}\n`);
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.log(`   ✗ Error: ${e.message}`);
      console.log('   Make sure the dev server is running: npm run dev\n');
      resolve();
    });
    
    req.end();
  });
}

// Test 4: Analyze the API code issues
function analyzeAPIIssues() {
  console.log('4. API Code Analysis:\n');
  
  const issues = [
    {
      severity: 'HIGH',
      issue: 'Hardcoded pharmacy_id',
      description: 'The API uses hardcoded string "userPharmacy.pharmacy_id" instead of actual user pharmacy ID',
      location: 'route.ts line 8 and 38',
      fix: 'Get actual pharmacy_id from authenticated user session'
    },
    {
      severity: 'HIGH',
      issue: 'No authentication check',
      description: 'API does not verify if user is authenticated or has admin role',
      location: 'route.ts GET and PUT handlers',
      fix: 'Add authentication middleware and role verification'
    },
    {
      severity: 'MEDIUM',
      issue: 'No error handling for database operations',
      description: 'Database errors are caught but not properly logged or handled',
      location: 'route.ts catch blocks',
      fix: 'Add proper error logging and specific error messages'
    },
    {
      severity: 'MEDIUM',
      issue: 'No validation of input data',
      description: 'PUT endpoint accepts any JSON without validation',
      location: 'route.ts PUT handler',
      fix: 'Add schema validation using Zod or similar'
    },
    {
      severity: 'LOW',
      issue: 'Inefficient data structure conversion',
      description: 'Settings are converted from array to object format inefficiently',
      location: 'route.ts GET handler',
      fix: 'Optimize data transformation logic'
    }
  ];

  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. [${issue.severity}] ${issue.issue}`);
    console.log(`      Description: ${issue.description}`);
    console.log(`      Location: ${issue.location}`);
    console.log(`      Fix: ${issue.fix}\n`);
  });
}

// Test 5: UI Analysis
function analyzeUIIssues() {
  console.log('5. UI Code Analysis:\n');
  
  const issues = [
    {
      severity: 'HIGH',
      issue: 'No API integration',
      description: 'Settings page does not fetch or save data to backend API',
      location: 'page.tsx - all state is local only',
      fix: 'Add useEffect to fetch settings and update handleSave to call API'
    },
    {
      severity: 'HIGH',
      issue: 'Alert instead of proper feedback',
      description: 'Uses browser alert() for save confirmation',
      location: 'page.tsx handleSave function',
      fix: 'Use toast notifications or proper UI feedback'
    },
    {
      severity: 'MEDIUM',
      issue: 'No error handling',
      description: 'No error states or loading states for API calls',
      location: 'page.tsx',
      fix: 'Add error boundaries and loading states'
    },
    {
      severity: 'MEDIUM',
      issue: 'Hardcoded mock data',
      description: 'Analytics and statistics are hardcoded (47 pharmacies, 234 users, etc.)',
      location: 'page.tsx Platform Analytics card',
      fix: 'Fetch real data from analytics API'
    },
    {
      severity: 'LOW',
      issue: 'Non-functional buttons',
      description: 'Several buttons have no onClick handlers (Download Report, Health Dashboard, etc.)',
      location: 'page.tsx various cards',
      fix: 'Implement actual functionality or remove buttons'
    }
  ];

  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. [${issue.severity}] ${issue.issue}`);
    console.log(`      Description: ${issue.description}`);
    console.log(`      Location: ${issue.location}`);
    console.log(`      Fix: ${issue.fix}\n`);
  });
}

// Run all tests
(async () => {
  await checkSystemSettingsTable();
  await checkAdminUser();
  await testLocalAPI();
  analyzeAPIIssues();
  analyzeUIIssues();
  
  console.log('=== Recommendations ===\n');
  console.log('1. Create system_settings table in Supabase if it doesn\'t exist');
  console.log('2. Fix authentication and authorization in API routes');
  console.log('3. Connect UI to backend API endpoints');
  console.log('4. Add proper error handling and validation');
  console.log('5. Replace mock data with real analytics');
  console.log('6. Implement missing button functionalities');
  console.log('7. Add proper user feedback mechanisms (toasts, notifications)');
  console.log('\n=== Test Complete ===');
})();
