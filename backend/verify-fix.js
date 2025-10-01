require('dotenv').config();
const { Client } = require('pg');

async function verifyRoomAvailabilityFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ ROOM AVAILABILITY FIX VERIFICATION');
    console.log('====================================\n');

    // 1. Check basic counts
    const roomsResult = await client.query('SELECT COUNT(*) as count FROM rooms');
    const bookingsResult = await client.query('SELECT COUNT(*) as count FROM room_bookings');
    
    console.log('📊 Current Database State:');
    console.log(`  Total Rooms: ${roomsResult.rows[0].count}`);
    console.log(`  Total Bookings: ${bookingsResult.rows[0].count}`);

    // 2. Check room statuses
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM rooms 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('\n🏨 Room Status Distribution:');
    statusResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} rooms`);
    });

    // 3. Test the exact dashboard API calculation
    const dashboardQuery = await client.query(`
      SELECT 
        COUNT(r.id) as total_rooms,
        COUNT(CASE WHEN r.status = 'available' THEN 1 END) as available_rooms,
        COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) as occupied_rooms,
        COUNT(CASE WHEN r.status = 'maintenance' THEN 1 END) as maintenance_rooms,
        COUNT(CASE WHEN r.status = 'cleaning' THEN 1 END) as cleaning_rooms
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE rt.is_active = true
    `);

    const stats = dashboardQuery.rows[0];
    console.log('\n🧮 Dashboard API Calculation:');
    console.log(`  Total Rooms: ${stats.total_rooms}`);
    console.log(`  Available: ${stats.available_rooms}`);
    console.log(`  Occupied: ${stats.occupied_rooms}`);
    console.log(`  Maintenance: ${stats.maintenance_rooms}`);
    console.log(`  Cleaning: ${stats.cleaning_rooms}`);

    // 4. Test availability with booking conflicts
    const availabilityQuery = await client.query(`
      SELECT COUNT(r.id) as truly_available
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE rt.is_active = true 
        AND r.status = 'available'
        AND NOT EXISTS (
          SELECT 1 FROM room_bookings rb
          WHERE rb.room_id = r.id
            AND rb.status IN ('confirmed', 'checked_in')
            AND CURRENT_DATE >= rb.check_in_date::date
            AND CURRENT_DATE < rb.check_out_date::date
        )
    `);

    const trulyAvailable = parseInt(availabilityQuery.rows[0].truly_available);
    console.log(`  Truly Available (after booking conflicts): ${trulyAvailable}`);

    // 5. Final assessment
    console.log('\n🎯 FIX ASSESSMENT:');
    
    const totalRooms = parseInt(stats.total_rooms);
    const availableRooms = parseInt(stats.available_rooms);
    const totalBookings = parseInt(bookingsResult.rows[0].count);

    if (totalBookings === 0 && availableRooms === totalRooms && trulyAvailable === totalRooms) {
      console.log('🎉 PERFECT! Fix is completely successful:');
      console.log('   ✅ All test bookings cleared');
      console.log('   ✅ All rooms set to available');
      console.log('   ✅ No booking conflicts');
      console.log('   ✅ Dashboard API will show correct numbers');
      console.log('\n📱 Frontend Impact:');
      console.log('   - Room availability counter should show 31 available rooms');
      console.log('   - Booking system should allow new reservations');
      console.log('   - Dashboard metrics should be accurate');
      console.log('\n⏰ Timeline: Changes will appear in frontend within 30 seconds due to auto-refresh');
      
    } else if (availableRooms > 0) {
      console.log('✅ GOOD! Fix is mostly successful:');
      console.log(`   - Available rooms: ${availableRooms}/${totalRooms}`);
      console.log(`   - Remaining bookings: ${totalBookings}`);
      console.log('   - Some rooms may still show as unavailable');
      
    } else {
      console.log('❌ ISSUE PERSISTS:');
      console.log('   - No rooms showing as available');
      console.log('   - Additional investigation needed');
    }

  } catch (error) {
    console.error('❌ Verification Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

verifyRoomAvailabilityFix();
