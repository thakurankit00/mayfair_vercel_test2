require('dotenv').config();
const db = require('./src/config/database');

async function fixRoomAvailability() {
  try {
    console.log('🔧 Fixing room availability issues...');
    
    // Step 1: Check current state
    console.log('\n📊 Current Database State:');
    
    const totalRooms = await db('rooms').count('* as count').first();
    console.log(`Total rooms: ${totalRooms.count}`);
    
    const roomStatuses = await db('rooms')
      .select('status')
      .count('* as count')
      .groupBy('status');
    console.log('Room statuses:', roomStatuses);
    
    const allBookings = await db('room_bookings')
      .select('status')
      .count('* as count')
      .groupBy('status');
    console.log('Booking statuses:', allBookings);
    
    // Step 2: Check for problematic bookings
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n🗓️ Checking bookings for today (${today}):`);
    
    const todayBookings = await db('room_bookings')
      .select('id', 'room_id', 'check_in_date', 'check_out_date', 'status')
      .where('check_in_date', '<=', today)
      .where('check_out_date', '>', today)
      .whereIn('status', ['confirmed', 'checked_in']);
    
    console.log(`Active bookings for today: ${todayBookings.length}`);
    
    // Step 3: Identify the problem
    if (todayBookings.length >= parseInt(totalRooms.count)) {
      console.log('\n❌ PROBLEM IDENTIFIED: Too many active bookings for today!');
      console.log('This suggests test/sample data is causing the issue.');
      
      // Show sample problematic bookings
      console.log('\n📋 Sample problematic bookings:');
      todayBookings.slice(0, 5).forEach(booking => {
        console.log(`  - Booking ${booking.id}: Room ${booking.room_id}, ${booking.check_in_date} to ${booking.check_out_date}, Status: ${booking.status}`);
      });
      
      // Step 4: Offer solutions
      console.log('\n🛠️ SOLUTION OPTIONS:');
      console.log('1. Clear all test bookings (RECOMMENDED)');
      console.log('2. Update booking dates to past dates');
      console.log('3. Cancel test bookings');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('\nChoose solution (1, 2, or 3): ', async (answer) => {
        try {
          if (answer === '1') {
            await clearTestBookings();
          } else if (answer === '2') {
            await updateBookingDates();
          } else if (answer === '3') {
            await cancelTestBookings();
          } else {
            console.log('Invalid choice. Exiting...');
          }
        } catch (error) {
          console.error('Error applying solution:', error);
        } finally {
          rl.close();
          process.exit(0);
        }
      });
      
    } else {
      console.log('\n✅ Room availability looks normal.');
      console.log('The issue might be in the frontend logic or API endpoints.');
      await testAvailabilityAPI();
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function clearTestBookings() {
  console.log('\n🗑️ Clearing all test bookings...');
  
  // Delete all bookings (be careful in production!)
  const deletedBookings = await db('room_bookings').del();
  console.log(`✅ Deleted ${deletedBookings} bookings`);
  
  // Reset all room statuses to available
  const updatedRooms = await db('rooms').update({ status: 'available' });
  console.log(`✅ Reset ${updatedRooms} rooms to available status`);
  
  await verifyFix();
}

async function updateBookingDates() {
  console.log('\n📅 Updating booking dates to past dates...');
  
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 7); // 7 days ago
  const pastCheckIn = pastDate.toISOString().split('T')[0];
  
  pastDate.setDate(pastDate.getDate() + 2); // 5 days ago (2 day stay)
  const pastCheckOut = pastDate.toISOString().split('T')[0];
  
  const updatedBookings = await db('room_bookings')
    .whereIn('status', ['confirmed', 'checked_in'])
    .update({
      check_in_date: pastCheckIn,
      check_out_date: pastCheckOut,
      status: 'checked_out'
    });
  
  console.log(`✅ Updated ${updatedBookings} bookings to past dates`);
  
  // Reset room statuses
  await db('rooms').update({ status: 'available' });
  console.log('✅ Reset all rooms to available status');
  
  await verifyFix();
}

async function cancelTestBookings() {
  console.log('\n❌ Cancelling test bookings...');
  
  const cancelledBookings = await db('room_bookings')
    .whereIn('status', ['confirmed', 'checked_in'])
    .update({ status: 'cancelled' });
  
  console.log(`✅ Cancelled ${cancelledBookings} bookings`);
  
  // Reset room statuses
  await db('rooms').update({ status: 'available' });
  console.log('✅ Reset all rooms to available status');
  
  await verifyFix();
}

async function verifyFix() {
  console.log('\n🔍 Verifying fix...');
  
  const totalRooms = await db('rooms').count('* as count').first();
  const availableRooms = await db('rooms').where('status', 'available').count('* as count').first();
  const today = new Date().toISOString().split('T')[0];
  const activeBookings = await db('room_bookings')
    .where('check_in_date', '<=', today)
    .where('check_out_date', '>', today)
    .whereIn('status', ['confirmed', 'checked_in'])
    .count('* as count')
    .first();
  
  console.log(`Total rooms: ${totalRooms.count}`);
  console.log(`Available rooms: ${availableRooms.count}`);
  console.log(`Active bookings today: ${activeBookings.count}`);
  
  if (parseInt(availableRooms.count) > 0) {
    console.log('\n🎉 SUCCESS! Room availability has been fixed.');
  } else {
    console.log('\n❌ Issue still exists. Manual investigation needed.');
  }
}

async function testAvailabilityAPI() {
  console.log('\n🧪 Testing availability calculation logic...');
  
  // Test the exact query from dashboardController
  const actuallyAvailableQuery = await db.raw(`
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
  
  const availableCount = parseInt(actuallyAvailableQuery.rows[0]?.truly_available || 0);
  console.log(`API calculation shows: ${availableCount} available rooms`);
  
  if (availableCount === 0) {
    console.log('❌ API logic confirms 0 available rooms. Database cleanup needed.');
  } else {
    console.log('✅ API logic shows available rooms. Frontend issue likely.');
  }
}

// Run the fix
fixRoomAvailability();
