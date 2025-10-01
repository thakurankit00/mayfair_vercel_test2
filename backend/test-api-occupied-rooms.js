const axios = require('axios');

async function testOccupiedRoomsAPI() {
  try {
    console.log('🧪 TESTING OCCUPIED ROOMS API');
    console.log('=============================');

    const baseURL = 'http://localhost:3000/api/v1';

    // Test 1: Try without authentication (should fail)
    console.log('\n1. Testing without authentication:');
    try {
      const response = await axios.get(`${baseURL}/rooms/occupied`);
      console.log('❌ Unexpected success:', response.status);
    } catch (error) {
      console.log(`✅ Expected auth error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Test 2: Try with invalid token (should fail)
    console.log('\n2. Testing with invalid token:');
    try {
      const response = await axios.get(`${baseURL}/rooms/occupied`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('❌ Unexpected success:', response.status);
    } catch (error) {
      console.log(`✅ Expected auth error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Test 3: Try to login first to get a valid token
    console.log('\n3. Attempting to login to get valid token:');
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'carlos.waiter@mayfairhotel.com',
        password: 'waiter123'
      });
      
      const token = loginResponse.data.token;
      console.log('✅ Login successful, token obtained');

      // Test 4: Use valid token to get occupied rooms
      console.log('\n4. Testing with valid token:');
      const occupiedResponse = await axios.get(`${baseURL}/rooms/occupied`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ API Response Status:', occupiedResponse.status);
      console.log('✅ API Response Data:', JSON.stringify(occupiedResponse.data, null, 2));

      if (occupiedResponse.data.success && occupiedResponse.data.occupiedRooms) {
        console.log(`✅ Found ${occupiedResponse.data.occupiedRooms.length} occupied rooms`);
        
        occupiedResponse.data.occupiedRooms.forEach((room, index) => {
          console.log(`   ${index + 1}. Room ${room.room_number}: ${room.guest_first_name} ${room.guest_last_name}`);
        });
      } else {
        console.log('❌ Unexpected response format');
      }

    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data?.message || loginError.message);
      
      // Test 5: Try with a test token (if login fails)
      console.log('\n5. Testing with test token (fallback):');
      try {
        const testResponse = await axios.get(`${baseURL}/rooms/occupied`, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        console.log('✅ Test token worked:', testResponse.data);
      } catch (testError) {
        console.log('❌ Test token failed:', testError.response?.data?.message || testError.message);
      }
    }

    console.log('\n🎯 API TEST COMPLETE');
    console.log('====================');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testOccupiedRoomsAPI();
