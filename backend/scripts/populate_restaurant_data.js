const db = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

async function populateRestaurantData() {
  try {
    console.log('🔄 Populating restaurant data...');

    // Clear existing data (optional)
    console.log('Clearing existing restaurant data...');
    await db('order_items').del();
    await db('orders').del();
    await db('table_reservations').del();
    await db('menu_items').del();
    await db('menu_categories').del();
    await db('restaurant_tables').del();

    // Create restaurant tables
    console.log('Creating restaurant tables...');
    const tables = [
      // Indoor tables
      { table_number: '1', capacity: 2, location: 'indoor' },
      { table_number: '2', capacity: 4, location: 'indoor' },
      { table_number: '3', capacity: 6, location: 'indoor' },
      { table_number: '4', capacity: 2, location: 'indoor' },
      { table_number: '5', capacity: 4, location: 'indoor' },
      // Outdoor tables
      { table_number: '6', capacity: 4, location: 'outdoor' },
      { table_number: '7', capacity: 6, location: 'outdoor' },
      { table_number: '8', capacity: 8, location: 'outdoor' },
      { table_number: '9', capacity: 2, location: 'outdoor' },
      // Sky bar tables
      { table_number: '10', capacity: 2, location: 'sky_bar' },
      { table_number: '11', capacity: 4, location: 'sky_bar' },
      { table_number: '12', capacity: 6, location: 'sky_bar' }
    ];

    const tableData = tables.map(table => ({
      id: uuidv4(),
      table_number: table.table_number,
      capacity: table.capacity,
      location: table.location,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await db('restaurant_tables').insert(tableData);
    console.log(`✅ Created ${tables.length} restaurant tables`);

    // Create menu categories
    console.log('Creating menu categories...');
    const categories = [
      // Restaurant categories
      { name: 'Appetizers', description: 'Start your meal with these delicious appetizers', type: 'restaurant', display_order: 1 },
      { name: 'Main Course - Veg', description: 'Vegetarian main course dishes', type: 'restaurant', display_order: 2 },
      { name: 'Main Course - Non-Veg', description: 'Non-vegetarian main course dishes', type: 'restaurant', display_order: 3 },
      { name: 'Desserts', description: 'Sweet treats to end your meal', type: 'restaurant', display_order: 4 },
      { name: 'Beverages', description: 'Refreshing drinks and beverages', type: 'restaurant', display_order: 5 },
      // Bar categories
      { name: 'Cocktails', description: 'Classic and signature cocktails', type: 'bar', display_order: 1 },
      { name: 'Whiskey & Spirits', description: 'Premium whiskeys and spirits', type: 'bar', display_order: 2 },
      { name: 'Beer & Wine', description: 'Local and international beers and wines', type: 'bar', display_order: 3 },
      { name: 'Bar Snacks', description: 'Perfect accompaniments to your drinks', type: 'bar', display_order: 4 }
    ];

    const categoryData = categories.map(category => ({
      id: uuidv4(),
      name: category.name,
      description: category.description,
      type: category.type,
      display_order: category.display_order,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await db('menu_categories').insert(categoryData);
    console.log(`✅ Created ${categories.length} menu categories`);

    // Get category IDs for menu items
    const createdCategories = await db('menu_categories').select('id', 'name', 'type');
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    // Create menu items
    console.log('Creating menu items...');
    const menuItems = [
      // Appetizers
      { 
        category: 'Appetizers', 
        name: 'Paneer Tikka', 
        description: 'Grilled cottage cheese with Indian spices', 
        price: 350, 
        is_vegetarian: true, 
        preparation_time: 15, 
        calories: 280,
        ingredients: ['paneer', 'bell peppers', 'onions', 'spices'],
        allergens: ['dairy']
      },
      { 
        category: 'Appetizers', 
        name: 'Chicken Wings', 
        description: 'Spicy buffalo chicken wings', 
        price: 450, 
        is_vegetarian: false, 
        preparation_time: 20, 
        calories: 380,
        ingredients: ['chicken wings', 'hot sauce', 'butter', 'spices'],
        allergens: ['dairy']
      },
      { 
        category: 'Appetizers', 
        name: 'Mushroom Soup', 
        description: 'Creamy mushroom soup with herbs', 
        price: 250, 
        is_vegetarian: true, 
        preparation_time: 10, 
        calories: 180,
        ingredients: ['mushrooms', 'cream', 'herbs', 'butter'],
        allergens: ['dairy']
      },

      // Main Course - Veg
      { 
        category: 'Main Course - Veg', 
        name: 'Dal Tadka', 
        description: 'Yellow lentils tempered with cumin and garlic', 
        price: 280, 
        is_vegetarian: true, 
        preparation_time: 25, 
        calories: 220,
        ingredients: ['yellow lentils', 'cumin', 'garlic', 'tomatoes'],
        allergens: []
      },
      { 
        category: 'Main Course - Veg', 
        name: 'Palak Paneer', 
        description: 'Cottage cheese in creamy spinach gravy', 
        price: 380, 
        is_vegetarian: true, 
        preparation_time: 20, 
        calories: 320,
        ingredients: ['paneer', 'spinach', 'cream', 'spices'],
        allergens: ['dairy']
      },
      { 
        category: 'Main Course - Veg', 
        name: 'Vegetable Biryani', 
        description: 'Fragrant basmati rice with mixed vegetables', 
        price: 450, 
        is_vegetarian: true, 
        is_vegan: true, 
        preparation_time: 35, 
        calories: 420,
        ingredients: ['basmati rice', 'mixed vegetables', 'saffron', 'spices'],
        allergens: []
      },

      // Main Course - Non-Veg
      { 
        category: 'Main Course - Non-Veg', 
        name: 'Butter Chicken', 
        description: 'Creamy tomato-based chicken curry', 
        price: 550, 
        is_vegetarian: false, 
        preparation_time: 30, 
        calories: 480,
        ingredients: ['chicken', 'tomatoes', 'cream', 'butter', 'spices'],
        allergens: ['dairy']
      },
      { 
        category: 'Main Course - Non-Veg', 
        name: 'Fish Curry', 
        description: 'Traditional fish curry with coconut milk', 
        price: 650, 
        is_vegetarian: false, 
        preparation_time: 25, 
        calories: 380,
        ingredients: ['fish', 'coconut milk', 'spices', 'curry leaves'],
        allergens: ['fish']
      },
      { 
        category: 'Main Course - Non-Veg', 
        name: 'Chicken Biryani', 
        description: 'Aromatic rice with tender chicken pieces', 
        price: 650, 
        is_vegetarian: false, 
        preparation_time: 40, 
        calories: 520,
        ingredients: ['basmati rice', 'chicken', 'saffron', 'spices'],
        allergens: []
      },

      // Desserts
      { 
        category: 'Desserts', 
        name: 'Gulab Jamun', 
        description: 'Sweet milk dumplings in sugar syrup', 
        price: 180, 
        is_vegetarian: true, 
        preparation_time: 5, 
        calories: 280,
        ingredients: ['milk solids', 'sugar', 'cardamom', 'rose water'],
        allergens: ['dairy']
      },
      { 
        category: 'Desserts', 
        name: 'Ice Cream Sundae', 
        description: 'Vanilla ice cream with chocolate sauce and nuts', 
        price: 220, 
        is_vegetarian: true, 
        preparation_time: 5, 
        calories: 350,
        ingredients: ['vanilla ice cream', 'chocolate sauce', 'nuts', 'cherry'],
        allergens: ['dairy', 'nuts']
      },

      // Restaurant Beverages
      { 
        category: 'Beverages', 
        name: 'Fresh Lime Soda', 
        description: 'Refreshing lime drink with soda', 
        price: 120, 
        is_vegetarian: true, 
        is_vegan: true, 
        preparation_time: 3, 
        calories: 80,
        ingredients: ['lime juice', 'soda water', 'sugar', 'mint'],
        allergens: []
      },
      { 
        category: 'Beverages', 
        name: 'Mango Lassi', 
        description: 'Creamy yogurt drink with mango', 
        price: 150, 
        is_vegetarian: true, 
        preparation_time: 5, 
        calories: 200,
        ingredients: ['yogurt', 'mango', 'sugar', 'cardamom'],
        allergens: ['dairy']
      },

      // Bar items
      { 
        category: 'Cocktails', 
        name: 'Old Fashioned', 
        description: 'Classic whiskey cocktail with bitters and orange', 
        price: 750, 
        is_vegetarian: true, 
        preparation_time: 5, 
        calories: 150,
        ingredients: ['whiskey', 'sugar', 'bitters', 'orange peel'],
        allergens: []
      },
      { 
        category: 'Cocktails', 
        name: 'Mojito', 
        description: 'Refreshing rum cocktail with mint and lime', 
        price: 650, 
        is_vegetarian: true, 
        is_vegan: true, 
        preparation_time: 5, 
        calories: 180,
        ingredients: ['white rum', 'mint', 'lime', 'sugar', 'soda water'],
        allergens: []
      },

      { 
        category: 'Whiskey & Spirits', 
        name: 'Single Malt Scotch', 
        description: 'Premium 12-year-old single malt whiskey', 
        price: 1200, 
        is_vegetarian: true, 
        is_vegan: true, 
        preparation_time: 1, 
        calories: 100,
        ingredients: ['single malt scotch whiskey'],
        allergens: []
      },

      { 
        category: 'Beer & Wine', 
        name: 'Craft Beer', 
        description: 'Local craft beer selection', 
        price: 350, 
        is_vegetarian: true, 
        is_vegan: true, 
        preparation_time: 1, 
        calories: 150,
        ingredients: ['craft beer'],
        allergens: ['gluten']
      },
      { 
        category: 'Beer & Wine', 
        name: 'House Red Wine', 
        description: 'Selected red wine by the glass', 
        price: 450, 
        is_vegetarian: true, 
        is_vegan: true, 
        preparation_time: 1, 
        calories: 120,
        ingredients: ['red wine'],
        allergens: ['sulfites']
      },

      { 
        category: 'Bar Snacks', 
        name: 'Mixed Nuts', 
        description: 'Roasted and salted mixed nuts', 
        price: 250, 
        is_vegetarian: true, 
        is_vegan: true, 
        preparation_time: 1, 
        calories: 300,
        ingredients: ['mixed nuts', 'salt'],
        allergens: ['nuts']
      },
      { 
        category: 'Bar Snacks', 
        name: 'Cheese Platter', 
        description: 'Assorted cheese with crackers', 
        price: 650, 
        is_vegetarian: true, 
        preparation_time: 5, 
        calories: 450,
        ingredients: ['assorted cheese', 'crackers', 'grapes'],
        allergens: ['dairy', 'gluten']
      }
    ];

    const menuItemData = menuItems.map(item => ({
      id: uuidv4(),
      category_id: categoryMap[item.category],
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: null,
      ingredients: JSON.stringify(item.ingredients || []),
      allergens: JSON.stringify(item.allergens || []),
      is_vegetarian: item.is_vegetarian || false,
      is_vegan: item.is_vegan || false,
      is_gluten_free: item.is_gluten_free || false,
      is_available: true,
      preparation_time: item.preparation_time || null,
      calories: item.calories || null,
      display_order: 0,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await db('menu_items').insert(menuItemData);
    console.log(`✅ Created ${menuItems.length} menu items`);

    console.log('\n🎉 Restaurant data populated successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${tables.length} restaurant tables`);
    console.log(`   • ${categories.length} menu categories`);
    console.log(`   • ${menuItems.length} menu items`);
    console.log('\n🍽️  Tables by location:');
    console.log(`   • Indoor: ${tables.filter(t => t.location === 'indoor').length} tables`);
    console.log(`   • Outdoor: ${tables.filter(t => t.location === 'outdoor').length} tables`);
    console.log(`   • Sky Bar: ${tables.filter(t => t.location === 'sky_bar').length} tables`);
    console.log('\n📋 Menu categories:');
    console.log(`   • Restaurant: ${categories.filter(c => c.type === 'restaurant').length} categories`);
    console.log(`   • Bar: ${categories.filter(c => c.type === 'bar').length} categories`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating restaurant data:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  populateRestaurantData();
}

module.exports = populateRestaurantData;
