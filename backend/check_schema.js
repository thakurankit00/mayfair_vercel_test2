const db = require('./src/config/database');

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check order_items table structure
    const orderItemsColumns = await db.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 order_items table columns:');
    orderItemsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check for enum types
    const enumTypes = await db.raw(`
      SELECT typname, enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE typname LIKE '%status%'
      ORDER BY typname, enumsortorder;
    `);
    
    console.log('\n🏷️  Status-related enum types:');
    if (enumTypes.rows.length > 0) {
      let currentType = '';
      enumTypes.rows.forEach(row => {
        if (row.typname !== currentType) {
          currentType = row.typname;
          console.log(`  ${currentType}:`);
        }
        console.log(`    - ${row.enumlabel}`);
      });
    } else {
      console.log('  No status-related enum types found');
    }
    
    // Check if order_items.status column exists and its type
    const statusColumn = await db.raw(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' AND column_name = 'status';
    `);
    
    console.log('\n🎯 order_items.status column:');
    if (statusColumn.rows.length > 0) {
      const col = statusColumn.rows[0];
      console.log(`  Type: ${col.data_type} (${col.udt_name})`);
    } else {
      console.log('  Status column not found in order_items table');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    process.exit(1);
  }
}

checkSchema();
