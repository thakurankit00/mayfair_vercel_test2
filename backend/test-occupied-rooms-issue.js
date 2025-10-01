require('dotenv').config();
const db = require('./src/config/database');

async function testOccupiedRoomsIssue() {
  try {
    console.log('🔍 INVESTIGATING OCCUPIED ROOMS ISSUE');
    console.log('=====================================');

    // 1. Check if we have any room bookings at all
    console.log('\n1. Checking room_bookings table:');
    const allBookings = await db('room_bookings')
      .select('*')
      .orderBy('created_at', 'desc');
    
    console.log(`   Total bookings in database: ${allBookings.length}`);
    
    if (allBookings.length > 0) {
      console.log('   Recent bookings:');
      allBookings.slice(0, 3).forEach(booking => {
        console.log(`   - ID: ${booking.id}, Status: ${booking.status}, Room: ${booking.room_id}`);
        console.log(`     Check-in: ${booking.check_in_date}, Check-out: ${booking.check_out_date}`);
      });
    }

    // 2. Check specifically for checked-in bookings
    console.log('\n2. Checking for checked-in bookings:');
    const checkedInBookings = await db('room_bookings')
      .select('*')
      .where('status', 'checked_in');
    
    console.log(`   Checked-in bookings: ${checkedInBookings.length}`);
    
    if (checkedInBookings.length > 0) {
      checkedInBookings.forEach(booking => {
        console.log(`   - ID: ${booking.id}, Room: ${booking.room_id}`);
        console.log(`     Guest info: ${booking.guest_info}`);
        console.log(`     Dates: ${booking.check_in_date} to ${booking.check_out_date}`);
      });
    }

    // 3. Check rooms table
    console.log('\n3. Checking rooms table:');
    const allRooms = await db('rooms')
      .select('id', 'room_number', 'status')
      .orderBy('room_number');
    
    console.log(`   Total rooms: ${allRooms.length}`);
    console.log('   Room statuses:');
    const statusCounts = {};
    allRooms.forEach(room => {
      statusCounts[room.status] = (statusCounts[room.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} rooms`);
    });

    // 4. Test the exact query used by getOccupiedRooms
    console.log('\n4. Testing getOccupiedRooms query:');
    const occupiedRoomsQuery = await db('room_bookings as rb')
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

    console.log(`   Query result: ${occupiedRoomsQuery.length} occupied rooms`);
    
    if (occupiedRoomsQuery.length > 0) {
      occupiedRoomsQuery.forEach(room => {
        console.log(`   - Room ${room.room_number}: ${room.booking_status}`);
        console.log(`     Guest info: ${room.guest_info}`);
      });
    }

    // 5. Create test data if none exists
    if (checkedInBookings.length === 0) {
      console.log('\n5. No checked-in bookings found. Creating test data...');
      
      // Get a room to use for test booking
      const testRoom = await db('rooms').select('id', 'room_number').first();
      
      if (testRoom) {
        const testBooking = {
          room_id: testRoom.id,
          guest_info: JSON.stringify({
            first_name: 'John',
            last_name: 'Doe',
            phone: '+1234567890',
            email: 'john.doe@example.com'
          }),
          check_in_date: new Date().toISOString().split('T')[0], // Today
          check_out_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
          status: 'checked_in',
          total_amount: 5000,
          payment_status: 'paid',
          created_at: new Date(),
          updated_at: new Date()
        };

        const [bookingId] = await db('room_bookings').insert(testBooking).returning('id');
        console.log(`   ✅ Created test booking ID: ${bookingId} for Room ${testRoom.room_number}`);

        // Update room status to occupied
        await db('rooms')
          .where('id', testRoom.id)
          .update({ status: 'occupied' });
        
        console.log(`   ✅ Updated Room ${testRoom.room_number} status to 'occupied'`);

        // Test the query again
        const newOccupiedRooms = await db('room_bookings as rb')
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

        console.log(`   ✅ After creating test data: ${newOccupiedRooms.length} occupied rooms`);
        
        if (newOccupiedRooms.length > 0) {
          newOccupiedRooms.forEach(room => {
            let guestInfo = {};
            try {
              guestInfo = typeof room.guest_info === 'string' 
                ? JSON.parse(room.guest_info) 
                : room.guest_info;
            } catch (e) {
              console.error('Error parsing guest_info:', e);
            }

            console.log(`   - Room ${room.room_number}: ${guestInfo.first_name} ${guestInfo.last_name}`);
          });
        }
      } else {
        console.log('   ❌ No rooms found in database to create test booking');
      }
    }

    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('====================');
    
    if (occupiedRoomsQuery.length === 0 && checkedInBookings.length === 0) {
      console.log('❌ ISSUE IDENTIFIED: No rooms with "checked_in" status');
      console.log('💡 SOLUTION: The waiter interface needs rooms with booking status "checked_in"');
      console.log('   Either:');
      console.log('   1. Check-in some guests through the booking system, OR');
      console.log('   2. Create test bookings with "checked_in" status');
    } else {
      console.log('✅ Found occupied rooms - the API should work');
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    process.exit(0);
  }
}

checkOccupiedRoomsIssue();

async function checkOccupiedRoomsIssue() {
  await testOccupiedRoomsIssue();
}
