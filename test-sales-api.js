// Test script for sales API endpoints
const testSalesAPI = async () => {
  console.log('Testing Sales API Endpoints...\n');

  try {
    // Test 1: Sales endpoint
    console.log('1. Testing /api/sales endpoint...');
    const salesResponse = await fetch('http://localhost:3000/api/sales');
    const salesData = await salesResponse.json();
    console.log('Sales Response:', JSON.stringify(salesData, null, 2));
    console.log('Status:', salesResponse.status, '\n');

    // Test 2: Analytics endpoint
    console.log('2. Testing /api/sales/analytics endpoint...');
    const analyticsResponse = await fetch('http://localhost:3000/api/sales/analytics');
    const analyticsData = await analyticsResponse.json();
    console.log('Analytics Response:', JSON.stringify(analyticsData, null, 2));
    console.log('Status:', analyticsResponse.status, '\n');

    // Summary
    console.log('=== TEST SUMMARY ===');
    console.log('Sales endpoint returned:', salesData.sales?.length || 0, 'sales');
    console.log('Today Total:', salesData.stats?.todayTotal || 0, 'RWF');
    console.log('Week Total:', salesData.stats?.weekTotal || 0, 'RWF');
    console.log('Month Total:', salesData.stats?.monthTotal || 0, 'RWF');
    console.log('\nAnalytics data:');
    console.log('- Weekly Sales:', analyticsData.weeklySales?.length || 0, 'days');
    console.log('- Payment Methods:', analyticsData.paymentBreakdown?.length || 0, 'methods');
    console.log('- Hourly Sales:', analyticsData.hourlySales?.length || 0, 'hours');
    console.log('- Top Categories:', analyticsData.topCategories?.length || 0, 'categories');

  } catch (error) {
    console.error('Error testing APIs:', error.message);
  }
};

testSalesAPI();
