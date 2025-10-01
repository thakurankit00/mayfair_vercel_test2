require('dotenv').config();
const db = require('./src/config/database');
const { v4: uuidv4 } = require('uuid');

async function createSampleData() {
  try {
    console.log('🏨 Creating sample room data for testing...');
    
    // Check current state
    const existingRooms = await db('rooms').count('* as count').first();
    const existingBookings = await db('room_bookings').count('* as count').first();
    
    console.log(`📊 Current state:`);
    console.log(`  - Existing rooms: ${existingRooms.count}`);
    console.log(`  - Existing bookings: ${existingBookings.count}`);
    
    if (existingRooms.count > 0) {
      console.log('✅ Rooms already exist, skipping room creation');
    } else {
      console.log('🏗️ Creating sample rooms...');
      
      // Create room types first
      const roomTypes = [
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
      
      await db('room_types').insert(roomTypes);
      console.log('✅ Created room types');
      
      // Create rooms
      const sampleRooms = [];
      for (let i = 1; i <= 10; i++) {
        sampleRooms.push({
          id: uuidv4(),
          room_number: `${100 + i}`,
          floor: Math.ceil(i / 5),
          room_type_id: roomTypes[i % 2].id,
          status: 'available'
        });
      }
      
      await db('rooms').insert(sampleRooms);
      console.log('✅ Created 10 sample rooms');
    }
    
    if (existingBookings.count > 0) {
      console.log('✅ Bookings already exist, skipping booking creation');
    } else {
      console.log('📅 Creating sample bookings...');
      
      // Get available rooms and users
      const availableRooms = await db('rooms').select('*').limit(5);
      const availableUsers = await db('users').select('*').limit(3);
      
      if (availableRooms.length === 0 || availableUsers.length === 0) {
        console.log('❌ No rooms or users available for bookings');
        return;
      }
      
      const today = new Date();
      const sampleBookings = [];
      
      for (let i = 0; i < Math.min(3, availableRooms.length); i++) {
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
          status: 'checked_in', // All bookings are checked in
          special_requests: `Sample booking ${i + 1}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      await db('room_bookings').insert(sampleBookings);
      console.log(`✅ Created ${sampleBookings.length} sample bookings (all checked-in)`);
      
      // Update room statuses to occupied
      const roomIds = sampleBookings.map(b => b.room_id);
      await db('rooms').whereIn('id', roomIds).update({ status: 'occupied' });
      console.log(`✅ Updated ${roomIds.length} rooms to 'occupied' status`);
    }
    
    // Verify the results
    const finalRooms = await db('rooms').count('* as count').first();
    const finalBookings = await db('room_bookings').count('* as count').first();
    const occupiedRooms = await db('rooms').where('status', 'occupied').count('* as count').first();
    const checkedInBookings = await db('room_bookings').where('status', 'checked_in').count('* as count').first();
    
    console.log('\n🎉 Sample data creation completed!');
    console.log(`📊 Final state:`);
    console.log(`  - Total rooms: ${finalRooms.count}`);
    console.log(`  - Total bookings: ${finalBookings.count}`);
    console.log(`  - Occupied rooms: ${occupiedRooms.count}`);
    console.log(`  - Checked-in bookings: ${checkedInBookings.count}`);
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await db.destroy();
  }
}

createSampleData();
