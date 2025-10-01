require('dotenv').config();
const db = require('./src/config/database');

async function quickTest() {
  try {
    console.log('🧪 Quick database test...');
    
    // Check room counts
    const roomCount = await db('rooms').count('* as count').first();
    const bookingCount = await db('room_bookings').count('* as count').first();
    const roomTypeCount = await db('room_types').count('* as count').first();
    
    console.log(`📊 Current counts:`);
    console.log(`  - Room types: ${roomTypeCount.count}`);
    console.log(`  - Rooms: ${roomCount.count}`);
    console.log(`  - Bookings: ${bookingCount.count}`);
    
    if (roomCount.count === '0') {
      console.log('🏗️ Creating sample data...');
      
      // Create room types
      const roomTypeId1 = 'rt-' + Date.now() + '-1';
      const roomTypeId2 = 'rt-' + Date.now() + '-2';
      
      await db('room_types').insert([
        {
          id: roomTypeId1,
          name: 'Standard Room',
          description: 'Comfortable standard room',
          base_price: 150.00,
          max_occupancy: 2,
          amenities: JSON.stringify(['WiFi', 'TV', 'AC']),
          is_active: true
        },
        {
          id: roomTypeId2,
          name: 'Deluxe Room',
          description: 'Spacious deluxe room',
          base_price: 250.00,
          max_occupancy: 4,
          amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Balcony']),
          is_active: true
        }
      ]);
      
      // Create rooms
      const roomIds = [];
      for (let i = 1; i <= 5; i++) {
        const roomId = 'room-' + Date.now() + '-' + i;
        roomIds.push(roomId);
        await db('rooms').insert({
          id: roomId,
          room_number: `10${i}`,
          floor: 1,
          room_type_id: i % 2 === 0 ? roomTypeId2 : roomTypeId1,
          status: 'available'
        });
      }
      
      // Get a user for bookings
      const user = await db('users').select('id').first();
      if (user) {
        // Create sample bookings (2 checked-in)
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 2);
        
        for (let i = 0; i < 2; i++) {
          await db('room_bookings').insert({
            id: 'booking-' + Date.now() + '-' + i,
            booking_reference: 'BK' + Date.now() + i,
            room_id: roomIds[i],
            user_id: user.id,
            check_in_date: yesterday.toISOString().split('T')[0],
            check_out_date: tomorrow.toISOString().split('T')[0],
            adults: 2,
            children: 0,
            total_amount: 300.00,
            paid_amount: 0.00,
            status: 'checked_in',
            special_requests: `Sample booking ${i + 1}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          // Update room status to occupied
          await db('rooms').where('id', roomIds[i]).update({ status: 'occupied' });
        }
        
        console.log('✅ Sample data created successfully!');
      } else {
        console.log('❌ No users found for creating bookings');
      }
    }
    
    // Final check
    const finalRoomCount = await db('rooms').count('* as count').first();
    const finalBookingCount = await db('room_bookings').count('* as count').first();
    const occupiedCount = await db('rooms').where('status', 'occupied').count('* as count').first();
    const checkedInCount = await db('room_bookings').where('status', 'checked_in').count('* as count').first();
    
    console.log(`\n🎉 Final state:`);
    console.log(`  - Total rooms: ${finalRoomCount.count}`);
    console.log(`  - Total bookings: ${finalBookingCount.count}`);
    console.log(`  - Occupied rooms: ${occupiedCount.count}`);
    console.log(`  - Checked-in bookings: ${checkedInCount.count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

quickTest();
