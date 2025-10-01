require('dotenv').config();
const axios = require('axios');

async function testOccupiedRoomsAPI() {
  try {
    console.log('🧪 Testing occupied rooms API endpoint...');
    
    // First, let's test the API endpoint directly
    const response = await axios.get('http://localhost:3000/api/v1/rooms/occupied', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBmMTZmYzkwLTIxYTgtNGJmYS1hYTM3LTRhMzBiN2Q3MjY5ZCIsImVtYWlsIjoiY2FybG9zLndhaXRlckBtYXlmYWlyaG90ZWwuY29tIiwicm9sZSI6IndhaXRlciIsImlhdCI6MTc1ODM4ODMwNCwiZXhwIjoxNzU4OTkzMTA0fQ.example' // This will fail but let's see the error
      }
    });
    
    console.log('✅ API Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error Status:', error.response.status);
      console.log('❌ API Error Data:', error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
  
  // Now let's test the database directly
  console.log('\n🔍 Testing database directly...');
  
  const db = require('./src/config/database');
  
  try {
    // Check if we have any rooms
    const rooms = await db('rooms').select('*').limit(5);
    console.log(`📊 Total rooms in database: ${rooms.length}`);
    
    if (rooms.length > 0) {
      console.log('🏠 Sample rooms:');
      rooms.forEach(room => {
        console.log(`  - Room ${room.room_number} (${room.status})`);
      });
    }
    
    // Check if we have any room bookings
    const bookings = await db('room_bookings').select('*').limit(5);
    console.log(`📋 Total room bookings: ${bookings.length}`);
    
    if (bookings.length > 0) {
      console.log('📝 Sample bookings:');
      bookings.forEach(booking => {
        console.log(`  - Booking ${booking.booking_reference} (${booking.status})`);
      });
    }
    
    // Test the exact query from the controller
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
    
    console.log(`🏨 Occupied rooms (checked_in status): ${occupiedRooms.length}`);
    
    if (occupiedRooms.length > 0) {
      console.log('✅ Occupied rooms found:');
      occupiedRooms.forEach(room => {
        console.log(`  - Room ${room.room_number} (${room.booking_status})`);
      });
    } else {
      console.log('⚠️ No occupied rooms found. This explains the "No occupied rooms available" message.');
      
      // Let's check what statuses we do have
      const statusCounts = await db('room_bookings')
        .select('status')
        .count('* as count')
        .groupBy('status');
      
      console.log('📊 Booking status breakdown:');
      statusCounts.forEach(s => {
        console.log(`  - ${s.status}: ${s.count}`);
      });
    }
    
  } catch (dbError) {
    console.error('❌ Database Error:', dbError);
  } finally {
    await db.destroy();
  }
}

testOccupiedRoomsAPI();
