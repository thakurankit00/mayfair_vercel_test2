require('dotenv').config();
const db = require('./src/config/database');

async function diagnoseRoomIssue() {
  try {
    console.log('🔍 ROOM AVAILABILITY DIAGNOSTIC REPORT');
    console.log('=====================================\n');
    
    // 1. Basic counts
    const totalRooms = await db('rooms').count('* as count').first();
    const totalRoomTypes = await db('room_types').count('* as count').first();
    const totalBookings = await db('room_bookings').count('* as count').first();
    
    console.log('📊 BASIC COUNTS:');
    console.log(`   Total Rooms: ${totalRooms.count}`);
    console.log(`   Total Room Types: ${totalRoomTypes.count}`);
    console.log(`   Total Bookings: ${totalBookings.count}\n`);
    
    // 2. Room status breakdown
    console.log('🏨 ROOM STATUS BREAKDOWN:');
    const roomStatuses = await db('rooms')
      .select('status')
      .count('* as count')
      .groupBy('status')
      .orderBy('count', 'desc');
    
    roomStatuses.forEach(status => {
      console.log(`   ${status.status}: ${status.count} rooms`);
    });
    console.log('');
    
    // 3. Booking status breakdown
    console.log('📋 BOOKING STATUS BREAKDOWN:');
    const bookingStatuses = await db('room_bookings')
      .select('status')
      .count('* as count')
      .groupBy('status')
      .orderBy('count', 'desc');
    
    bookingStatuses.forEach(status => {
      console.log(`   ${status.status}: ${status.count} bookings`);
    });
    console.log('');
    
    // 4. Today's active bookings
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 TODAY'S ACTIVE BOOKINGS (${today}):`);
    
    const todayActiveBookings = await db('room_bookings')
      .select('id', 'room_id', 'check_in_date', 'check_out_date', 'status')
      .where('check_in_date', '<=', today)
      .where('check_out_date', '>', today)
      .whereIn('status', ['confirmed', 'checked_in'])
      .orderBy('room_id');
    
    console.log(`   Active bookings today: ${todayActiveBookings.length}`);
    
    if (todayActiveBookings.length > 0) {
      console.log('   Sample active bookings:');
      todayActiveBookings.slice(0, 10).forEach((booking, index) => {
        console.log(`   ${index + 1}. Room ID: ${booking.room_id}, ${booking.check_in_date} to ${booking.check_out_date}, Status: ${booking.status}`);
      });
      if (todayActiveBookings.length > 10) {
        console.log(`   ... and ${todayActiveBookings.length - 10} more`);
      }
    }
    console.log('');
    
    // 5. Room availability calculation (same as dashboard)
    console.log('🧮 AVAILABILITY CALCULATION:');
    
    const availabilityQuery = await db.raw(`
      SELECT COUNT(r.id) as truly_available
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE rt.is_active = true 
        AND r.status = 'available'
        AND NOT EXISTS (
          SELECT 1 FROM room_bookings rb
          WHERE rb.room_id = r.id
            AND rb.status IN ('confirmed', 'checked_in')
            AND CURRENT_DATE >= DATE(rb.check_in_date)
            AND CURRENT_DATE < DATE(rb.check_out_date)
        )
    `);
    
    const availableRooms = parseInt(availabilityQuery.rows[0]?.truly_available || 0);
    const bookedRooms = todayActiveBookings.length;
    
    console.log(`   Available rooms (API calculation): ${availableRooms}`);
    console.log(`   Booked rooms (today): ${bookedRooms}`);
    console.log(`   Total should equal: ${totalRooms.count}\n`);
    
    // 6. Problem identification
    console.log('🚨 PROBLEM ANALYSIS:');
    
    if (availableRooms === 0 && bookedRooms >= parseInt(totalRooms.count)) {
      console.log('   ❌ ISSUE CONFIRMED: All rooms appear booked');
      console.log('   🔍 ROOT CAUSE: Excessive test/sample bookings');
      console.log('   💡 SOLUTION: Run the fix script to clear test data');
    } else if (availableRooms === 0 && bookedRooms < parseInt(totalRooms.count)) {
      console.log('   ❌ ISSUE: Room status problem');
      console.log('   🔍 ROOT CAUSE: Rooms marked as unavailable in status field');
      console.log('   💡 SOLUTION: Reset room statuses to "available"');
    } else if (availableRooms > 0) {
      console.log('   ✅ DATABASE LOOKS CORRECT');
      console.log('   🔍 ISSUE LIKELY IN: Frontend display or API response');
      console.log('   💡 SOLUTION: Check frontend RoomAvailabilityCounter component');
    } else {
      console.log('   ❓ UNCLEAR ISSUE: Manual investigation needed');
    }
    
    console.log('');
    
    // 7. Recommendations
    console.log('💡 RECOMMENDED ACTIONS:');
    console.log('   1. Run: node backend/fix-room-availability.js');
    console.log('   2. Clear browser cache and refresh frontend');
    console.log('   3. Check dashboard API response: GET /api/v1/dashboard/metrics');
    console.log('   4. Verify room availability API: GET /api/v1/rooms/availability');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Diagnostic Error:', error);
    process.exit(1);
  }
}

diagnoseRoomIssue();
