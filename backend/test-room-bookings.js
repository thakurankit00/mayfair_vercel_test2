require('dotenv').config();
const db = require('./src/config/database');

async function checkRoomBookings() {
  try {
    console.log('🔍 Checking room bookings and occupied rooms...');
    
    // Check all room bookings
    const allBookings = await db('room_bookings')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(10);
    
    console.log('📊 Recent room bookings:', allBookings.length);
    allBookings.forEach(booking => {
      console.log(`  - ID: ${booking.id}, Status: ${booking.status}, Room: ${booking.room_id}, Guest: ${booking.guest_info ? JSON.parse(booking.guest_info).first_name : 'N/A'}`);
    });
    
    // Check specifically for checked_in bookings (what the API looks for)
    const checkedInBookings = await db('room_bookings as rb')
      .select(
        'rb.id',
        'rb.status',
        'rb.room_id',
        'r.room_number',
        'rb.guest_info',
        'rb.check_in_date',
        'rb.check_out_date'
      )
      .join('rooms as r', 'rb.room_id', 'r.id')
      .where('rb.status', 'checked_in');
    
    console.log('\n🏨 Checked-in bookings (what API returns):', checkedInBookings.length);
    checkedInBookings.forEach(booking => {
      const guestInfo = booking.guest_info ? JSON.parse(booking.guest_info) : {};
      console.log(`  - Room ${booking.room_number}: ${booking.status} - ${guestInfo.first_name || 'Guest'} ${guestInfo.last_name || 'User'}`);
    });
    
    // Check rooms table
    const rooms = await db('rooms')
      .select('id', 'room_number', 'status', 'is_active')
      .orderBy('room_number')
      .limit(10);
    
    console.log('\n🏠 Sample rooms:', rooms.length);
    rooms.forEach(room => {
      console.log(`  - Room ${room.room_number}: ${room.status} (active: ${room.is_active})`);
    });
    
    // Test the exact query from the API
    console.log('\n🧪 Testing API query...');
    const occupiedRooms = await db('room_bookings as rb')
      .select(
        'rb.id',
        'r.room_number',
        'r.floor',
        'rb.guest_info',
        'rb.check_in_date',
        'rb.check_out_date',
        'rb.status as booking_status'
      )
      .join('rooms as r', 'rb.room_id', 'r.id')
      .where('rb.status', 'checked_in')
      .orderBy('r.room_number', 'asc');
    
    console.log('🔍 API Query Result:', occupiedRooms.length, 'occupied rooms');
    occupiedRooms.forEach(room => {
      const guestInfo = room.guest_info ? JSON.parse(room.guest_info) : {};
      console.log(`  - Room ${room.room_number} (Floor ${room.floor}): ${guestInfo.first_name || 'Guest'} ${guestInfo.last_name || 'User'}`);
    });
    
    // Check if we have any bookings with different statuses
    const allStatuses = await db('room_bookings')
      .select('status')
      .groupBy('status')
      .count('* as count');
    
    console.log('\n📈 Booking statuses:');
    allStatuses.forEach(status => {
      console.log(`  - ${status.status}: ${status.count} bookings`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

checkRoomBookings();
