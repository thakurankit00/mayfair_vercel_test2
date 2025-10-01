require('dotenv').config();
const axios = require('axios');

async function testChefDashboardAPI() {
  try {
    console.log('🧪 Testing Chef Dashboard API...\n');

    // First, login as chef to get token
    console.log('1. Logging in as chef...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'anna.chef@mayfairhotel.com',
      password: 'chef123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Failed to login as chef');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Chef login successful');

    // Test the kitchen dashboard endpoint
    console.log('\n2. Fetching kitchen dashboard data...');
    const dashboardResponse = await axios.get('http://localhost:3000/api/v1/restaurant/kitchen/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (dashboardResponse.data.success) {
      const data = dashboardResponse.data.data;
      console.log(`✅ Kitchen dashboard API returned ${data.orders.length} orders`);
      console.log(`📊 Stats:`, data.stats);
      
      if (data.orders.length > 0) {
        console.log('\n📋 Orders in dashboard:');
        data.orders.forEach((order, index) => {
          console.log(`${index + 1}. ${order.orderNumber} (${order.orderType})`);
          console.log(`   - Status: ${order.status}, Kitchen Status: ${order.kitchen_status}`);
          console.log(`   - Customer: ${order.customerName}`);
          console.log(`   - Table: ${order.tableNumber || 'Takeaway'}`);
          console.log(`   - Items: ${order.items ? order.items.length : 0}`);
          console.log('');
        });

        // Check specifically for takeaway orders
        const takeawayOrders = data.orders.filter(o => o.orderType === 'takeaway');
        console.log(`🥡 Takeaway orders in dashboard: ${takeawayOrders.length}`);
        
        if (takeawayOrders.length > 0) {
          console.log('✅ SUCCESS: Takeaway orders are appearing in chef dashboard!');
        } else {
          console.log('❌ ISSUE: No takeaway orders found in chef dashboard');
        }
      } else {
        console.log('❌ No orders found in dashboard');
      }
    } else {
      console.log('❌ Failed to fetch kitchen dashboard');
      console.log('Error:', dashboardResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Error testing chef dashboard API:', error.response?.data || error.message);
  }
}

testChefDashboardAPI();
