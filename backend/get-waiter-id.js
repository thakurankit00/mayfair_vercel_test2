require('dotenv').config();
const db = require('./src/config/database');

async function getWaiterId() {
  try {
    console.log('🔍 Looking for waiter users in database...');
    
    const waiters = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'is_active')
      .where('role', 'waiter')
      .where('is_active', true);
    
    console.log(`Found ${waiters.length} active waiters:`);
    waiters.forEach(waiter => {
      console.log(`  - ${waiter.first_name} ${waiter.last_name} (${waiter.email}) - ID: ${waiter.id}`);
    });
    
    if (waiters.length > 0) {
      const waiter = waiters[0];
      console.log(`\n✅ Using waiter: ${waiter.email} (ID: ${waiter.id})`);
      return waiter.id;
    } else {
      console.log('❌ No active waiters found');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    return null;
  } finally {
    await db.destroy();
  }
}

getWaiterId();
