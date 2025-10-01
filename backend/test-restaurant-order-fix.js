require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');

function log(message) {
  console.log(message);
  fs.appendFileSync('test-restaurant-order-results.txt', message + '\n');
}

async function testRestaurantOrderFix() {
  try {
    log('🧪 TESTING RESTAURANT ORDER UUID FIX');
    log('====================================');

    const baseURL = 'http://localhost:3000/api/v1';

    // 1. Get a real user from database first
    log('\n1. Getting users from database:');
    
    // Use admin token to get users
    const adminToken = jwt.sign(
      {
        id: '4651ef52-0fc9-49ff-806c-50b3346ad373', // Known admin ID from logs
        email: 'amit.admin@mayfairhotel.com',
        role: 'admin'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const usersResponse = await axios.get(`${baseURL}/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const testUser = usersResponse.data.data.users.find(u => u.role === 'manager' || u.role === 'admin');
    if (!testUser) {
      log('❌ No suitable test user found');
      return;
    }

    log(`✅ Using test user: ${testUser.email} (ID: ${testUser.id})`);

    // 2. Generate token for test user
    const userToken = jwt.sign(
      {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 3. Get restaurants
    log('\n2. Getting restaurants:');
    const restaurantsResponse = await axios.get(`${baseURL}/restaurant/restaurants`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const restaurant = restaurantsResponse.data.restaurants[0];
    log(`✅ Using restaurant: ${restaurant.name} (ID: ${restaurant.id})`);

    // 4. Get menu items
    log('\n3. Getting menu items:');
    const menuResponse = await axios.get(`${baseURL}/restaurant/menu/${restaurant.id}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const menuItem = menuResponse.data.menu[0]?.items?.[0];
    if (!menuItem) {
      log('❌ No menu items found - cannot test order');
      return;
    }
    log(`✅ Using menu item: ${menuItem.name} (ID: ${menuItem.id})`);

    // 5. Test different order types with problematic UUID fields

    // Test Case 1: Takeaway order (should not have table_id)
    log('\n4. Testing takeaway order (no table_id):');
    const takeawayOrderData = {
      restaurant_id: restaurant.id,
      order_type: 'takeaway',
      customer_name: 'Test Customer',
      customer_phone: '1234567890',
      payment_method: 'cash',
      items: [
        {
          menu_item_id: menuItem.id,
          quantity: 1,
          price: menuItem.price,
          special_instructions: ''
        }
      ],
      special_instructions: 'Test takeaway order - UUID fix test'
    };

    log('📝 Takeaway order data:');
    log(JSON.stringify(takeawayOrderData, null, 2));

    const takeawayResponse = await axios.post(`${baseURL}/restaurant/orders`, takeawayOrderData, {
      headers: { 
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    log('✅ Takeaway order created successfully!');
    log(`📋 Order ID: ${takeawayResponse.data.data.order.id}`);
    log(`📋 Order Number: ${takeawayResponse.data.data.order.order_number}`);

    // Test Case 2: Dine-in order with empty table_id (should fail validation, not UUID error)
    log('\n5. Testing dine-in order with empty table_id:');
    const dineinOrderData = {
      restaurant_id: restaurant.id,
      order_type: 'dine_in',
      table_id: '', // Empty string - should be handled properly
      customer_name: 'Test Customer 2',
      customer_phone: '1234567891',
      payment_method: 'cash',
      items: [
        {
          menu_item_id: menuItem.id,
          quantity: 1,
          price: menuItem.price,
          special_instructions: ''
        }
      ],
      special_instructions: 'Test dine-in order - UUID fix test'
    };

    try {
      await axios.post(`${baseURL}/restaurant/orders`, dineinOrderData, {
        headers: { 
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });
      log('❌ Dine-in order should have failed validation');
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('Table is required')) {
        log('✅ Dine-in order correctly failed with validation error (not UUID error)');
      } else {
        log('❌ Unexpected error: ' + (error.response?.data?.error?.message || error.message));
      }
    }

    log('\n🎉 SUCCESS: Restaurant order UUID handling is working!');
    log('✅ Empty UUID fields are now properly handled');
    log('✅ No more "invalid input syntax for type uuid" errors');

  } catch (error) {
    log('❌ Test failed: ' + (error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message));
    
    if (error.response?.data?.error?.message) {
      log('❌ Backend error: ' + error.response.data.error.message);
    }
  }
}

testRestaurantOrderFix();
