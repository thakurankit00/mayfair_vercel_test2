require('dotenv').config();
const db = require('./src/config/database');

async function checkSchema() {
  try {
    console.log('🔍 Checking actual database schema...');
    
    // Check what columns exist in rooms table
    const roomsColumns = await db.raw('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? ORDER BY ordinal_position', ['rooms']);
    console.log('📋 Rooms table columns:');
    roomsColumns.rows.forEach(col => {
      console.log('  -', col.column_name, '(' + col.data_type + ')');
    });
    
    // Check what tables exist that might be related to room status
    const statusTables = await db.raw('SELECT table_name FROM information_schema.tables WHERE table_name LIKE ?', ['%status%']);
    console.log('\n📋 Status-related tables:');
    statusTables.rows.forEach(table => {
      console.log('  -', table.table_name);
    });
    
    // Try a simple rooms query without status join
    console.log('\n🧪 Testing simple rooms query...');
    const simpleRooms = await db('rooms as r')
      .select('r.id', 'r.room_number', 'rt.name as room_type')
      .join('room_types as rt', 'r.room_type_id', 'rt.id')
      .limit(3);
    
    console.log('✅ Simple query worked! Sample rooms:');
    simpleRooms.forEach(room => {
      console.log('  - Room', room.room_number, '(' + room.room_type + ')');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.destroy();
  }
}

checkSchema();
