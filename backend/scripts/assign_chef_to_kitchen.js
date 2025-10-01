const knex = require('../src/config/database');

async function assignChefToKitchen() {
  try {
    console.log('🔍 Checking chef assignment to kitchen...');
    
    // Find the chef user
    const chef = await knex('users')
      .where('email', 'anna.chef@mayfairhotel.com')
      .first();
    
    if (!chef) {
      console.log('❌ Chef user not found');
      return;
    }
    
    console.log(`✅ Found chef: ${chef.first_name} ${chef.last_name} (${chef.email})`);
    
    // Check if chef is already assigned to any kitchen
    const existingAssignments = await knex('restaurant_staff')
      .where('user_id', chef.id)
      .where('role', 'chef')
      .where('is_active', true);
    
    if (existingAssignments.length > 0) {
      console.log('✅ Chef is already assigned to kitchen(s):');
      for (const assignment of existingAssignments) {
        const restaurant = await knex('restaurants')
          .where('id', assignment.restaurant_id)
          .first();
        console.log(`   - ${restaurant.name} (${restaurant.restaurant_type})`);
      }
      return;
    }
    
    console.log('⚠️  Chef is not assigned to any kitchen');
    
    // Find the main restaurant kitchen
    const mainKitchen = await knex('restaurants')
      .where('restaurant_type', 'restaurant')
      .where('has_kitchen', true)
      .where('is_active', true)
      .first();
    
    if (!mainKitchen) {
      console.log('❌ No restaurant kitchen found');
      return;
    }
    
    console.log(`🍳 Found main kitchen: ${mainKitchen.name}`);
    
    // Assign chef to the main kitchen
    await knex('restaurant_staff').insert({
      user_id: chef.id,
      restaurant_id: mainKitchen.id,
      role: 'chef',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log(`✅ Successfully assigned ${chef.first_name} ${chef.last_name} to ${mainKitchen.name} kitchen`);
    
    // Verify the assignment
    const verification = await knex('restaurant_staff')
      .join('restaurants', 'restaurant_staff.restaurant_id', 'restaurants.id')
      .where('restaurant_staff.user_id', chef.id)
      .where('restaurant_staff.role', 'chef')
      .where('restaurant_staff.is_active', true)
      .select('restaurants.name', 'restaurants.restaurant_type');
    
    console.log('🔍 Current chef assignments:');
    verification.forEach(assignment => {
      console.log(`   - ${assignment.name} (${assignment.restaurant_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error assigning chef to kitchen:', error);
  } finally {
    await knex.destroy();
  }
}

// Run the script
assignChefToKitchen();
