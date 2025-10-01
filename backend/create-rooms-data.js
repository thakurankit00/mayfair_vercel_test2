require('dotenv').config();
const db = require('./src/config/database');
const { v4: uuidv4 } = require('uuid');

async function createRoomsData() {
  try {
    console.log('🏨 Creating room data for hotel management system...');
    
    // Check if data already exists
    const existingRooms = await db('rooms').count('* as count').first();
    const existingRoomTypes = await db('room_types').count('* as count').first();
    
    console.log('📊 Current state:');
    console.log(`  - Room types: ${existingRoomTypes.count}`);
    console.log(`  - Rooms: ${existingRooms.count}`);
    
    // Create room types if they don't exist
    if (existingRoomTypes.count === '0') {
      console.log('🏗️ Creating room types...');
      
      const roomTypes = [
        {
          id: uuidv4(),
          name: 'Standard Room',
          description: 'Comfortable standard room with modern amenities',
          base_price: 150.00,
          max_occupancy: 2,
          amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar', 'Room Service']),
          is_active: true
        },
        {
          id: uuidv4(),
          name: 'Deluxe Room',
          description: 'Spacious deluxe room with city view and premium amenities',
          base_price: 250.00,
          max_occupancy: 4,
          amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Room Service', 'Premium Bedding']),
          is_active: true
        },
        {
          id: uuidv4(),
          name: 'Suite',
          description: 'Luxurious suite with separate living area and premium services',
          base_price: 450.00,
          max_occupancy: 6,
          amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Room Service', 'Premium Bedding', 'Living Area', 'Kitchenette']),
          is_active: true
        }
      ];
      
      await db('room_types').insert(roomTypes);
      console.log(`✅ Created ${roomTypes.length} room types`);
    }
    
    // Create rooms if they don't exist
    if (existingRooms.count === '0') {
      console.log('🏗️ Creating rooms...');
      
      const roomTypes = await db('room_types').select('*');
      const rooms = [];
      
      // Create rooms on different floors
      for (let floor = 1; floor <= 3; floor++) {
        for (let roomNum = 1; roomNum <= 10; roomNum++) {
          const roomNumber = `${floor}${roomNum.toString().padStart(2, '0')}`;
          const roomTypeIndex = (floor + roomNum) % roomTypes.length;
          
          rooms.push({
            id: uuidv4(),
            room_number: roomNumber,
            floor: floor,
            room_type_id: roomTypes[roomTypeIndex].id,
            status: 'available',
            is_active: true
          });
        }
      }
      
      await db('rooms').insert(rooms);
      console.log(`✅ Created ${rooms.length} rooms across ${3} floors`);
    }
    
    // Create some sample bookings to show occupied rooms
    const existingBookings = await db('room_bookings').count('* as count').first();
    if (existingBookings.count === '0') {
      console.log('📅 Creating sample bookings...');
      
      const availableRooms = await db('rooms').select('*').limit(5);
      const users = await db('users').select('*').limit(3);
      
      if (availableRooms.length > 0 && users.length > 0) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 3);
        
        const bookings = [];
        for (let i = 0; i < Math.min(3, availableRooms.length); i++) {
          const room = availableRooms[i];
          const user = users[i % users.length];
          
          bookings.push({
            id: uuidv4(),
            booking_reference: `BK${Date.now()}${i}`,
            room_id: room.id,
            user_id: user.id,
            check_in_date: yesterday.toISOString().split('T')[0],
            check_out_date: tomorrow.toISOString().split('T')[0],
            adults: 2,
            children: 0,
            total_amount: 450.00,
            paid_amount: 0.00,
            status: 'checked_in',
            special_requests: `Sample booking for room ${room.room_number}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        await db('room_bookings').insert(bookings);
        console.log(`✅ Created ${bookings.length} sample bookings`);
        
        // Update room statuses to occupied
        const bookedRoomIds = bookings.map(b => b.room_id);
        await db('rooms').whereIn('id', bookedRoomIds).update({ status: 'occupied' });
        console.log(`✅ Updated ${bookedRoomIds.length} rooms to occupied status`);
      }
    }
    
    // Final verification
    const finalRoomTypes = await db('room_types').count('* as count').first();
    const finalRooms = await db('rooms').count('* as count').first();
    const finalBookings = await db('room_bookings').count('* as count').first();
    const occupiedRooms = await db('rooms').where('status', 'occupied').count('* as count').first();
    const availableRooms = await db('rooms').where('status', 'available').count('* as count').first();
    
    console.log('\n🎉 Room data creation completed!');
    console.log('📊 Final database state:');
    console.log(`  - Room types: ${finalRoomTypes.count}`);
    console.log(`  - Total rooms: ${finalRooms.count}`);
    console.log(`  - Available rooms: ${availableRooms.count}`);
    console.log(`  - Occupied rooms: ${occupiedRooms.count}`);
    console.log(`  - Active bookings: ${finalBookings.count}`);
    
    // Show sample room data
    console.log('\n🏨 Sample rooms:');
    const sampleRooms = await db('rooms as r')
      .select('r.room_number', 'r.floor', 'r.status', 'rt.name as room_type')
      .join('room_types as rt', 'r.room_type_id', 'rt.id')
      .limit(10);
    
    sampleRooms.forEach(room => {
      console.log(`  - Room ${room.room_number} (${room.room_type}) - Floor ${room.floor} - ${room.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating room data:', error);
  } finally {
    await db.destroy();
  }
}

createRoomsData();
