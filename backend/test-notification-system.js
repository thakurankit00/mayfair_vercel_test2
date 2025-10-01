require('dotenv').config();
const db = require('./src/config/database');

async function testNotificationSystem() {
  try {
    console.log('🔍 Testing Notification System...\n');

    // 1. Check if notifications table exists
    console.log('1. Checking database tables...');
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
    const notificationTables = tables.rows.filter(row => 
      row.table_name.includes('notification')
    );
    
    if (notificationTables.length > 0) {
      console.log('\n✅ Found notification-related tables:');
      notificationTables.forEach(table => console.log(`   - ${table.table_name}`));
      
      // Check notification table structure
      for (const table of notificationTables) {
        console.log(`\n📊 Structure of ${table.table_name}:`);
        const columns = await db.raw(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = '${table.table_name}' 
          ORDER BY ordinal_position
        `);
        
        columns.rows.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
        });
        
        // Check existing notifications
        const count = await db(table.table_name).count('* as total');
        console.log(`   📊 Total records: ${count[0].total}`);
        
        if (count[0].total > 0) {
          const sample = await db(table.table_name).limit(3);
          console.log('   📝 Sample records:');
          sample.forEach((record, index) => {
            console.log(`     ${index + 1}. ${JSON.stringify(record, null, 2)}`);
          });
        }
      }
    } else {
      console.log('\n❌ No notification tables found in database');
      console.log('💡 This means notifications are only stored in memory (frontend state)');
    }

    // 2. Check orders table for recent orders
    console.log('\n2. Checking recent orders for notification testing...');
    const recentOrders = await db('orders')
      .select('id', 'order_number', 'status', 'order_type', 'created_at')
      .where('created_at', '>=', db.raw("CURRENT_DATE"))
      .orderBy('created_at', 'desc')
      .limit(5);
    
    console.log('📦 Recent orders today:');
    recentOrders.forEach(order => {
      console.log(`   - ${order.order_number} (${order.order_type}) - ${order.status} - ${order.created_at}`);
    });

    // 3. Check users and their roles for notification routing
    console.log('\n3. Checking user roles for notification routing...');
    const users = await db('users')
      .select('id', 'first_name', 'last_name', 'email', 'role', 'is_active')
      .where('is_active', true)
      .orderBy('role');
    
    console.log('👥 Active users by role:');
    const usersByRole = {};
    users.forEach(user => {
      if (!usersByRole[user.role]) usersByRole[user.role] = [];
      usersByRole[user.role].push(`${user.first_name} ${user.last_name} (${user.email})`);
    });
    
    Object.keys(usersByRole).forEach(role => {
      console.log(`   ${role.toUpperCase()}:`);
      usersByRole[role].forEach(user => console.log(`     - ${user}`));
    });

    console.log('\n✅ Notification system analysis complete!');
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error.message);
  } finally {
    process.exit(0);
  }
}

testNotificationSystem();
