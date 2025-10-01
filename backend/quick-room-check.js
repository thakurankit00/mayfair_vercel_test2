require('dotenv').config();

// Database cleanup script for room availability
const { Client } = require('pg');

async function clearTestBookingsAndResetRooms() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🧹 CLEARING TEST BOOKINGS AND RESETTING ROOM AVAILABILITY');
    console.log('=========================================================\n');

    // Step 1: Check current state before cleanup
    console.log('📊 BEFORE CLEANUP:');
    const beforeRooms = await client.query('SELECT COUNT(*) as count FROM rooms');
    const beforeBookings = await client.query('SELECT COUNT(*) as count FROM room_bookings');
    const beforeAvailable = await client.query(`
      SELECT COUNT(*) as count FROM rooms WHERE status = 'available'
    `);

    console.log(`  Total Rooms: ${beforeRooms.rows[0].count}`);
    console.log(`  Total Bookings: ${beforeBookings.rows[0].count}`);
    console.log(`  Available Rooms: ${beforeAvailable.rows[0].count}\n`);

    // Step 2: Safety check - confirm this is development/test environment
    console.log('🔒 SAFETY CHECK:');
    if (process.env.NODE_ENV === 'production') {
      console.log('❌ ABORTED: This script cannot run in production environment!');
      console.log('   Change NODE_ENV to development or test to proceed.');
      return;
    }
    console.log('✅ Environment check passed (not production)\n');

    // Step 3: Clear all bookings
    console.log('🗑️ CLEARING ALL BOOKINGS:');
    const deleteResult = await client.query('DELETE FROM room_bookings');
    console.log(`✅ Deleted ${deleteResult.rowCount} booking records\n`);

    // Step 4: Reset all room statuses to available
    console.log('🔄 RESETTING ROOM STATUSES:');
    const updateResult = await client.query(`
      UPDATE rooms SET status = 'available' WHERE status != 'available'
    `);
    console.log(`✅ Updated ${updateResult.rowCount} rooms to 'available' status\n`);

    // Step 5: Verify the fix
    console.log('🔍 VERIFICATION:');
    const afterRooms = await client.query('SELECT COUNT(*) as count FROM rooms');
    const afterBookings = await client.query('SELECT COUNT(*) as count FROM room_bookings');
    const afterAvailable = await client.query(`
      SELECT COUNT(*) as count FROM rooms WHERE status = 'available'
    `);

    // Check room status breakdown
    const statusBreakdown = await client.query(`
      SELECT status, COUNT(*) as count
      FROM rooms
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('📊 AFTER CLEANUP:');
    console.log(`  Total Rooms: ${afterRooms.rows[0].count}`);
    console.log(`  Total Bookings: ${afterBookings.rows[0].count}`);
    console.log(`  Available Rooms: ${afterAvailable.rows[0].count}\n`);

    console.log('🏨 Room Status Breakdown:');
    statusBreakdown.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} rooms`);
    });
    console.log('');

    // Step 6: Test availability calculation (same as dashboard API)
    console.log('🧮 TESTING AVAILABILITY CALCULATION:');
    const availabilityTest = await client.query(`
      SELECT COUNT(r.id) as available_count
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

    const finalAvailable = parseInt(availabilityTest.rows[0].available_count);
    const totalRooms = parseInt(afterRooms.rows[0].count);

    console.log(`  API Calculation Available: ${finalAvailable}`);
    console.log(`  Total Rooms: ${totalRooms}`);
    console.log(`  Match: ${finalAvailable === totalRooms ? '✅ YES' : '❌ NO'}\n`);

    // Step 7: Final status
    if (finalAvailable > 0 && parseInt(afterBookings.rows[0].count) === 0) {
      console.log('🎉 SUCCESS! Room availability has been fixed!');
      console.log('� The frontend should now show available rooms within 30 seconds.');
      console.log('🔄 If not, try refreshing your browser or clearing cache.');
    } else {
      console.log('⚠️ Partial success - some issues may remain.');
      console.log('🔍 Manual investigation may be needed.');
    }

  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

clearTestBookingsAndResetRooms();
