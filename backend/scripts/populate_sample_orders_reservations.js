const db = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

const populateSampleData = async () => {
  try {
    console.log('🔄 Populating sample orders and reservations...');

    // Get existing data
    const users = await db('users').select('id', 'role', 'first_name', 'last_name');
    const tables = await db('restaurant_tables').select('id', 'table_number');
    const menuItems = await db('menu_items').select('id', 'name', 'price');
    
    if (users.length === 0 || tables.length === 0 || menuItems.length === 0) {
      console.log('❌ Missing required data. Please ensure users, tables, and menu items exist.');
      return;
    }

    const customer = users.find(u => u.role === 'customer');
    const waiter = users.find(u => u.role === 'waiter');
    const admin = users.find(u => u.role === 'admin');
    
    if (!customer) {
      console.log('❌ No customer user found. Please create a customer user first.');
      return;
    }

    // Clear existing sample data
    console.log('Clearing existing sample data...');
    await db('order_items').del();
    await db('orders').del();
    await db('table_reservations').del();

    // Create sample reservations
    console.log('Creating sample reservations...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const reservations = [
      {
        id: uuidv4(),
        reservation_reference: 'RES-001',
        user_id: customer.id,
        table_id: tables[0].id,
        reservation_date: today.toISOString().split('T')[0],
        reservation_time: '19:00:00',
        party_size: 2,
        duration_minutes: 120,
        special_requests: 'Window seat preferred',
        status: 'confirmed',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        reservation_reference: 'RES-002',
        user_id: customer.id,
        table_id: tables[1].id,
        reservation_date: tomorrow.toISOString().split('T')[0],
        reservation_time: '20:00:00',
        party_size: 4,
        duration_minutes: 120,
        special_requests: 'Birthday celebration',
        status: 'confirmed',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await db('table_reservations').insert(reservations);
    console.log(`✅ Created ${reservations.length} sample reservations`);

    // Create sample orders
    console.log('Creating sample orders...');
    const orders = [
      {
        id: uuidv4(),
        order_number: 'ORD-001',
        user_id: customer.id,
        table_id: tables[0].id,
        waiter_id: waiter?.id || null,
        order_type: 'dine_in',
        status: 'pending',
        kitchen_status: 'pending',
        total_amount: 0, // Will be calculated after items
        special_instructions: 'Medium spice level',
        placed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        order_number: 'ORD-002',
        user_id: admin?.id || customer.id,
        table_id: tables[1].id,
        waiter_id: waiter?.id || null,
        order_type: 'dine_in',
        status: 'preparing',
        kitchen_status: 'preparing',
        total_amount: 0, // Will be calculated after items
        special_instructions: 'No onions',
        placed_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        created_at: new Date(Date.now() - 30 * 60 * 1000),
        updated_at: new Date()
      }
    ];

    await db('orders').insert(orders);
    console.log(`✅ Created ${orders.length} sample orders`);

    // Create sample order items
    console.log('Creating sample order items...');
    const orderItems = [
      // Items for Order 1
      {
        id: uuidv4(),
        order_id: orders[0].id,
        menu_item_id: menuItems[0].id,
        quantity: 2,
        unit_price: parseFloat(menuItems[0].price),
        total_price: parseFloat(menuItems[0].price) * 2,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        order_id: orders[0].id,
        menu_item_id: menuItems[1].id,
        quantity: 1,
        unit_price: parseFloat(menuItems[1].price),
        total_price: parseFloat(menuItems[1].price),
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Items for Order 2
      {
        id: uuidv4(),
        order_id: orders[1].id,
        menu_item_id: menuItems[2].id,
        quantity: 1,
        unit_price: parseFloat(menuItems[2].price),
        total_price: parseFloat(menuItems[2].price),
        status: 'preparing',
        created_at: new Date(Date.now() - 30 * 60 * 1000),
        updated_at: new Date()
      }
    ];

    await db('order_items').insert(orderItems);
    console.log(`✅ Created ${orderItems.length} sample order items`);

    // Update order totals
    for (const order of orders) {
      const items = orderItems.filter(item => item.order_id === order.id);
      const total = items.reduce((sum, item) => sum + item.total_price, 0);
      await db('orders').where('id', order.id).update({ total_amount: total });
    }
    console.log('✅ Updated order totals');

    console.log('\n🎉 Sample data populated successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${reservations.length} table reservations`);
    console.log(`   • ${orders.length} orders`);
    console.log(`   • ${orderItems.length} order items`);
    
    console.log('\n📅 Reservations:');
    reservations.forEach(r => {
      console.log(`   • ${r.reservation_reference} - Table ${tables.find(t => t.id === r.table_id)?.table_number} - ${r.reservation_date} ${r.reservation_time}`);
    });
    
    console.log('\n🍽️  Orders:');
    orders.forEach(o => {
      console.log(`   • ${o.order_number} - Table ${tables.find(t => t.id === o.table_id)?.table_number} - Status: ${o.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating sample data:', error);
    process.exit(1);
  }
};

populateSampleData();
