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

/**
 * Restaurant Table Management Controller
 */

/**
 * Get all restaurant tables
 * GET /api/v1/restaurant/tables
 */
const getTables = async (req, res) => {
  try {
    const { location } = req.query;
    
    let query = db('restaurant_tables')
      .select('*')
      .where('is_active', true)
      .orderBy(['location', 'table_number']);
    
    if (location) {
      query = query.where('location', location);
    }
    
    const tables = await query;
    
    return res.status(200).json({
      success: true,
      data: {
        tables,
        totalTables: tables.length,
        locations: [...new Set(tables.map(t => t.location))]
      }
    });
  } catch (error) {
    console.error('Get tables error: - restaurantController.js:109', error);
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
 * POST /api/v1/restaurant/tables
 */
const createTable = async (req, res) => {
  try {
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
    
    if (!['indoor', 'outdoor', 'sky_bar'].includes(location)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Location must be indoor, outdoor, or sky_bar'
        }
      });
    }
    
    // Check if table number exists
    const existingTable = await db('restaurant_tables')
      .where('table_number', table_number)
      .where('is_active', true)
      .first();
    
    if (existingTable) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_TABLE',
          message: 'Table with this number already exists'
        }
      });
    }
    
    const tableId = uuidv4();
    const newTable = await db('restaurant_tables')
      .insert({
        id: tableId,
        table_number,
        capacity: parseInt(capacity),
        location,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    return res.status(201).json({
      success: true,
      data: { table: newTable[0] },
      message: 'Restaurant table created successfully'
    });
  } catch (error) {
    console.error('Create table error: - restaurantController.js:184', error);
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
    
    // Check for duplicate table numbers (excluding current table)
    if (table_number && table_number !== existingTable.table_number) {
      const duplicate = await db('restaurant_tables')
        .where('table_number', table_number)
        .where('is_active', true)
        .where('id', '!=', id)
        .first();
      
      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_TABLE',
            message: 'Table with this number already exists'
          }
        });
      }
    }
    
    const updateData = { updated_at: new Date() };
    if (table_number) updateData.table_number = table_number;
    if (capacity) updateData.capacity = parseInt(capacity);
    if (location) updateData.location = location;
    
    const updatedTable = await db('restaurant_tables')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    return res.status(200).json({
      success: true,
      data: { table: updatedTable[0] },
      message: 'Restaurant table updated successfully'
    });
  } catch (error) {
    console.error('Update table error: - restaurantController.js:254', error);
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
    
    return res.status(200).json({
      success: true,
      message: 'Restaurant table deleted successfully'
    });
  } catch (error) {
    console.error('Delete table error: - restaurantController.js:316', error);
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
 * Get menu categories
 * GET /api/v1/restaurant/menu/categories
 */
const getMenuCategories = async (req, res) => {
  try {
    const { type } = req.query; // 'restaurant' or 'bar'
    
    let query = db('menu_categories')
      .select('*')
      .where('is_active', true)
      .orderBy('display_order', 'asc');
    
    if (type && ['restaurant', 'bar'].includes(type)) {
      query = query.where('type', type);
    }
    
    const categories = await query;
    
    return res.status(200).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get menu categories error: - restaurantController.js:355', error);
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
 * POST /api/v1/restaurant/menu/categories
 */
const createMenuCategory = async (req, res) => {
  try {
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
    console.error('Create menu category error: - restaurantController.js:414', error);
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
 * Get menu items with categories
 * GET /api/v1/restaurant/menu
 */
const getMenu = async (req, res) => {
  try {
    const { type, category_id } = req.query;
    
    let categoryQuery = db('menu_categories')
      .select('*')
      .where('is_active', true)
      .orderBy('display_order', 'asc');
    
    if (type && ['restaurant', 'bar'].includes(type)) {
      categoryQuery = categoryQuery.where('type', type);
    }
    
    if (category_id) {
      categoryQuery = categoryQuery.where('id', category_id);
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
    console.error('Get menu error: - restaurantController.js:473', error);
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
    console.error('Create menu item error: - restaurantController.js:561', error);
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
    console.error('Update menu item error: - restaurantController.js:624', error);
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
    console.error('Delete menu item error: - restaurantController.js:671', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete menu item'
      }
    });
  }
};

module.exports = {
  // Table Management
  getTables,
  createTable,
  updateTable,
  deleteTable,
  
  // Menu Management
  getMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
