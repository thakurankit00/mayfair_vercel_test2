/**
 * Update menu category (Admin/Manager)
 * PUT /api/v1/restaurant/menu/categories/:id
 */
const updateMenuCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, display_order } = req.body;

    // Validate input
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and type are required'
        }
      });
    }
    if (!['restaurant', 'bar', 'rooftop'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Type must be restaurant, bar, or rooftop'
        }
      });
    }

    // Check if category exists
    const existingCategory = await db('menu_categories')
      .where('id', id)
      .where('is_active', true)
      .first();
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Menu category not found'
        }
      });
    }

    // Update category
    const updateData = {
      name,
      description,
      type,
      display_order: display_order || existingCategory.display_order,
      updated_at: new Date()
    };
    const updatedCategory = await db('menu_categories')
      .where('id', id)
      .update(updateData)
      .returning('*');

    return res.status(200).json({
      success: true,
      data: { category: updatedCategory[0] },
      message: 'Menu category updated successfully'
    });
  } catch (error) {
    console.error('Update menu category error: - restaurantController.js:64', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update menu category'
      }
    });
  }
};
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Restaurant = require('../models/Restaurant');
const { getTableBookingStatus } = require('../utils/tableStatus');

/**
 * Restaurant Table Management Controller
 */

/**
 * Get restaurants
 * GET /api/v1/restaurants
 */
const getRestaurants = async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = Restaurant.query()
      .where('is_active', true)
      .orderBy('name');
    
    if (type) {
      query = query.where('restaurant_type', type);
    }
    
    const restaurants = await query;
    
    return res.status(200).json({
      success: true,
      data: {
        restaurants,
        totalRestaurants: restaurants.length
      }
    });
  } catch (error) {
    console.error('Get restaurants error: - restaurantController.js:109', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch restaurants'
      }
    });
  }
};

/**
 * Get restaurant tables by restaurant with booking status
 * GET /api/v1/restaurants/:restaurantId/tables
 */
const getTables = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { location } = req.query;

    let query = db('restaurant_tables')
      .select(
        'restaurant_tables.*',
        'restaurants.name as restaurant_name',
        db.raw(`
          CASE
            WHEN EXISTS (
              SELECT 1 FROM orders o
              WHERE o.table_id = restaurant_tables.id
              AND o.status IN ('pending', 'preparing', 'ready')
            ) THEN 'occupied'
            ELSE 'available'
          END as status
        `),
        db.raw(`
          CONCAT('Table ', restaurant_tables.table_number) as table_name
        `)
      )
      .leftJoin('restaurants', 'restaurant_tables.restaurant_id', 'restaurants.id')
      .where('restaurant_tables.is_active', true)
      .where(function() {
        this.where('restaurants.is_active', true).orWhereNull('restaurant_tables.restaurant_id');
      })
      .orderBy(['restaurant_tables.location', 'restaurant_tables.table_number']);

    if (restaurantId && restaurantId !== 'all') {
      query = query.where('restaurant_tables.restaurant_id', restaurantId);
    }

    if (location) {
      query = query.where('restaurant_tables.location', location);
    }

    const tables = await query;
    
    // Add comprehensive status for each table (reservations + orders)
    const today = new Date().toISOString().split('T')[0];
    const tablesWithStatus = await Promise.all(
      tables.map(async (table) => {
        // Check if table has confirmed or seated reservation today
        const reservation = await db('table_reservations')
          .where('table_id', table.id)
          .where('reservation_date', today)
          .whereIn('status', ['confirmed', 'seated'])
          .first();

        // Check if table has active orders
        const activeOrder = await db('orders')
          .where('table_id', table.id)
          .whereIn('status', ['pending', 'preparing', 'ready'])
          .first();

        // Determine unified status
        let unifiedStatus = 'available';
        let reservationInfo = null;

        if (reservation) {
          reservationInfo = {
            id: reservation.id,
            reservation_reference: reservation.reservation_reference,
            reservation_time: reservation.reservation_time,
            party_size: reservation.party_size,
            status: reservation.status,
            special_requests: reservation.special_requests
          };

          if (reservation.status === 'seated' || activeOrder) {
            unifiedStatus = 'occupied'; // Customer is dining
          } else if (reservation.status === 'confirmed') {
            unifiedStatus = 'reserved'; // Table is reserved but customer hasn't arrived
          }
        } else if (activeOrder) {
          unifiedStatus = 'occupied'; // Walk-in customer dining
        }

        return {
          ...table,
          // Legacy fields for backward compatibility
          booking_status: reservation ? 'booked' : 'available',
          // New unified status system
          unified_status: unifiedStatus,
          reservation_info: reservationInfo,
          has_active_orders: !!activeOrder,
          order_count: activeOrder ? 1 : 0
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: {
        tables: tablesWithStatus,
        totalTables: tablesWithStatus.length,
        locations: [...new Set(tablesWithStatus.map(t => t.location))],
        restaurants: [...new Set(tablesWithStatus.map(t => ({ id: t.restaurant_id, name: t.restaurant_name })))]
      }
    });
  } catch (error) {
    console.error('Get tables error: - restaurantController.js:227', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch restaurant tables'
      }
    });
  }
};

