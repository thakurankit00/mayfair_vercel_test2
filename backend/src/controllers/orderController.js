const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Order Management Controller
 */

/**
 * Create new order
 * POST /api/v1/restaurant/orders
 */
const createOrder = async (req, res) => {
  try {
    const {
      table_id,
      table_reservation_id,
      order_type, // 'restaurant', 'bar', 'room_service'
      room_booking_id, // for room service
      items, // array of { menu_item_id, quantity, special_instructions }
      special_instructions
    } = req.body;
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Validation
    if (!table_id || !order_type || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Table, order type, and items are required'
        }
      });
    }
    
    if (!['restaurant', 'bar', 'room_service'].includes(order_type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Order type must be restaurant, bar, or room_service'
        }
      });
    }
    
    // Verify table exists
    const table = await db('restaurant_tables')
      .where('id', table_id)
      .where('is_active', true)
      .first();
    
    if (!table) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TABLE_NOT_FOUND',
          message: 'Table not found'
        }
      });
    }
    
    // For customers, verify they have a reservation for this table
    if (userRole === 'customer' && table_reservation_id) {
      const reservation = await db('table_reservations')
        .where('id', table_reservation_id)
        .where('user_id', userId)
        .where('table_id', table_id)
        .where('status', 'confirmed')
        .first();
      
      if (!reservation) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'NO_RESERVATION',
            message: 'You need a table reservation to place an order'
          }
        });
      }
    }
    
    // Validate menu items and calculate total
    let totalAmount = 0;
    let taxAmount = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const menuItem = await db('menu_items')
        .where('id', item.menu_item_id)
        .where('is_available', true)
        .first();
      
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MENU_ITEM_NOT_FOUND',
            message: `Menu item not found or unavailable: ${item.menu_item_id}`
          }
        });
      }
      
      const quantity = parseInt(item.quantity);
      const unitPrice = parseFloat(menuItem.price);
      const itemTotal = unitPrice * quantity;
      
      validatedItems.push({
        menu_item_id: item.menu_item_id,
        quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
        special_instructions: item.special_instructions || null
      });
      
      totalAmount += itemTotal;
    }
    
    // Calculate tax (12% GST)
    taxAmount = Math.round(totalAmount * 0.12 * 100) / 100;
    
    // Generate order number
    const orderNumber = 'ORD' + Date.now().toString().slice(-6);
    
    // Start transaction
    const trx = await db.transaction();
    
    try {
      // Create order
      const orderId = uuidv4();
      const newOrder = await trx('orders')
        .insert({
          id: orderId,
          order_number: orderNumber,
          user_id: userId,
          table_id,
          table_reservation_id: table_reservation_id || null,
          order_type,
          room_booking_id: room_booking_id || null,
          waiter_id: userRole === 'waiter' ? userId : null,
          total_amount: totalAmount,
          tax_amount: taxAmount,
          status: 'pending',
          special_instructions,
          placed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      
      // Create order items
      const orderItems = validatedItems.map(item => ({
        id: uuidv4(),
        order_id: orderId,
        ...item,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }));
      
      await trx('order_items').insert(orderItems);
      
      await trx.commit();
      
      // Get complete order details
      const orderDetails = await getOrderDetails(orderId);
      
      return res.status(201).json({
        success: true,
        data: { order: orderDetails },
        message: 'Order placed successfully'
      });
      
    } catch (error) {
      await trx.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create order'
      }
    });
  }
};

/**
 * Get orders based on user role
 * GET /api/v1/restaurant/orders
 */
const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, order_type, table_id, date_from, date_to } = req.query;
    
    let query = db('orders as o')
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
      .orderBy('o.placed_at', 'desc');
    
    // Filter by user role
    switch (userRole) {
      case 'customer':
        query = query.where('o.user_id', userId);
        break;
      case 'waiter':
        query = query.where('o.waiter_id', userId);
        break;
      case 'chef':
        query = query.where('o.order_type', 'restaurant');
        break;
      case 'bartender':
        query = query.where('o.order_type', 'bar');
        break;
      // managers and admins can see all orders
    }
    
    // Apply filters
    if (status) {
      query = query.where('o.status', status);
    }
    
    if (order_type) {
      query = query.where('o.order_type', order_type);
    }
    
    if (table_id) {
      query = query.where('o.table_id', table_id);
    }
    
    if (date_from) {
      query = query.where('o.placed_at', '>=', date_from);
    }
    
    if (date_to) {
      query = query.where('o.placed_at', '<=', date_to + ' 23:59:59');
    }
    
    const orders = await query;
    
    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db('order_items as oi')
          .select('oi.*', 'mi.name as item_name', 'mi.description', 'mc.name as category_name')
          .join('menu_items as mi', 'oi.menu_item_id', 'mi.id')
          .join('menu_categories as mc', 'mi.category_id', 'mc.id')
          .where('oi.order_id', order.id)
          .orderBy('oi.created_at', 'asc');
        
        return {
          ...order,
          items
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: {
        orders: ordersWithItems,
        totalOrders: orders.length
      }
    });
    
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch orders'
      }
    });
  }
};

