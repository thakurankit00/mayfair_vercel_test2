require('dotenv').config();
const axios = require('axios');

async function testDashboardAPI() {
  try {
    console.log('🧪 TESTING DASHBOARD API AFTER CLEANUP');
    console.log('======================================\n');

    // Test the dashboard metrics endpoint
    const response = await axios.get('http://localhost:3000/api/v1/dashboard/metrics', {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Dashboard API Response:');
    console.log('Status:', response.status);
    
    if (response.data && response.data.rooms) {
      const rooms = response.data.rooms;
      console.log('\n🏨 Room Metrics:');
      console.log(`  Total Rooms: ${rooms.total}`);
      console.log(`  Available Rooms: ${rooms.available}`);
      console.log(`  Booked Rooms: ${rooms.booked}`);
      console.log(`  Room Types: ${rooms.roomTypes}`);
      
      if (rooms.available > 0) {
        console.log('\n✅ SUCCESS! API now shows available rooms');
        console.log('🎉 The frontend should display correct availability');
      } else {
        console.log('\n❌ Issue persists - API still shows 0 available rooms');
      }
    } else {
      console.log('\n⚠️ Unexpected API response structure');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to backend server');
      console.log('💡 Make sure the backend server is running on port 3000');
    } else if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.statusText);
      console.log('Response:', error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

testDashboardAPI();