/**
 * Create new restaurant table (Admin/Manager)
 * POST /api/v1/restaurants/:restaurantId/tables
 */
const createTable = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { table_number, capacity, location } = req.body;

    // Validation
    if (!table_number || !capacity || !location) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Table number, capacity, and location are required'
        }
      });
    }

    // Verify restaurant exists
    const restaurant = await Restaurant.query().findById(restaurantId);
    if (!restaurant || !restaurant.is_active) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESTAURANT_NOT_FOUND',
          message: 'Restaurant not found or not active'
        }
      });
    }

    if (!['indoor', 'outdoor', 'sky_bar'].includes(location)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Location must be indoor, outdoor, or sky_bar'
        }
      });
    }

    // Use a database transaction to prevent race conditions
    const result = await db.transaction(async (trx) => {
      // Check if table number exists within this restaurant (with transaction lock)
      const existingTable = await trx('restaurant_tables')
        .where('table_number', table_number)
        .where('restaurant_id', restaurantId)
        .where('is_active', true)
        .first();

      if (existingTable) {
        // Return detailed information about the existing table
        const conflictDetails = {
          existing_table: {
            id: existingTable.id,
            table_number: existingTable.table_number,
            capacity: existingTable.capacity,
            location: existingTable.location,
            created_at: existingTable.created_at
          }
        };

        throw {
          isConflict: true,
          code: 'DUPLICATE_TABLE',
          message: `Table ${table_number} already exists in this restaurant. Please choose a different table number.`,
          details: conflictDetails
        };
      }

      const tableId = uuidv4();
      const newTable = await trx('restaurant_tables')
        .insert({
          id: tableId,
          table_number,
          capacity: parseInt(capacity),
          location,
          restaurant_id: restaurantId,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return newTable[0];
    });

    // Add booking status (new tables are always available)
    const tableWithStatus = {
      ...result,
      booking_status: 'available'
    };

    // Emit socket event for new table creation
    const io = req.app.get('io');
    if (io) {
      io.emit('table_created', {
        table: tableWithStatus,
        restaurant_id: restaurantId,
        timestamp: new Date()
      });
    }

    return res.status(201).json({
      success: true,
      data: { table: tableWithStatus },
      message: 'Restaurant table created successfully'
    });
  } catch (error) {
    console.error('Create table error: - restaurantController.js:348', error);

    // Handle our custom conflict error
    if (error.isConflict) {
      return res.status(409).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      });
    }

    // Handle database constraint violations
    if (error.code === '23505' || error.constraint === 'restaurant_tables_restaurant_table_unique') {
      // Fetch the existing table details for better error response
      try {
        const existingTable = await db('restaurant_tables')
          .where('table_number', req.body.table_number)
          .where('restaurant_id', req.params.restaurantId)
          .where('is_active', true)
          .first();

        const conflictDetails = existingTable ? {
          existing_table: {
            id: existingTable.id,
            table_number: existingTable.table_number,
            capacity: existingTable.capacity,
            location: existingTable.location,
            created_at: existingTable.created_at
          }
        } : {};

        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_TABLE',
            message: `Table ${req.body.table_number} already exists in this restaurant. Please choose a different table number.`,
            details: conflictDetails
          }
        });
      } catch (fetchError) {
        console.error('Error fetching existing table details: - restaurantController.js:391', fetchError);
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_TABLE',
            message: `Table ${req.body.table_number} already exists in this restaurant. Please choose a different table number.`
          }
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create restaurant table'
      }
    });
  }
};

/**
 * Update restaurant table (Admin/Manager)
 * PUT /api/v1/restaurant/tables/:id
 */
