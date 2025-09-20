const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function runMigration() {
  try {
    console.log('🔄 Running item cancellation migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database/migrations/004_add_item_cancellation.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await db.raw(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Added:');
    console.log('   - "cancelled" status to item_status enum');
    console.log('   - cancelled_at, cancelled_by, cancellation_reason fields to order_items');
    console.log('   - order_item_cancellation_logs table for audit trail');
    console.log('   - Updated kitchen dashboard function');
    console.log('   - Updated order status update function');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration();
