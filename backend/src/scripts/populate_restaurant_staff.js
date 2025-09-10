const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Script to populate restaurant staff assignments for testing multi-restaurant functionality
 */

async function populateRestaurantStaff() {
  try {
    console.log('🏨 Starting restaurant staff population...');
    
    // Get restaurants
    const restaurants = await db('restaurants')
      .where('is_active', true)
      .orderBy('name');
    
    console.log(`Found ${restaurants.length} restaurants:`);
    restaurants.forEach(r => {
      console.log(`  - ${r.name} (${r.restaurant_type}) - Kitchen: ${r.kitchen_name}`);
    });
    
    // Get users by role - create some if they don't exist
    let chefs = await db('users').where('role', 'chef').where('is_active', true);
    let bartenders = await db('users').where('role', 'bartender').where('is_active', true);
    let waiters = await db('users').where('role', 'waiter').where('is_active', true);
    let managers = await db('users').where('role', 'manager').where('is_active', true);
    
    // Create test users if none exist
    if (chefs.length === 0) {
      const chefId = uuidv4();
      await db('users').insert({
        id: chefId,
        email: 'chef@mayfairhotel.com',
        password_hash: '$2a$12$6.XlVZ0dZ9vYXZ4RZ5ZdJ.XlVZ0dZ9vYXZ4RZ5ZdJ.XlVZ0dZ9vYXZ4R', // hashed: chef123
        first_name: 'Head',
        last_name: 'Chef',
        phone: '+91-9876543210',
        role: 'chef',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      chefs = await db('users').where('role', 'chef').where('is_active', true);
    }
    
    if (bartenders.length === 0) {
      const bartenderId = uuidv4();
      await db('users').insert({
        id: bartenderId,
        email: 'bartender@mayfairhotel.com',
        password_hash: '$2a$12$6.XlVZ0dZ9vYXZ4RZ5ZdJ.XlVZ0dZ9vYXZ4RZ5ZdJ.XlVZ0dZ9vYXZ4R', // hashed: bartender123
        first_name: 'Master',
        last_name: 'Bartender',
        phone: '+91-9876543211',
        role: 'bartender',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      bartenders = await db('users').where('role', 'bartender').where('is_active', true);
    }
    
    if (waiters.length === 0) {
      const waiterId = uuidv4();
      await db('users').insert({
        id: waiterId,
        email: 'waiter@mayfairhotel.com',
        password_hash: '$2a$12$6.XlVZ0dZ9vYXZ4RZ5ZdJ.XlVZ0dZ9vYXZ4RZ5ZdJ.XlVZ0dZ9vYXZ4R', // hashed: waiter123
        first_name: 'Senior',
        last_name: 'Waiter',
        phone: '+91-9876543212',
        role: 'waiter',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      waiters = await db('users').where('role', 'waiter').where('is_active', true);
    }
    
    console.log(`\nFound users:`);
    console.log(`  - ${chefs.length} chefs`);
    console.log(`  - ${bartenders.length} bartenders`);
    console.log(`  - ${waiters.length} waiters`);
    console.log(`  - ${managers.length} managers`);
    
    // Clear existing staff assignments
    await db('restaurant_staff').del();
    console.log('\n🧹 Cleared existing restaurant staff assignments');
    
    const staffAssignments = [];
    
    // Assign staff to restaurants
    for (const restaurant of restaurants) {
      console.log(`\n🏨 Assigning staff to ${restaurant.name}:`);
      
      // Assign managers to all restaurants
      for (const manager of managers) {
        staffAssignments.push({
          id: uuidv4(),
          user_id: manager.id,
          restaurant_id: restaurant.id,
          role: 'manager',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
        console.log(`  ✅ Assigned manager: ${manager.first_name} ${manager.last_name}`);
      }
      
      if (restaurant.restaurant_type === 'restaurant') {
        // Assign chefs to restaurant kitchens
        for (const chef of chefs) {
          staffAssignments.push({
            id: uuidv4(),
            user_id: chef.id,
            restaurant_id: restaurant.id,
            role: 'chef',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
          console.log(`  ✅ Assigned chef: ${chef.first_name} ${chef.last_name}`);
        }
        
        // Assign waiters to restaurant
        for (const waiter of waiters) {
          staffAssignments.push({
            id: uuidv4(),
            user_id: waiter.id,
            restaurant_id: restaurant.id,
            role: 'waiter',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
          console.log(`  ✅ Assigned waiter: ${waiter.first_name} ${waiter.last_name}`);
        }
      }
      
      if (restaurant.restaurant_type === 'bar') {
        // Assign bartenders to bar kitchens
        for (const bartender of bartenders) {
          staffAssignments.push({
            id: uuidv4(),
            user_id: bartender.id,
            restaurant_id: restaurant.id,
            role: 'bartender',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
          console.log(`  ✅ Assigned bartender: ${bartender.first_name} ${bartender.last_name}`);
        }
        
        // Assign some waiters to bar as well
        for (const waiter of waiters) {
          staffAssignments.push({
            id: uuidv4(),
            user_id: waiter.id,
            restaurant_id: restaurant.id,
            role: 'waiter',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
          console.log(`  ✅ Assigned waiter: ${waiter.first_name} ${waiter.last_name}`);
        }
      }
    }
    
    // Insert all staff assignments
    if (staffAssignments.length > 0) {
      await db('restaurant_staff').insert(staffAssignments);
      console.log(`\n✅ Successfully created ${staffAssignments.length} restaurant staff assignments`);
    }
    
    // Display summary
    console.log('\n📊 Staff Assignment Summary:');
    const assignmentSummary = await db('restaurant_staff as rs')
      .select(
        'r.name as restaurant_name',
        'rs.role',
        db.raw('COUNT(*) as count')
      )
      .join('restaurants as r', 'rs.restaurant_id', 'r.id')
      .groupBy('r.name', 'rs.role')
      .orderBy('r.name', 'rs.role');
    
    assignmentSummary.forEach(summary => {
      console.log(`  ${summary.restaurant_name}: ${summary.count} ${summary.role}${summary.count > 1 ? 's' : ''}`);
    });
    
    console.log('\n🎉 Restaurant staff population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error populating restaurant staff:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  populateRestaurantStaff()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = populateRestaurantStaff;
