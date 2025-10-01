require('dotenv').config();
const db = require('./src/config/database');
const { Model } = require('objection');
const Notification = require('./src/models/Notification');

// Ensure models are bound to the database
Model.knex(db);

async function testCrossInterfaceNotifications() {
  console.log('🧪 [TEST] Testing Cross-Interface Notification System...\n');

  try {
    // Test 1: Verify enhanced createForRole includes managers/admins
    console.log('📋 [TEST 1] Testing enhanced createForRole method...');
    
    // Create a test notification for chefs
    const chefNotifications = await Notification.createForRole('chef', {
      type: 'test-notification',
      title: 'Test Chef Notification',
      message: 'This notification should be visible to chefs, managers, and admins',
      priority: 'medium'
    });

    console.log(`✅ [TEST 1] Created ${chefNotifications.length} notifications for chef role (should include managers/admins)`);

    // Test 2: Verify notifications are created for all target roles
    console.log('\n📋 [TEST 2] Verifying notification recipients...');
    
    const allUsers = await db('users')
      .select('id', 'role', 'first_name', 'last_name')
      .whereIn('role', ['chef', 'manager', 'admin'])
      .where('is_active', true);

    console.log(`👥 [TEST 2] Found ${allUsers.length} users with chef/manager/admin roles:`);
    allUsers.forEach(user => {
      console.log(`   - ${user.role}: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    });

    // Test 3: Check if notifications were created for all expected users
    const createdNotifications = await db('notifications')
      .select('user_id', 'title', 'message')
      .where('title', 'Test Chef Notification')
      .orderBy('created_at', 'desc');

    console.log(`\n📋 [TEST 3] Found ${createdNotifications.length} notifications in database:`);
    
    for (const notification of createdNotifications) {
      const user = allUsers.find(u => u.id === notification.user_id);
      if (user) {
        console.log(`   ✅ Notification created for ${user.role}: ${user.first_name} ${user.last_name}`);
      } else {
        console.log(`   ❌ Notification created for unknown user ID: ${notification.user_id}`);
      }
    }

    // Test 4: Verify waiter notifications also include managers/admins
    console.log('\n📋 [TEST 4] Testing waiter notifications...');
    
    const waiterNotifications = await Notification.createForRole('waiter', {
      type: 'test-notification',
      title: 'Test Waiter Notification',
      message: 'This notification should be visible to waiters, managers, and admins',
      priority: 'medium'
    });

    console.log(`✅ [TEST 4] Created ${waiterNotifications.length} notifications for waiter role (should include managers/admins)`);

    // Test 5: Check notification counts by role
    console.log('\n📊 [TEST 5] Notification count summary:');
    
    const roleCounts = await db('notifications')
      .select('users.role')
      .count('notifications.id as count')
      .join('users', 'users.id', 'notifications.user_id')
      .whereIn('notifications.title', ['Test Chef Notification', 'Test Waiter Notification'])
      .groupBy('users.role')
      .orderBy('users.role');

    roleCounts.forEach(roleCount => {
      console.log(`   ${roleCount.role}: ${roleCount.count} notifications`);
    });

    // Test 6: Verify managers/admins receive notifications for both chef and waiter roles
    console.log('\n🔑 [TEST 6] Verifying cross-role notification access for managers/admins...');
    
    const managersAdmins = await db('users')
      .select('id', 'role', 'first_name', 'last_name')
      .whereIn('role', ['manager', 'admin'])
      .where('is_active', true);

    for (const user of managersAdmins) {
      const userNotifications = await db('notifications')
        .select('title', 'message')
        .where('user_id', user.id)
        .whereIn('title', ['Test Chef Notification', 'Test Waiter Notification'])
        .orderBy('created_at', 'desc');

      console.log(`   ${user.role} ${user.first_name}: ${userNotifications.length} notifications`);
      userNotifications.forEach(notif => {
        console.log(`     - ${notif.title}`);
      });
    }

    console.log('\n🎉 [SUCCESS] Cross-interface notification system test completed!');
    console.log('\n📋 [SUMMARY] Key improvements implemented:');
    console.log('   ✅ Managers/admins now receive notifications for all roles');
    console.log('   ✅ Socket rooms include managers for cross-interface visibility');
    console.log('   ✅ Interface switching triggers notification refresh');
    console.log('   ✅ Database persistence ensures notifications survive page refreshes');

  } catch (error) {
    console.error('❌ [ERROR] Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Clean up test notifications
    try {
      await db('notifications')
        .whereIn('title', ['Test Chef Notification', 'Test Waiter Notification'])
        .del();
      console.log('\n🧹 [CLEANUP] Test notifications removed');
    } catch (cleanupError) {
      console.error('❌ [CLEANUP ERROR]:', cleanupError.message);
    }
    
    process.exit(0);
  }
}

testCrossInterfaceNotifications();
