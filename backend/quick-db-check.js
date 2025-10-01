require('dotenv').config();
const db = require('./src/config/database');
const { v4: uuidv4 } = require('uuid');

async function quickCheck() {
  try {
    console.log('🔍 Quick database check...');
    
    // Check counts
    const roomCount = await db('rooms').count('* as count').first();
    const roomTypeCount = await db('room_types').count('* as count').first();
    
    console.log(`Room types: ${roomTypeCount.count}, Rooms: ${roomCount.count}`);
    
    // If no data, create minimal data
    if (roomTypeCount.count === '0') {
      console.log('Creating room type...');
      await db('room_types').insert({
        id: uuidv4(),
        name: 'Standard Room',
        description: 'Standard room',
        base_price: 150.00,
        max_occupancy: 2,
        amenities: JSON.stringify(['WiFi', 'TV']),
        is_active: true
      });
    }
    
    if (roomCount.count === '0') {
      console.log('Creating rooms...');
      const roomType = await db('room_types').first();
      const rooms = [];
      for (let i = 101; i <= 105; i++) {
        rooms.push({
          id: uuidv4(),
          room_number: i.toString(),
          floor: 1,
          room_type_id: roomType.id,
          status: 'available',
          is_active: true
        });
      }
      await db('rooms').insert(rooms);
    }
    
    // Show final state
    const finalRoomCount = await db('rooms').count('* as count').first();
    const finalRoomTypeCount = await db('room_types').count('* as count').first();
    console.log(`✅ Final: Room types: ${finalRoomTypeCount.count}, Rooms: ${finalRoomCount.count}`);
    
    // Test the getRooms query
    console.log('🧪 Testing getRooms query...');
    const rooms = await db('rooms as r')
      .select(
        'r.id',
        'r.room_number',
        'r.floor',
        'r.status',
        'rt.name as room_type',
        'rt.name as room_type_name',
        'rt.id as room_type_id',
        'rt.base_price',
        'rt.max_occupancy'
      )
      .join('room_types as rt', 'r.room_type_id', 'rt.id')
      .orderBy('r.room_number', 'asc');
    
    console.log(`✅ Query returned ${rooms.length} rooms`);
    if (rooms.length > 0) {
      console.log('Sample room:', rooms[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

quickCheck();
