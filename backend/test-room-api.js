require('dotenv').config();
const axios = require('axios');
const db = require('./src/config/database');

async function testRoomAPI() {
  try {
    console.log('🧪 Testing Room API endpoints...');
    
    // First check database directly
    console.log('\n📊 Database check:');
    const roomCount = await db('rooms').count('* as count').first();
    const roomTypeCount = await db('room_types').count('* as count').first();
    const bookingCount = await db('room_bookings').count('* as count').first();
    
    console.log(`  - Room types: ${roomTypeCount.count}`);
    console.log(`  - Rooms: ${roomCount.count}`);
    console.log(`  - Bookings: ${bookingCount.count}`);
    
    if (roomCount.count > 0) {
      console.log('\n🏨 Sample rooms from database:');
      const rooms = await db('rooms as r')
        .select('r.room_number', 'r.floor', 'r.status', 'rt.name as room_type')
        .join('room_types as rt', 'r.room_type_id', 'rt.id')
        .limit(5);
      rooms.forEach(room => {
        console.log(`  - Room ${room.room_number} (${room.room_type}) - Floor ${room.floor} - ${room.status}`);
      });
    }
    
    // Test API endpoints
    const baseURL = 'http://localhost:3000/api/v1';
    
    console.log('\n🌐 Testing API endpoints:');
    
    try {
      console.log('Testing /api/v1/rooms/list...');
      const roomsResponse = await axios.get(`${baseURL}/rooms/list`);
      console.log('✅ /api/v1/rooms/list response:', {
        status: roomsResponse.status,
        success: roomsResponse.data.success,
        roomCount: roomsResponse.data.rooms ? roomsResponse.data.rooms.length : 0
      });
      
      if (roomsResponse.data.rooms && roomsResponse.data.rooms.length > 0) {
        console.log('📋 Sample room from API:', roomsResponse.data.rooms[0]);
      }
    } catch (error) {
      console.log('❌ /api/v1/rooms/list failed:', error.message);
    }
    
    try {
      console.log('Testing /api/v1/rooms/occupied...');
      const occupiedResponse = await axios.get(`${baseURL}/rooms/occupied`);
      console.log('✅ /api/v1/rooms/occupied response:', {
        status: occupiedResponse.status,
        success: occupiedResponse.data.success,
        occupiedCount: occupiedResponse.data.occupiedRooms ? occupiedResponse.data.occupiedRooms.length : 0
      });
    } catch (error) {
      console.log('❌ /api/v1/rooms/occupied failed:', error.message);
    }
    
    try {
      console.log('Testing /api/v1/rooms/types...');
      const typesResponse = await axios.get(`${baseURL}/rooms/types`);
      console.log('✅ /api/v1/rooms/types response:', {
        status: typesResponse.status,
        typeCount: Array.isArray(typesResponse.data) ? typesResponse.data.length : 0
      });
    } catch (error) {
      console.log('❌ /api/v1/rooms/types failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.destroy();
  }
}

testRoomAPI();