const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { table_number, capacity, location } = req.body;

    const existingTable = await db('restaurant_tables')
      .where('id', id)
      .where('is_active', true)
      .first();

    if (!existingTable) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TABLE_NOT_FOUND',
          message: 'Restaurant table not found'
        }
      });
    }

    // Use a database transaction to prevent race conditions
    const result = await db.transaction(async (trx) => {
      // Check for duplicate table numbers within the same restaurant (excluding current table)
      if (table_number && table_number !== existingTable.table_number) {
        const duplicate = await trx('restaurant_tables')
          .where('table_number', table_number)
          .where('restaurant_id', existingTable.restaurant_id)
          .where('is_active', true)
          .where('id', '!=', id)
          .first();

        if (duplicate) {
          // Return detailed information about the conflicting table
          const conflictDetails = {
            existing_table: {
              id: duplicate.id,
              table_number: duplicate.table_number,
              capacity: duplicate.capacity,
              location: duplicate.location,
              created_at: duplicate.created_at
            }
          };

          throw {
            isConflict: true,
            code: 'DUPLICATE_TABLE',
            message: `Table ${table_number} already exists in this restaurant. Please choose a different table number.`,
            details: conflictDetails
          };
        }
      }

      const updateData = { updated_at: new Date() };
      if (table_number) updateData.table_number = table_number;
      if (capacity) updateData.capacity = parseInt(capacity);
      if (location) updateData.location = location;

      const updatedTable = await trx('restaurant_tables')
        .where('id', id)
        .update(updateData)
        .returning('*');

      return updatedTable[0];
    });

    // Add current booking status
    const today = new Date().toISOString().split('T')[0];
    const reservation = await db('table_reservations')
      .where('table_id', id)
      .where('reservation_date', today)
      .whereIn('status', ['confirmed', 'seated'])
      .first();

    const tableWithStatus = {
      ...result,
      booking_status: reservation ? 'booked' : 'available'
    };

    return res.status(200).json({
      success: true,
      data: { table: tableWithStatus },
      message: 'Restaurant table updated successfully'
    });
  } catch (error) {
    console.error('Update table error: - restaurantController.js:500', error);

    // Handle our custom conflict error
    if (error.isConflict) {
      return res.status(409).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      });
    }

    // Handle database constraint violations
    if (error.code === '23505' || error.constraint === 'restaurant_tables_restaurant_table_unique') {
      // Fetch the existing table details for better error response
      try {
        const conflictingTable = await db('restaurant_tables')
          .where('table_number', req.body.table_number)
          .where('restaurant_id', existingTable?.restaurant_id)
          .where('is_active', true)
          .where('id', '!=', req.params.id)
          .first();

        const conflictDetails = conflictingTable ? {
          existing_table: {
            id: conflictingTable.id,
            table_number: conflictingTable.table_number,
            capacity: conflictingTable.capacity,
            location: conflictingTable.location,
            created_at: conflictingTable.created_at
          }
        } : {};

        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_TABLE',
            message: `Table ${req.body.table_number} already exists in this restaurant. Please choose a different table number.`,
            details: conflictDetails
          }
        });
      } catch (fetchError) {
        console.error('Error fetching existing table details: - restaurantController.js:544', fetchError);
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_TABLE',
            message: `Table ${req.body.table_number} already exists in this restaurant. Please choose a different table number.`
          }
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update restaurant table'
      }
    });
  }
};

/**
 * Delete restaurant table (Admin/Manager)
 * DELETE /api/v1/restaurant/tables/:id
 */
const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingTable = await db('restaurant_tables')
      .where('id', id)
      .where('is_active', true)
      .first();
    
    if (!existingTable) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TABLE_NOT_FOUND',
          message: 'Restaurant table not found'
        }
      });
    }
    
    // Check for active reservations
    const activeReservations = await db('table_reservations')
      .where('table_id', id)
      .where('status', 'confirmed')
      .where('reservation_date', '>=', new Date().toISOString().split('T')[0])
      .count('id as count')
      .first();
    
    if (parseInt(activeReservations.count) > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_TABLE',
          message: 'Cannot delete table with active reservations'
        }
      });
    }
    
    // Soft delete
    await db('restaurant_tables')
      .where('id', id)
      .update({ is_active: false, updated_at: new Date() });
    
    // Emit socket event for table deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('table_deleted', { table_id: id });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Restaurant table deleted successfully'
    });
  } catch (error) {
    console.error('Delete table error: - restaurantController.js:622', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete restaurant table'
      }
    });
  }
};

