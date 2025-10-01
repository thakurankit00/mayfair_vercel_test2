const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

const testAPIs = async () => {
  console.log('🧪 Testing Restaurant APIs...\n');

  try {
    // Test Menu API (public)
    console.log('1. Testing Menu API...');
    const menuResponse = await axios.get(`${BASE_URL}/restaurant/menu`);
    console.log(`   ✅ Menu API: ${menuResponse.data.data.totalCategories} categories, ${menuResponse.data.data.totalItems} items`);

    // Test Menu Categories API (public)
    console.log('2. Testing Menu Categories API...');
    const categoriesResponse = await axios.get(`${BASE_URL}/restaurant/menu/categories`);
    console.log(`   ✅ Categories API: ${categoriesResponse.data.data.categories.length} categories`);

    // Test login to get token for protected endpoints
    console.log('3. Testing Authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'amit.admin@mayfairhotel.com',
      password: 'password'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('   ✅ Authentication successful');

      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Test Tables API (protected)
      console.log('4. Testing Tables API...');
      try {
        const tablesResponse = await axios.get(`${BASE_URL}/restaurant/tables`, { headers: authHeaders });
        console.log(`   ✅ Tables API: ${tablesResponse.data.data.tables.length} tables`);
      } catch (error) {
        console.log(`   ❌ Tables API failed: ${error.response?.data?.error?.message || error.message}`);
      }

      // Test Reservations API (protected)
      console.log('5. Testing Reservations API...');
      try {
        const reservationsResponse = await axios.get(`${BASE_URL}/restaurant/reservations`, { headers: authHeaders });
        console.log(`   ✅ Reservations API: ${reservationsResponse.data.data.reservations.length} reservations`);
      } catch (error) {
        console.log(`   ❌ Reservations API failed: ${error.response?.data?.error?.message || error.message}`);
      }

      // Test Orders API (protected)
      console.log('6. Testing Orders API...');
      try {
        const ordersResponse = await axios.get(`${BASE_URL}/restaurant/orders`, { headers: authHeaders });
        console.log(`   ✅ Orders API: ${ordersResponse.data.data.orders.length} orders`);
      } catch (error) {
        console.log(`   ❌ Orders API failed: ${error.response?.data?.error?.message || error.message}`);
      }

    } else {
      console.log('   ❌ Authentication failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }

  console.log('\n🏁 API testing completed!');
};

testAPIs();
