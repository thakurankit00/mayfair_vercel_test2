const axios = require('axios');

async function testChefAPI() {
  try {
    console.log('🔍 Testing chef API endpoint...');
    
    // First, login as the chef
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'anna.chef@mayfairhotel.com',
      password: 'password'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Failed to login as chef');
      return;
    }
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log(`✅ Logged in as: ${user.firstName} ${user.lastName} (${user.role})`);
    
    // Test the orders endpoint
    const ordersResponse = await axios.get('http://localhost:3000/api/v1/restaurant/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!ordersResponse.data.success) {
      console.log('❌ Failed to fetch orders');
      console.log('Error:', ordersResponse.data.error);
      return;
    }
    
    const orders = ordersResponse.data.data.orders;
    console.log(`\n🍳 API returned ${orders.length} orders for chef`);
    
    if (orders.length > 0) {
      console.log('\n🍳 Orders from API:');
      orders.forEach(order => {
        console.log(`   ✅ Order #${order.orderNumber || order.order_number} - Table ${order.tableNumber || order.table_number} - Status: ${order.status}`);
        console.log(`      Type: ${order.orderType || order.order_type}, Kitchen: ${order.targetKitchenId || order.target_kitchen_id}`);
      });
    } else {
      console.log('   No orders returned from API');
    }
    
    // Test kitchen dashboard endpoint
    console.log('\n🔍 Testing kitchen dashboard endpoint...');
    
    const dashboardResponse = await axios.get('http://localhost:3000/api/v1/restaurant/kitchen/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (dashboardResponse.data.success) {
      const dashboardData = dashboardResponse.data.data;
      console.log(`✅ Kitchen dashboard returned ${dashboardData.orders.length} orders`);
      console.log(`   Stats: ${JSON.stringify(dashboardData.stats)}`);
    } else {
      console.log('❌ Failed to fetch kitchen dashboard');
      console.log('Error:', dashboardResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing chef API:', error.response?.data || error.message);
  }
}

// Run the script
testChefAPI();