/**
 * Menu Management Functions
 */

/**
 * Get menu categories by restaurant
 * GET /api/v1/restaurants/:restaurantId/menu/categories
 */
const getMenuCategories = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { type } = req.query; // 'restaurant' or 'bar'
    
    let query = db('menu_categories')
      .select('menu_categories.*', 'restaurants.name as restaurant_name')
      .leftJoin('restaurants', 'menu_categories.restaurant_id', 'restaurants.id')
      .where('menu_categories.is_active', true)
      .where(function() {
        this.where('restaurants.is_active', true).orWhereNull('menu_categories.restaurant_id');
      })
      .orderBy('menu_categories.display_order', 'asc');
    
    if (restaurantId && restaurantId !== 'all') {
      query = query.where('menu_categories.restaurant_id', restaurantId);
    }
    
    if (type && ['restaurant', 'bar'].includes(type)) {
      query = query.where('menu_categories.type', type);
    }
    
    const categories = await query;
    
    return res.status(200).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get menu categories error: - restaurantController.js:670', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch menu categories'
      }
    });
  }
};

/**
 * Create menu category (Admin/Manager)
 * POST /api/v1/restaurants/:restaurantId/menu/categories
 */
const createMenuCategory = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { name, description, type, display_order } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and type are required'
        }
      });
    }
    
    // Verify restaurant exists
    const restaurant = await Restaurant.query().findById(restaurantId);
    if (!restaurant || !restaurant.is_active) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESTAURANT_NOT_FOUND',
          message: 'Restaurant not found or not active'
        }
      });
    }
    
    if (!['restaurant', 'bar'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Type must be restaurant or bar'
        }
      });
    }
    
    const categoryId = uuidv4();
    const newCategory = await db('menu_categories')
      .insert({
        id: categoryId,
        name,
        description,
        type,
        restaurant_id: restaurantId,
        display_order: display_order || 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    return res.status(201).json({
      success: true,
      data: { category: newCategory[0] },
      message: 'Menu category created successfully'
    });
  } catch (error) {
    console.error('Create menu category error: - restaurantController.js:743', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create menu category'
      }
    });
  }
};

/**
 * Get menu items with categories by restaurant
 * GET /api/v1/restaurants/:restaurantId/menu
 */
const getMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { type, category_id } = req.query;
    
    let categoryQuery = db('menu_categories')
      .select('menu_categories.*', 'restaurants.name as restaurant_name')
      .leftJoin('restaurants', 'menu_categories.restaurant_id', 'restaurants.id')
      .where('menu_categories.is_active', true)
      .where(function() {
        this.where('restaurants.is_active', true).orWhereNull('menu_categories.restaurant_id');
      })
      .orderBy('menu_categories.display_order', 'asc');
    
    if (restaurantId && restaurantId !== 'all') {
      categoryQuery = categoryQuery.where('menu_categories.restaurant_id', restaurantId);
    }
    
    if (type && ['restaurant', 'bar'].includes(type)) {
      categoryQuery = categoryQuery.where('menu_categories.type', type);
    }
    
    if (category_id) {
      categoryQuery = categoryQuery.where('menu_categories.id', category_id);
    }
    
    const categories = await categoryQuery;
    
    // Get menu items for each category
    const menuWithItems = await Promise.all(
      categories.map(async (category) => {
        const items = await db('menu_items')
          .select('*')
          .where('category_id', category.id)
          .where('is_available', true)
          .orderBy('display_order', 'asc');
        
        return {
          ...category,
          items
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: { 
        menu: menuWithItems,
        totalCategories: categories.length,
        totalItems: menuWithItems.reduce((sum, cat) => sum + cat.items.length, 0)
      }
    });
  } catch (error) {
    console.error('Get menu error: - restaurantController.js:811', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch menu'
      }
    });
  }
};

/**
 * Create menu item (Admin/Manager)
 * POST /api/v1/restaurant/menu/items
 */
