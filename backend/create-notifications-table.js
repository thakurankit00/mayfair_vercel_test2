require('dotenv').config();
const db = require('./src/config/database');

async function createNotificationsTable() {
  try {
    console.log('🔧 Creating notifications table...');
    
    // Check if table already exists
    const exists = await db.schema.hasTable('notifications');
    if (exists) {
      console.log('✅ Notifications table already exists');
      process.exit(0);
    }
    
    // Create the notifications table
    await db.schema.createTable('notifications', function(table) {
      // Primary key
      table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
      
      // User who should receive the notification
      table.uuid('user_id').notNullable();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      // Notification type (for filtering and styling)
      table.string('type', 50).notNullable(); // 'new-order', 'order-update', 'order-ready', etc.
      
      // Notification content
      table.string('title', 255).notNullable();
      table.text('message').notNullable();
      
      // Additional data (JSON) for navigation and context
      table.jsonb('data').nullable();
      
      // Status and priority
      table.boolean('read').defaultTo(false).notNullable();
      table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium').notNullable();
      
      // Timestamps
      table.timestamp('created_at').defaultTo(db.fn.now()).notNullable();
      table.timestamp('read_at').nullable();
      table.timestamp('expires_at').nullable(); // Optional expiration for temporary notifications
      
      // Indexes for performance
      table.index(['user_id', 'read', 'created_at'], 'idx_notifications_user_read_created');
      table.index(['user_id', 'type'], 'idx_notifications_user_type');
      table.index(['created_at'], 'idx_notifications_created');
      table.index(['expires_at'], 'idx_notifications_expires');
    });
    
    console.log('✅ Notifications table created successfully!');
    
    // Verify the table was created
    const tableExists = await db.schema.hasTable('notifications');
    if (tableExists) {
      console.log('✅ Table verification passed');
      
      // Show table structure
      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        ORDER BY ordinal_position
      `);
      
      console.log('📊 Table structure:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error creating notifications table:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createNotificationsTable();
