require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');

function log(message) {
  console.log(message);
  fs.appendFileSync('test-results.txt', message + '\n');
}

async function testRoomServiceOrder() {
  try {
    log('🧪 TESTING ROOM SERVICE ORDER CREATION');
    log('======================================');

    const baseURL = 'http://localhost:3000/api/v1';

    // 1. Generate a valid JWT token for waiter
    const token = jwt.sign(
      {
        id: 'test-waiter-id',
        email: 'carlos.waiter@mayfairhotel.com',
        role: 'waiter'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    log('✅ JWT token generated for waiter');

    // 2. Get occupied rooms first
    log('\n1. Getting occupied rooms:');
    const roomsResponse = await axios.get(`${baseURL}/rooms/occupied`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    log(`✅ Found ${roomsResponse.data.rooms.length} occupied rooms`);

    if (roomsResponse.data.rooms.length === 0) {
      log('❌ No occupied rooms found - cannot test room service order');
      return;
    }

    const testRoom = roomsResponse.data.rooms[0];
    log(`✅ Using test room: ${testRoom.room_number} (Booking ID: ${testRoom.id})`);

    // 3. Get restaurants
    log('\n2. Getting restaurants:');
    const restaurantsResponse = await axios.get(`${baseURL}/restaurant/restaurants`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const restaurant = restaurantsResponse.data.restaurants[0];
    log(`✅ Using restaurant: ${restaurant.name} (ID: ${restaurant.id})`);

    // 4. Get menu items
    log('\n3. Getting menu items:');
    const menuResponse = await axios.get(`${baseURL}/restaurant/menu/${restaurant.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const menuItem = menuResponse.data.menu[0]?.items?.[0];
    if (!menuItem) {
      log('❌ No menu items found - cannot test order');
      return;
    }
    log(`✅ Using menu item: ${menuItem.name} (ID: ${menuItem.id})`);

    // 5. Create room service order with correct format
    log('\n4. Creating room service order:');
    const orderData = {
      restaurant_id: restaurant.id,
      order_type: 'room_service', // ✅ Using underscore format
      room_booking_id: testRoom.id, // ✅ Using booking ID
      room_number: testRoom.room_number, // ✅ Also providing room number
      guest_name: `${testRoom.guest_first_name} ${testRoom.guest_last_name}`,
      customer_info: {
        firstName: testRoom.guest_first_name,
        lastName: testRoom.guest_last_name,
        phone: testRoom.guest_phone,
        email: testRoom.guest_email
      },
      items: [
        {
          menu_item_id: menuItem.id,
          quantity: 2,
          special_instructions: 'Test room service order'
        }
      ],
      special_instructions: 'This is a test room service order from automated test'
    };

    log('📝 Order data:');
    log(JSON.stringify(orderData, null, 2));

    const orderResponse = await axios.post(`${baseURL}/restaurant/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    log('✅ Room service order created successfully!');
    log('📋 Order details:');
    log(JSON.stringify({
      orderId: orderResponse.data.data.order.id,
      orderNumber: orderResponse.data.data.order.order_number,
      status: orderResponse.data.data.order.status,
      orderType: orderResponse.data.data.order.order_type,
      roomNumber: orderResponse.data.data.order.room_number,
      totalAmount: orderResponse.data.data.order.total_amount
    }, null, 2));

    log('\n🎉 SUCCESS: Room service order validation is working!');
    log('✅ Frontend should now be able to create room service orders');

  } catch (error) {
    log('❌ Test failed: ' + (error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message));

    if (error.response?.data?.error?.message) {
      log('❌ Backend error: ' + error.response.data.error.message);
    }
  }
}

testRoomServiceOrder();
