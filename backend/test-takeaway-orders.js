require('dotenv').config();
const db = require('./src/config/database');

async function testTakeawayOrderRouting() {
  console.log('🧪 Testing takeaway order routing to kitchen...\n');

  try {
    // 1. Check if we have active restaurants with kitchens
    console.log('1. Checking available restaurants and kitchens...');
    const restaurants = await db('restaurants')
      .select('id', 'name', 'restaurant_type', 'has_kitchen', 'is_active')
      .where('is_active', true);
    
    console.log('Available restaurants:', restaurants);
    
    const kitchens = restaurants.filter(r => r.has_kitchen);
    console.log('Available kitchens:', kitchens);
    
    if (kitchens.length === 0) {
      console.log('❌ No kitchens available. Creating a test kitchen...');
      
      // Create a test restaurant with kitchen
      const testKitchen = await db('restaurants').insert({
        name: 'Test Main Kitchen',
        restaurant_type: 'restaurant',
        has_kitchen: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');
      
      console.log('✅ Created test kitchen:', testKitchen[0]);
    }

    // 2. Check existing takeaway orders
    console.log('\n2. Checking existing takeaway orders...');
    const takeawayOrders = await db('orders')
      .select('id', 'order_number', 'order_type', 'target_kitchen_id', 'kitchen_status', 'status')
      .where('order_type', 'takeaway')
      .orderBy('created_at', 'desc')
      .limit(5);
    
    console.log('Recent takeaway orders:', takeawayOrders);
    
    // 3. Check if takeaway orders are assigned to kitchens
    const takeawayOrdersWithKitchen = takeawayOrders.filter(o => o.target_kitchen_id);
    console.log(`\n📊 Kitchen assignment stats:
    - Total takeaway orders: ${takeawayOrders.length}
    - Orders assigned to kitchen: ${takeawayOrdersWithKitchen.length}
    - Orders without kitchen: ${takeawayOrders.length - takeawayOrdersWithKitchen.length}`);

    // 4. Check kitchen order retrieval for takeaway orders
    if (kitchens.length > 0) {
      console.log('\n3. Testing kitchen order retrieval...');
      const mainKitchen = kitchens.find(k => k.restaurant_type === 'restaurant') || kitchens[0];
      
      const kitchenOrders = await db('orders as o')
        .select('o.id', 'o.order_number', 'o.order_type', 'o.kitchen_status', 'rt.table_number')
        .leftJoin('restaurant_tables as rt', 'o.table_id', 'rt.id')
        .where('o.target_kitchen_id', mainKitchen.id)
        .orderBy('o.created_at', 'desc')
        .limit(10);
      
      console.log(`Orders in kitchen "${mainKitchen.name}":`, kitchenOrders);
      
      const takeawayInKitchen = kitchenOrders.filter(o => o.order_type === 'takeaway');
      console.log(`Takeaway orders in kitchen: ${takeawayInKitchen.length}`);
    }

    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.destroy();
  }
}

testTakeawayOrderRouting();
