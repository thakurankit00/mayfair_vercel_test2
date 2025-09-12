const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function populateRoomsData() {
  try {
    console.log('🏨 Populating rooms data for Mayfair Hotel...');

    // First, get all existing room types
    const roomTypes = await db('room_types').select('*').where('is_active', true);
    console.log(`Found ${roomTypes.length} room types`);

    if (roomTypes.length === 0) {
      console.log('⚠️  No room types found. Please run populate_room_types_data.js first.');
      return;
    }

    // Check if rooms already exist
    const existingRoomsCount = await db('rooms').count('id as count').first();
    if (parseInt(existingRoomsCount.count) > 0) {
      console.log('✅ Rooms already exist. Skipping population.');
      return;
    }

    // Define room distribution for a boutique hotel
    const roomDistribution = [
      // Standard Rooms (101-110)
      { floor: 1, startNumber: 101, count: 10, type: 'Standard' },
      // Deluxe Rooms (201-215) 
      { floor: 2, startNumber: 201, count: 15, type: 'Deluxe' },
      // Executive Rooms (301-310)
      { floor: 3, startNumber: 301, count: 10, type: 'Executive' },
      // Suites (401-405)
      { floor: 4, startNumber: 401, count: 5, type: 'Suite' },
      // Premium Suite (501)
      { floor: 5, startNumber: 501, count: 1, type: 'Premium Suite' }
    ];

    const rooms = [];

    for (const distribution of roomDistribution) {
      // Find the room type for this distribution
      const roomType = roomTypes.find(rt => 
        rt.name.toLowerCase().includes(distribution.type.toLowerCase()) ||
        distribution.type.toLowerCase().includes(rt.name.toLowerCase())
      );

      if (!roomType) {
        console.log(`⚠️  Room type not found for: ${distribution.type}, skipping...`);
        continue;
      }

      // Create rooms for this type
      for (let i = 0; i < distribution.count; i++) {
        const roomNumber = (distribution.startNumber + i).toString();
        
        // Vary room status for realism
        let status = 'available';
        const random = Math.random();
        if (random < 0.05) status = 'maintenance';
        else if (random < 0.08) status = 'cleaning';
        else if (random < 0.25) status = 'occupied';

        const room = {
          id: uuidv4(),
          room_number: roomNumber,
          room_type_id: roomType.id,
          floor: distribution.floor,
          status: status,
          last_maintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          notes: getRandomRoomNotes(status),
          created_at: new Date(),
          updated_at: new Date()
        };

        rooms.push(room);
      }
    }

    // Insert rooms in batches
    const batchSize = 10;
    for (let i = 0; i < rooms.length; i += batchSize) {
      const batch = rooms.slice(i, i + batchSize);
      await db('rooms').insert(batch);
      console.log(`✅ Inserted rooms ${i + 1}-${Math.min(i + batchSize, rooms.length)}`);
    }

    console.log(`\n🎉 Successfully populated ${rooms.length} rooms!`);
    
    // Display summary
    const summary = await db.raw(`
      SELECT 
        rt.name as room_type,
        COUNT(r.id) as total_rooms,
        COUNT(CASE WHEN r.status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN r.status = 'maintenance' THEN 1 END) as maintenance,
        COUNT(CASE WHEN r.status = 'cleaning' THEN 1 END) as cleaning
      FROM room_types rt
      LEFT JOIN rooms r ON rt.id = r.room_type_id
      GROUP BY rt.id, rt.name
      ORDER BY rt.name
    `);

    console.log('\n📊 Room Summary:');
    console.table(summary.rows);

  } catch (error) {
    console.error('❌ Error populating rooms data:', error);
  } finally {
    await db.destroy();
  }
}

function getRandomRoomNotes(status) {
  const notes = {
    available: ['', 'Recently cleaned', 'Ready for guest'],
    occupied: ['Guest checked in', 'Do not disturb', 'VIP guest'],
    maintenance: ['AC repair needed', 'Plumbing work in progress', 'Electrical check required'],
    cleaning: ['Deep cleaning in progress', 'Housekeeping in room', 'Sanitization ongoing']
  };
  
  const statusNotes = notes[status] || [''];
  return statusNotes[Math.floor(Math.random() * statusNotes.length)];
}

// Run the script if called directly
if (require.main === module) {
  populateRoomsData().catch(console.error);
}

module.exports = { populateRoomsData };