/**
 * Get order by ID
 * GET /api/v1/restaurant/orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const order = await getOrderDetails(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    // Check permissions
    if (userRole === 'customer' && order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only view your own orders'
        }
      });
    }
    
    if (userRole === 'waiter' && order.waiter_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only view orders assigned to you'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: { order }
    });
    
  } catch (error) {
    console.error('Get order by ID error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch order details'
      }
    });
  }
};

/**
 * Update order status (Staff only)
 * PUT /api/v1/restaurant/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimated_time } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!['receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only staff can update order status'
        }
      });
    }
    
    if (!status || !['pending', 'preparing', 'ready', 'served', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid status is required'
        }
      });
    }
    
    const existingOrder = await db('orders')
      .where('id', id)
      .first();
    
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    // Update data based on status
    const updateData = {
      status,
      updated_at: new Date()
    };
    
    if (status === 'preparing') {
      updateData.started_at = new Date();
      if (estimated_time) {
        updateData.estimated_preparation_time = parseInt(estimated_time);
      }
    }
    
    if (status === 'ready') {
      updateData.ready_at = new Date();
    }
    
    if (status === 'served') {
      updateData.served_at = new Date();
    }
    
    const updatedOrder = await db('orders')
      .where('id', id)
      .update(updateData)
      .returning('*');
    
    return res.status(200).json({
      success: true,
      data: { order: updatedOrder[0] },
      message: 'Order status updated successfully'
    });
    
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update order status'
      }
    });
  }
};

/**
 * Update order item status (Chef/Bartender)
 * PUT /api/v1/restaurant/orders/:orderId/items/:itemId/status
 */
const updateOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;
    
    if (!['chef', 'bartender', 'manager', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only kitchen/bar staff can update item status'
        }
      });
    }
    
    if (!status || !['pending', 'preparing', 'ready', 'served'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid status is required'
        }
      });
    }
    
    const existingItem = await db('order_items')
      .where('id', itemId)
      .where('order_id', orderId)
      .first();
    
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_ITEM_NOT_FOUND',
          message: 'Order item not found'
        }
      });
    }
    
    // Update item status
    const updateData = {
      status,
      updated_at: new Date()
    };
    
    if (status === 'preparing') {
      updateData.started_at = new Date();
    }
    
    if (status === 'ready') {
      updateData.completed_at = new Date();
    }
    
    const updatedItem = await db('order_items')
      .where('id', itemId)
      .update(updateData)
      .returning('*');
    
    // Check if all items are ready to update order status
    const orderItems = await db('order_items')
      .where('order_id', orderId);
    
    const allReady = orderItems.every(item => ['ready', 'served'].includes(item.status));
    
    if (allReady) {
      await db('orders')
        .where('id', orderId)
        .update({
          status: 'ready',
          ready_at: new Date(),
          updated_at: new Date()
        });
    }
    
    return res.status(200).json({
      success: true,
      data: { item: updatedItem[0] },
      message: 'Order item status updated successfully'
    });
    
  } catch (error) {
    console.error('Update order item status error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update order item status'
      }
    });
  }
};

/**
 * Add items to existing order (Waiter/Customer)
 * POST /api/v1/restaurant/orders/:id/items
 */
const addOrderItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // array of { menu_item_id, quantity, special_instructions }
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Items are required'
        }
      });
    }
    
    const existingOrder = await db('orders')
      .where('id', id)
      .first();
    
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    // Check permissions
    if (userRole === 'customer' && existingOrder.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only add items to your own orders'
        }
      });
    }
    
    // Check if order can be modified
    if (['served', 'cancelled'].includes(existingOrder.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_CANNOT_BE_MODIFIED',
          message: 'Cannot add items to completed or cancelled orders'
        }
      });
    }
    
    // Validate menu items and calculate additional amount
    let additionalAmount = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const menuItem = await db('menu_items')
        .where('id', item.menu_item_id)
        .where('is_available', true)
        .first();
      
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MENU_ITEM_NOT_FOUND',
            message: `Menu item not found: ${item.menu_item_id}`
          }
        });
      }
      
      const quantity = parseInt(item.quantity);
      const unitPrice = parseFloat(menuItem.price);
      const itemTotal = unitPrice * quantity;
      
      validatedItems.push({
        id: uuidv4(),
        order_id: id,
        menu_item_id: item.menu_item_id,
        quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
        special_instructions: item.special_instructions || null,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      additionalAmount += itemTotal;
    }
    
    // Start transaction
    const trx = await db.transaction();
    
    try {
      // Add new items
      await trx('order_items').insert(validatedItems);
      
      // Update order totals
      const newTotalAmount = parseFloat(existingOrder.total_amount) + additionalAmount;
      const newTaxAmount = Math.round(newTotalAmount * 0.12 * 100) / 100;
      
      await trx('orders')
        .where('id', id)
        .update({
          total_amount: newTotalAmount,
          tax_amount: newTaxAmount,
          updated_at: new Date()
        });
      
      await trx.commit();
      
      // Get updated order details
      const updatedOrder = await getOrderDetails(id);
      
      return res.status(200).json({
        success: true,
        data: { order: updatedOrder },
        message: 'Items added to order successfully'
      });
      
    } catch (error) {
      await trx.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Add order items error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to add items to order'
      }
    });
  }
};

/**
 * Helper function to get complete order details
 */
const getOrderDetails = async (orderId) => {
  const order = await db('orders as o')
    .select(
      'o.*',
      'rt.table_number',
      'rt.location as table_location',
      'u.first_name',
      'u.last_name',
      'u.email',
      'u.phone',
      'w.first_name as waiter_first_name',
      'w.last_name as waiter_last_name'
    )
    .join('restaurant_tables as rt', 'o.table_id', 'rt.id')
    .join('users as u', 'o.user_id', 'u.id')
    .leftJoin('users as w', 'o.waiter_id', 'w.id')
    .where('o.id', orderId)
    .first();
  
  if (!order) return null;
  
  const items = await db('order_items as oi')
    .select('oi.*', 'mi.name as item_name', 'mi.description', 'mc.name as category_name')
    .join('menu_items as mi', 'oi.menu_item_id', 'mi.id')
    .join('menu_categories as mc', 'mi.category_id', 'mc.id')
    .where('oi.order_id', orderId)
    .orderBy('oi.created_at', 'asc');
  
  return {
    ...order,
    items
  };
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderItemStatus,
  addOrderItems
};
