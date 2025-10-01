require('dotenv').config();
const db = require('./src/config/database');
const { v4: uuidv4 } = require('uuid');

async function createSampleBookings() {
  try {
    console.log('🏨 Creating sample room bookings for testing...');

    // First, check if we have rooms and room types
    const rooms = await db('rooms').select('*').limit(5);
    const roomTypes = await db('room_types').select('*').limit(3);
    const users = await db('users').select('*').limit(3);

    console.log('📊 Database status:');
    console.log(`  - Rooms: ${rooms.length}`);
    console.log(`  - Room types: ${roomTypes.length}`);
    console.log(`  - Users: ${users.length}`);

    if (rooms.length === 0) {
      console.log('❌ No rooms found. Creating sample rooms first...');

      // Create room types if they don't exist
      if (roomTypes.length === 0) {
        const sampleRoomTypes = [
          {
            id: uuidv4(),
            name: 'Standard Room',
            description: 'Comfortable standard room with modern amenities',
            base_price: 150.00,
            max_occupancy: 2,
            amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar']),
            is_active: true
          },
          {
            id: uuidv4(),
            name: 'Deluxe Room',
            description: 'Spacious deluxe room with city view',
            base_price: 250.00,
            max_occupancy: 4,
            amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony']),
            is_active: true
          }
        ];

        await db('room_types').insert(sampleRoomTypes);
        console.log('✅ Created sample room types');
      }

      // Create sample rooms
      const roomTypesForRooms = await db('room_types').select('*').limit(2);
      const sampleRooms = [];

      for (let i = 1; i <= 10; i++) {
        sampleRooms.push({
          id: uuidv4(),
          room_number: `${100 + i}`,
          floor: Math.ceil(i / 5),
          room_type_id: roomTypesForRooms[i % 2].id,
          status: 'available'
        });
      }

      await db('rooms').insert(sampleRooms);
      console.log('✅ Created sample rooms');
    }
    
    // Check existing bookings
    const existingBookings = await db('room_bookings').select('*');
    console.log(`📋 Existing bookings: ${existingBookings.length}`);
    
    if (existingBookings.length > 0) {
      console.log('ℹ️ Bookings already exist. Checking their status...');
      
      const statusCounts = await db('room_bookings')
        .select('status')
        .count('* as count')
        .groupBy('status');
      
      statusCounts.forEach(s => {
        console.log(`  - ${s.status}: ${s.count}`);
      });
      
      // Check if we have any checked_in bookings
      const checkedInBookings = await db('room_bookings')
        .where('status', 'checked_in')
        .count('* as count')
        .first();
      
      if (checkedInBookings.count == 0) {
        console.log('⚠️ No checked-in bookings found. Creating some...');
        
        // Update some existing bookings to checked_in status
        const bookingsToUpdate = await db('room_bookings')
          .select('*')
          .whereIn('status', ['confirmed', 'pending'])
          .limit(3);
        
        for (const booking of bookingsToUpdate) {
          await db('room_bookings')
            .where('id', booking.id)
            .update({ status: 'checked_in' });
          
          // Update room status to occupied
          await db('rooms')
            .where('id', booking.room_id)
            .update({ status: 'occupied' });
        }
        
        console.log(`✅ Updated ${bookingsToUpdate.length} bookings to checked_in status`);
      }
    } else {
      console.log('📝 Creating sample bookings...');
      
      // Get fresh data after potential creation
      const availableRooms = await db('rooms').select('*').limit(5);
      const availableUsers = await db('users').select('*').limit(3);
      
      if (availableUsers.length === 0) {
        console.log('❌ No users found. Cannot create bookings without users.');
        return;
      }
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(today.getDate() + 2);
      
      const sampleBookings = [];

      for (let i = 0; i < Math.min(5, availableRooms.length); i++) {
        const room = availableRooms[i];
        const user = availableUsers[i % availableUsers.length];

        const checkInDate = new Date(today);
        checkInDate.setDate(today.getDate() - 1); // Yesterday

        const checkOutDate = new Date(today);
        checkOutDate.setDate(today.getDate() + 2); // Day after tomorrow

        sampleBookings.push({
          id: uuidv4(),
          booking_reference: `BK${Date.now()}${i}`,
          room_id: room.id,
          user_id: user.id,
          check_in_date: checkInDate.toISOString().split('T')[0],
          check_out_date: checkOutDate.toISOString().split('T')[0],
          adults: 2,
          children: 0,
          total_amount: 300.00,
          paid_amount: 0.00,
          status: i < 3 ? 'checked_in' : 'confirmed', // First 3 are checked in
          special_requests: `Sample booking ${i + 1}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      await db('room_bookings').insert(sampleBookings);
      console.log(`✅ Created ${sampleBookings.length} sample bookings`);
      
      // Update room statuses for checked-in bookings
      for (let i = 0; i < 3 && i < sampleBookings.length; i++) {
        await db('rooms')
          .where('id', sampleBookings[i].room_id)
          .update({ status: 'occupied' });
      }
      
      console.log('✅ Updated room statuses for checked-in bookings');
    }
    
    // Final verification
    console.log('\n🔍 Final verification:');
    
    const finalBookings = await db('room_bookings').count('* as count').first();
    const checkedInCount = await db('room_bookings').where('status', 'checked_in').count('* as count').first();
    const occupiedRooms = await db('room_bookings as rb')
      .select('rb.id', 'r.room_number', 'rb.status')
      .join('rooms as r', 'rb.room_id', 'r.id')
      .where('rb.status', 'checked_in');
    
    console.log(`📊 Total bookings: ${finalBookings.count}`);
    console.log(`🏨 Checked-in bookings: ${checkedInCount.count}`);
    console.log(`🏠 Occupied rooms: ${occupiedRooms.length}`);
    
    if (occupiedRooms.length > 0) {
      console.log('✅ Occupied rooms:');
      occupiedRooms.forEach(room => {
        console.log(`  - Room ${room.room_number} (${room.status})`);
      });
    }
    
    console.log('\n🎉 Sample booking creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating sample bookings:', error);
  } finally {
    await db.destroy();
  }
}

createSampleBookings();
