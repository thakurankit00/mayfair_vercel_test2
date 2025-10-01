const knex = require('../src/config/database');

async function testChefOrders() {
  try {
    console.log('🔍 Testing chef orders filtering...');
    
    // Find the chef user
    const chef = await knex('users')
      .where('email', 'anna.chef@mayfairhotel.com')
      .first();
    
    if (!chef) {
      console.log('❌ Chef user not found');
      return;
    }
    
    console.log(`✅ Found chef: ${chef.first_name} ${chef.last_name} (${chef.email})`);
    
    // Get chef's kitchen assignments
    const chefKitchens = await knex('restaurant_staff')
      .join('restaurants', 'restaurant_staff.restaurant_id', 'restaurants.id')
      .where('restaurant_staff.user_id', chef.id)
      .where('restaurant_staff.role', 'chef')
      .where('restaurant_staff.is_active', true)
      .select('restaurants.id', 'restaurants.name', 'restaurants.restaurant_type');
    
    console.log('🍳 Chef is assigned to kitchens:');
    chefKitchens.forEach(kitchen => {
      console.log(`   - ${kitchen.name} (${kitchen.restaurant_type}) - ID: ${kitchen.id}`);
    });
    
    if (chefKitchens.length === 0) {
      console.log('❌ Chef is not assigned to any kitchen');
      return;
    }
    
    const kitchenIds = chefKitchens.map(k => k.id);
    
    // Check all orders in the system
    const allOrders = await knex('orders as o')
      .select(
        'o.id',
        'o.order_number',
        'o.order_type',
        'o.status',
        'o.target_kitchen_id',
        'o.placed_at',
        'rt.table_number',
        'u.first_name',
        'u.last_name'
      )
      .join('restaurant_tables as rt', 'o.table_id', 'rt.id')
      .join('users as u', 'o.user_id', 'u.id')
      .orderBy('o.placed_at', 'desc');
    
    console.log(`\n📋 Total orders in system: ${allOrders.length}`);
    
    if (allOrders.length > 0) {
      console.log('\n📋 All orders:');
      allOrders.forEach(order => {
        const isChefOrder = kitchenIds.includes(order.target_kitchen_id);
        console.log(`   ${isChefOrder ? '✅' : '❌'} Order #${order.order_number} - ${order.order_type} - Kitchen: ${order.target_kitchen_id} - Status: ${order.status}`);
      });
    }
    
    // Get orders that should be visible to the chef (using the new filtering logic)
    const chefOrders = await knex('orders as o')
      .select(
        'o.*',
        'rt.table_number',
        'rt.location as table_location',
        'u.first_name',
        'u.last_name',
        'w.first_name as waiter_first_name',
        'w.last_name as waiter_last_name'
      )
      .join('restaurant_tables as rt', 'o.table_id', 'rt.id')
      .join('users as u', 'o.user_id', 'u.id')
      .leftJoin('users as w', 'o.waiter_id', 'w.id')
      .whereIn('o.target_kitchen_id', kitchenIds)
      .orderBy('o.placed_at', 'desc');
    
    console.log(`\n🍳 Orders visible to chef: ${chefOrders.length}`);
    
    if (chefOrders.length > 0) {
      console.log('\n🍳 Chef orders:');
      chefOrders.forEach(order => {
        console.log(`   ✅ Order #${order.order_number} - Table ${order.table_number} - ${order.first_name} ${order.last_name} - Status: ${order.status}`);
        console.log(`      Type: ${order.order_type}, Kitchen: ${order.target_kitchen_id}, Placed: ${order.placed_at}`);
      });
    } else {
      console.log('   No orders found for chef');
    }
    
    // Create a test order if none exist
    if (chefOrders.length === 0) {
      console.log('\n🔧 Creating a test order for the chef...');
      
      // Find a table in the chef's restaurant
      const table = await knex('restaurant_tables')
        .join('restaurants', 'restaurant_tables.restaurant_id', 'restaurants.id')
        .where('restaurants.id', kitchenIds[0])
        .where('restaurant_tables.is_active', true)
        .select('restaurant_tables.*')
        .first();
      
      if (table) {
        const testOrderId = require('uuid').v4();
        const orderNumber = `ORD-${Date.now()}`;
        
        await knex('orders').insert({
          id: testOrderId,
          order_number: orderNumber,
          user_id: chef.id, // Chef as customer for testing
          table_id: table.id,
          order_type: 'restaurant',
          restaurant_id: kitchenIds[0],
          target_kitchen_id: kitchenIds[0],
          total_amount: 25.99,
          status: 'pending',
          kitchen_status: 'pending',
          special_instructions: 'Test order for chef visibility',
          placed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        });
        
        console.log(`✅ Created test order #${orderNumber} for table ${table.table_number}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing chef orders:', error);
  } finally {
    await knex.destroy();
  }
}

// Run the script
testChefOrders();
