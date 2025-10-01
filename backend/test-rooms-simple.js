require('dotenv').config();
const db = require('./src/config/database');

async function testRooms() {
  try {
    console.log('🔍 Testing room availability and bookings...');
    
    // Check room bookings
    const bookings = await db('room_bookings').select('*').limit(5);
    console.log('📊 Room bookings found:', bookings.length);
    
    // Check rooms
    const rooms = await db('rooms').select('*').limit(5);
    console.log('🏠 Rooms found:', rooms.length);
    
    // Check occupied rooms (what the API should return)
    const occupiedRooms = await db('room_bookings as rb')
      .select('rb.id', 'r.room_number', 'rb.status')
      .join('rooms as r', 'rb.room_id', 'r.id')
      .where('rb.status', 'checked_in');
    
    console.log('🏨 Occupied rooms (checked_in):', occupiedRooms.length);
    
    if (occupiedRooms.length > 0) {
      occupiedRooms.forEach(room => {
        console.log(`  - Room ${room.room_number}: ${room.status}`);
      });
    } else {
      console.log('❌ No occupied rooms found - this is the issue!');
    }
    
    // Check all booking statuses
    const statuses = await db('room_bookings')
      .select('status')
      .groupBy('status')
      .count('* as count');
    
    console.log('📈 All booking statuses:');
    statuses.forEach(s => {
      console.log(`  - ${s.status}: ${s.count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

testRooms();
