require('dotenv').config();
const axios = require('axios');

async function testRoomAPI() {
  try {
    console.log('🧪 Testing Room API endpoint...');
    
    const baseURL = 'http://localhost:3000/api/v1';
    
    // Test the /api/v1/rooms/list endpoint
    try {
      console.log('Testing /api/v1/rooms/list...');
      const response = await axios.get(`${baseURL}/rooms/list`, {
        headers: {
          'Authorization': 'Bearer test-token' // You might need a real token
        }
      });
      
      console.log('✅ API Response Status:', response.status);
      console.log('✅ API Response Data:', {
        success: response.data.success,
        roomCount: response.data.rooms ? response.data.rooms.length : 0
      });
      
      if (response.data.rooms && response.data.rooms.length > 0) {
        console.log('📋 Sample room from API:');
        const sampleRoom = response.data.rooms[0];
        console.log('  - Room:', sampleRoom.room_number);
        console.log('  - Type:', sampleRoom.room_type);
        console.log('  - Floor:', sampleRoom.floor);
        console.log('  - Status:', sampleRoom.status);
      }
      
    } catch (error) {
      if (error.response) {
        console.log('❌ API Error Status:', error.response.status);
        console.log('❌ API Error Data:', error.response.data);
      } else {
        console.log('❌ Network/Connection Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRoomAPI();
