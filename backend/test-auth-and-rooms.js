require('dotenv').config();
const db = require('./src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testAuthAndRooms() {
  try {
    console.log('🔐 TESTING AUTHENTICATION & OCCUPIED ROOMS');
    console.log('==========================================');

    // 1. Check existing users
    console.log('\n1. Checking existing users:');
    const users = await db('users').select('id', 'email', 'role', 'is_active');
    console.log(`   Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Active: ${user.is_active}`);
    });

    // 2. Create a test waiter user if none exists
    let testUser = users.find(u => u.role === 'waiter' && u.is_active);
    
    if (!testUser) {
      console.log('\n2. Creating test waiter user:');
      const hashedPassword = await bcrypt.hash('waiter123', 10);
      
      const [userId] = await db('users').insert({
        email: 'test.waiter@mayfairhotel.com',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'Waiter',
        role: 'waiter',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('id');

      testUser = await db('users').where('id', userId).first();
      console.log(`   ✅ Created test user: ${testUser.email}`);
    } else {
      console.log(`\n2. Using existing waiter: ${testUser.email}`);
    }

    // 3. Generate a valid JWT token
    console.log('\n3. Generating JWT token:');
    const token = jwt.sign(
      {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    console.log('   ✅ JWT token generated');

    // 4. Test the occupied rooms API with the valid token
    console.log('\n4. Testing occupied rooms API:');
    try {
      const response = await axios.get('http://localhost:3000/api/v1/rooms/occupied', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('   ✅ API Response Status:', response.status);
      console.log('   ✅ API Response:', JSON.stringify(response.data, null, 2));

      if (response.data.success && response.data.occupiedRooms) {
        console.log(`   ✅ Found ${response.data.occupiedRooms.length} occupied rooms:`);
        
        response.data.occupiedRooms.forEach((room, index) => {
          console.log(`      ${index + 1}. Room ${room.room_number}: ${room.guest_first_name} ${room.guest_last_name}`);
          console.log(`         Phone: ${room.guest_phone || 'N/A'}`);
          console.log(`         Check-in: ${room.check_in_date}`);
        });
      }

    } catch (apiError) {
      console.log('   ❌ API Error:', apiError.response?.status, apiError.response?.data?.message || apiError.message);
    }

    // 5. Test login endpoint
    console.log('\n5. Testing login endpoint:');
    try {
      const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
        email: testUser.email,
        password: 'waiter123'
      });

      console.log('   ✅ Login successful');
      console.log('   ✅ Login response:', {
        success: loginResponse.data.success,
        user: loginResponse.data.user?.email,
        role: loginResponse.data.user?.role,
        tokenPresent: !!loginResponse.data.token
      });

      // Test with login token
      const loginToken = loginResponse.data.token;
      const roomsResponse = await axios.get('http://localhost:3000/api/v1/rooms/occupied', {
        headers: {
          'Authorization': `Bearer ${loginToken}`
        }
      });

      console.log('   ✅ Rooms API with login token:', {
        status: roomsResponse.status,
        occupiedCount: roomsResponse.data.occupiedRooms?.length || 0
      });

    } catch (loginError) {
      console.log('   ❌ Login failed:', loginError.response?.data?.message || loginError.message);
    }

    console.log('\n🎯 AUTHENTICATION & API TEST COMPLETE');
    console.log('=====================================');
    console.log('\n💡 SOLUTION FOR FRONTEND:');
    console.log('1. Ensure user is properly logged in');
    console.log('2. Check that JWT token is being sent correctly');
    console.log('3. Verify token is not expired');
    console.log('4. Check browser console for detailed error messages');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    process.exit(0);
  }
}

testAuthAndRooms();
