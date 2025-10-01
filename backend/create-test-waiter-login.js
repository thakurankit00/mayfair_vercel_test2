require('dotenv').config();
const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function createTestWaiterLogin() {
  try {
    console.log('🔐 CREATING TEST WAITER LOGIN');
    console.log('=============================');

    // Check if test waiter already exists
    const existingWaiter = await db('users')
      .where('email', 'test.waiter@mayfairhotel.com')
      .first();

    if (existingWaiter) {
      console.log('✅ Test waiter already exists:', existingWaiter.email);
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('waiter123', 10);
      await db('users')
        .where('id', existingWaiter.id)
        .update({
          password: hashedPassword,
          is_active: true,
          updated_at: new Date()
        });
      
      console.log('✅ Password updated for test waiter');
    } else {
      // Create new test waiter
      const hashedPassword = await bcrypt.hash('waiter123', 10);
      
      const [userId] = await db('users').insert({
        email: 'test.waiter@mayfairhotel.com',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'Waiter',
        role: 'waiter',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('id');

      console.log('✅ Created new test waiter with ID:', userId);
    }

    // Also ensure carlos.waiter exists and has correct password
    const carlosWaiter = await db('users')
      .where('email', 'carlos.waiter@mayfairhotel.com')
      .first();

    if (carlosWaiter) {
      const hashedPassword = await bcrypt.hash('waiter123', 10);
      await db('users')
        .where('id', carlosWaiter.id)
        .update({
          password: hashedPassword,
          is_active: true,
          updated_at: new Date()
        });
      
      console.log('✅ Updated password for carlos.waiter@mayfairhotel.com');
    }

    console.log('\n🎯 TEST LOGIN CREDENTIALS:');
    console.log('==========================');
    console.log('Email: test.waiter@mayfairhotel.com');
    console.log('Password: waiter123');
    console.log('Role: waiter');
    console.log('');
    console.log('Alternative:');
    console.log('Email: carlos.waiter@mayfairhotel.com');
    console.log('Password: waiter123');
    console.log('Role: waiter');

    console.log('\n💡 FRONTEND TESTING:');
    console.log('1. Go to http://localhost:3001/login');
    console.log('2. Login with the credentials above');
    console.log('3. Navigate to Waiter Interface');
    console.log('4. Try to create a room service order');
    console.log('5. Check if occupied rooms appear in dropdown');

  } catch (error) {
    console.error('❌ Error creating test waiter:', error);
  } finally {
    process.exit(0);
  }
}

createTestWaiterLogin();