const createMenuItem = async (req, res) => {
  try {
    const {
      category_id,
      name,
      description,
      price,
      image_url,
      ingredients,
      allergens,
      is_vegetarian,
      is_vegan,
      is_gluten_free,
      preparation_time,
      calories,
      display_order
    } = req.body;
    
    if (!category_id || !name || !price) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category, name, and price are required'
        }
      });
    }
    
    // Verify category exists
    const category = await db('menu_categories')
      .where('id', category_id)
      .where('is_active', true)
      .first();
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Menu category not found'
        }
      });
    }
    
    const itemId = uuidv4();
    const newItem = await db('menu_items')
      .insert({
        id: itemId,
        category_id,
        name,
        description,
        price: parseFloat(price),
        image_url,
        ingredients: ingredients ? JSON.stringify(ingredients) : '[]',
        allergens: allergens ? JSON.stringify(allergens) : '[]',
        is_vegetarian: is_vegetarian || false,
        is_vegan: is_vegan || false,
        is_gluten_free: is_gluten_free || false,
        is_available: true,
        preparation_time: preparation_time || null,
        calories: calories || null,
        display_order: display_order || 0,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    return res.status(201).json({
      success: true,
      data: { item: newItem[0] },
      message: 'Menu item created successfully'
    });
  } catch (error) {
    console.error('Create menu item error: - restaurantController.js:899', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create menu item'
      }
    });
  }
};

/**
 * Update menu item (Admin/Manager)
 * PUT /api/v1/restaurant/menu/items/:id
 */
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const existingItem = await db('menu_items')
      .where('id', id)
      .where('is_available', true)
      .first();
    
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Menu item not found'
        }
      });
    }
    
    // Process update data
    const processedData = { updated_at: new Date() };
    
    if (updateData.name) processedData.name = updateData.name;
    if (updateData.description) processedData.description = updateData.description;
    if (updateData.price) processedData.price = parseFloat(updateData.price);
    if (updateData.image_url) processedData.image_url = updateData.image_url;
    if (updateData.ingredients) processedData.ingredients = JSON.stringify(updateData.ingredients);
    if (updateData.allergens) processedData.allergens = JSON.stringify(updateData.allergens);
    if (updateData.is_vegetarian !== undefined) processedData.is_vegetarian = updateData.is_vegetarian;
    if (updateData.is_vegan !== undefined) processedData.is_vegan = updateData.is_vegan;
    if (updateData.is_gluten_free !== undefined) processedData.is_gluten_free = updateData.is_gluten_free;
    if (updateData.is_available !== undefined) processedData.is_available = updateData.is_available;
    if (updateData.preparation_time) processedData.preparation_time = updateData.preparation_time;
    if (updateData.calories) processedData.calories = updateData.calories;
    if (updateData.display_order) processedData.display_order = updateData.display_order;
    
    const updatedItem = await db('menu_items')
      .where('id', id)
      .update(processedData)
      .returning('*');
    
    return res.status(200).json({
      success: true,
      data: { item: updatedItem[0] },
      message: 'Menu item updated successfully'
    });
  } catch (error) {
    console.error('Update menu item error: - restaurantController.js:962', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update menu item'
      }
    });
  }
};

/**
 * Delete menu item (Admin/Manager)
 * DELETE /api/v1/restaurant/menu/items/:id
 */
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingItem = await db('menu_items')
      .where('id', id)
      .where('is_available', true)
      .first();
    
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Menu item not found'
        }
      });
    }
    
    // Soft delete by setting is_available to false
    await db('menu_items')
      .where('id', id)
      .update({ 
        is_available: false, 
        updated_at: new Date() 
      });
    
    return res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error: - restaurantController.js:1009', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete menu item'
      }
    });
  }
};

/**
 * Delete menu category (Admin/Manager)
 * DELETE /api/v1/restaurant/menu/categories/:id
 */
const deleteMenuCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingCategory = await db('menu_categories')
      .where('id', id)
      .where('is_active', true)
      .first();
    
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Menu category not found'
        }
      });
    }
    
    // Check if category has active menu items
    const activeItems = await db('menu_items')
      .where('category_id', id)
      .where('is_available', true)
      .count('id as count')
      .first();
    
    if (parseInt(activeItems.count) > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_CATEGORY',
          message: 'Cannot delete category with active menu items'
        }
      });
    }
    
    // Soft delete
    await db('menu_categories')
      .where('id', id)
      .update({ 
        is_active: false, 
        updated_at: new Date() 
      });
    
    return res.status(200).json({
      success: true,
      message: 'Menu category deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu category error: - restaurantController.js:1073', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete menu category'
      }
    });
  }
};

module.exports = {
  // Restaurant Management
  getRestaurants,
  
  // Table Management
  getTables,
  createTable,
  updateTable,
  deleteTable,
  
  // Menu Management
  getMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
