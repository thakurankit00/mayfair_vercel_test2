const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const OrderKitchenLog = require('../models/OrderKitchenLog');

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
      order_type, // 'restaurant', 'bar', 'room_service','dine_in','takeway'
      kitchen_type,//'Bar Kitchen','Main Kitchen'
      room_booking_id, // for room service
      restaurant_id, // which restaurant the order is for
      target_kitchen_id, // which kitchen should prepare the order
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
    
    // Validate restaurant if provided
    if (restaurant_id) {
      const restaurant = await Restaurant.query().findById(restaurant_id);
      if (!restaurant || !restaurant.is_active) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RESTAURANT_NOT_FOUND',
            message: 'Restaurant not found or not active'
          }
        });
      }
    }
    
    if (!['restaurant', 'bar', 'room_service','dine_in','takeway'].includes(order_type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Order type must be restaurant, bar, or room_service'
        }
      });
    }
    
    // Verify table exists and get restaurant info
    const table = await db('restaurant_tables')
      .select('restaurant_tables.*', 'restaurants.name as restaurant_name', 'restaurants.restaurant_type')
      .join('restaurants', 'restaurant_tables.restaurant_id', 'restaurants.id')
      .where('restaurant_tables.id', table_id)
      .where('restaurant_tables.is_active', true)
      .where('restaurants.is_active', true)
      .first();
    
    if (!table) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TABLE_NOT_FOUND',
          message: 'Table not found or restaurant not active'
        }
      });
    }
    
    // Auto-determine restaurant_id from table if not provided
    const finalRestaurantId = restaurant_id || table.restaurant_id;
    
    // Auto-determine target kitchen based on order type and restaurant
    let finalTargetKitchenId = target_kitchen_id;
    if (!finalTargetKitchenId) {
      if (order_type === 'bar') {
        // Find bar kitchen
        const barKitchen = await Restaurant.query()
          .where('restaurant_type', 'bar')
          .where('has_kitchen', true)
          .where('is_active', true)
          .first();
        finalTargetKitchenId = barKitchen?.id;
      } else {
        // Use restaurant's own kitchen or main kitchen
        const restaurantKitchen = await Restaurant.query()
          .where('id', finalRestaurantId)
          .where('has_kitchen', true)
          .first();
        finalTargetKitchenId = restaurantKitchen?.id || finalRestaurantId;
      }
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
      // Handle both menuItemId (frontend) and menu_item_id (backend) field names
      const menuItemId = item.menuItemId || item.menu_item_id;

      const menuItem = await db('menu_items')
        .where('id', menuItemId)
        .where('is_available', true)
        .first();

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MENU_ITEM_NOT_FOUND',
            message: `Menu item not found or unavailable: ${menuItemId}`
          }
        });
      }
      
      const quantity = parseInt(item.quantity);
      const unitPrice = parseFloat(menuItem.price);
      const itemTotal = unitPrice * quantity;
      
      validatedItems.push({
        menu_item_id: menuItemId,
        quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
        special_instructions: item.specialInstructions || item.special_instructions || null
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
          restaurant_id: finalRestaurantId,
          target_kitchen_id: finalTargetKitchenId,
          // kitchen_type:kitchen_type,
          kitchen_status: 'pending',
          kitchen_assigned_at: new Date(),
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
      
      // Log kitchen assignment
      if (finalTargetKitchenId) {
        await trx('order_kitchen_logs').insert({
          id: uuidv4(),
          order_id: orderId,
          restaurant_id: finalTargetKitchenId,
          action: 'assigned',
          performed_by: userId,
          notes: `Order automatically assigned to kitchen`,
          created_at: new Date()
        });
      }
      
      await trx.commit();
      
      // Emit Socket.io event for new order
      const socketHandler = req.app.get('socketHandler');
      console.log('📦 [ORDER] Socket handler available:', !!socketHandler);
      if (socketHandler) {
        console.log('📦 [ORDER] Emitting new order event:', {
          orderId,
          orderNumber,
          tableId: table_id,
          tableNumber: table.table_name,
          kitchenTypes: [order_type],
          waiterId: userRole === 'waiter' ? userId : null
        });
        socketHandler.emitNewOrder({
          orderId,
          orderNumber,
          tableId: table_id,
          tableNumber: table.table_name,
          kitchenTypes: [order_type],
          waiterId: userRole === 'waiter' ? userId : null,
          customerInfo: {
            name: `${req.user.first_name} ${req.user.last_name}`,
            userId
          },
          restaurantId: finalRestaurantId,
          targetKitchenId: finalTargetKitchenId
        });
      } else {
        console.log('❌ [ORDER] Socket handler not available');
      }
      
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
    const { status, order_type, table_id, date_from, date_to, waiter_id } = req.query;
    
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
        // Waiters can only see their own orders
        query = query.where('o.waiter_id', userId);
        break;
      case 'chef':
        query = query.where('o.order_type', 'restaurant');
        break;
      case 'bartender':
        query = query.where('o.order_type', 'bar');
        break;
      case 'admin':
      case 'manager':
        // Admins and managers can see all orders, but can filter by waiter_id if provided
        if (waiter_id) {
          query = query.where('o.waiter_id', waiter_id);
        }
        break;
      // Default: no additional filtering for other roles
    }
    
    // Apply filters
    if (status) {
      // Handle both single status and array of statuses
      if (Array.isArray(status)) {
        query = query.whereIn('o.status', status);
      } else {
        query = query.where('o.status', status);
      }
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
    // Emit socket event for order status update
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.emitOrderStatusUpdate({
        orderId: id,
        orderNumber: existingOrder.order_number,
        status,
        userId,
        userRole,
        waiterId: existingOrder.waiter_id
      });
    }

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
    const { status, chef_notes } = req.body;
    const userId = req.user.id;
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
    
    if (!status || !['pending', 'accepted', 'preparing', 'ready_to_serve', 'ready'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid status is required (pending, accepted, preparing, ready_to_serve, ready)'
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
    
    // Map frontend status to database enum values
    let dbStatus = status;
    if (status === 'accepted') {
      dbStatus = 'preparing'; // Map 'accepted' to 'preparing'
    } else if (status === 'ready_to_serve') {
      dbStatus = 'ready'; // Map 'ready_to_serve' to 'ready'
    }

    // Update item status with proper timestamps
    const updateData = {
      status: dbStatus,
      updated_at: new Date()
    };

    if (status === 'accepted' || status === 'preparing') {
      updateData.started_at = new Date();
    }

    if (status === 'ready_to_serve' || status === 'ready') {
      updateData.completed_at = new Date();
    }

    if (chef_notes) {
      updateData.special_instructions = chef_notes; // Store chef notes in special_instructions for now
    }
    
    const updatedItem = await db('order_items')
      .where('id', itemId)
      .update(updateData)
      .returning('*');
    
    // Get order details for socket notification
    const order = await db('orders').where('id', orderId).first();
    
    // Emit socket event for item status update
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.emitOrderItemStatusUpdate({
        orderId,
        orderNumber: order.order_number,
        itemId,
        status: dbStatus, // Use the mapped database status
        chefNotes: chef_notes,
        updatedBy: userId,
        updatedByRole: userRole,
        waiterId: order.waiter_id,
        customerId: order.user_id
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
      // Handle both menuItemId (frontend) and menu_item_id (backend) field names
      const menuItemId = item.menuItemId || item.menu_item_id;

      const menuItem = await db('menu_items')
        .where('id', menuItemId)
        .where('is_available', true)
        .first();
      
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MENU_ITEM_NOT_FOUND',
            message: `Menu item not found: ${menuItemId}`
          }
        });
      }
      const quantity = parseInt(item.quantity);
      const unitPrice = parseFloat(menuItem.price);
      const itemTotal = unitPrice * quantity;

      validatedItems.push({
        id: uuidv4(),
        order_id: id,
        menu_item_id: menuItemId,
        quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
        special_instructions: item.specialInstructions || item.special_instructions || null,
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
      
      // Reset order status to 'pending' when new items are added
      // This ensures the kitchen needs to re-accept the order
      await trx('orders')
        .where('id', id)
        .update({
          status: 'pending',
          updated_at: new Date()
        });

      await trx.commit();

      // Get updated order details
      const updatedOrder = await getOrderDetails(id);

      // Determine kitchen types from the new items
      const kitchenTypes = [...new Set(validatedItems.map(item => {
        // Default to 'restaurant' if no kitchen type specified
        return item.kitchenType || 'restaurant';
      }))];

      const socketHandler = req.app.get('socketHandler');
      console.log('📦 [ADD_ITEMS] Socket handler available:', !!socketHandler);
      if (socketHandler) {
        console.log('📦 [ADD_ITEMS] Emitting add items event:', {
          orderId: id,
          orderNumber: existingOrder.order_number,
          tableId: existingOrder.table_id,
          tableNumber: updatedOrder.table?.table_number,
          waiterId: existingOrder.waiter_id,
          newItems: validatedItems.length,
          kitchenTypes: kitchenTypes
        });
        socketHandler.handleAddOrderItems({
          orderId: id,
          orderNumber: existingOrder.order_number,
          tableId: existingOrder.table_id,
          tableNumber: updatedOrder.table?.table_number,
          waiterId: existingOrder.waiter_id,
          customerInfo: updatedOrder.customer,
          newItems: validatedItems,
          kitchenTypes: kitchenTypes
        });
      } else {
        console.log('❌ [ADD_ITEMS] Socket handler not available');
      }
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

/**
 * Kitchen Management Functions
 */

/**
 * Get orders assigned to a specific kitchen
 * GET /api/v1/restaurant/kitchen/:kitchenId/orders
 */
const getKitchenOrders = async (req, res) => {
  try {
    const { kitchenId } = req.params;
    const { status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Verify user has access to this kitchen
    if (!['admin', 'manager'].includes(userRole)) {
      const hasAccess = await Restaurant.relatedQuery('staff')
        .for(kitchenId)
        .where('users.id', userId)
        .where('restaurant_staff.role', 'in', ['chef', 'bartender'])
        .where('restaurant_staff.is_active', true)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You do not have access to this kitchen'
          }
        });
      }
    }
    
    let query = db('orders as o')
      .select(
        'o.*',
        'rt.table_number',
        'rt.location as table_location',
        'u.first_name',
        'u.last_name',
        'w.first_name as waiter_first_name',
        'w.last_name as waiter_last_name',
        'r.name as restaurant_name',
        'tk.name as kitchen_name'
      )
      .join('restaurant_tables as rt', 'o.table_id', 'rt.id')
      .join('users as u', 'o.user_id', 'u.id')
      .leftJoin('users as w', 'o.waiter_id', 'w.id')
      .leftJoin('restaurants as r', 'o.restaurant_id', 'r.id')
      .leftJoin('restaurants as tk', 'o.target_kitchen_id', 'tk.id')
      .where('o.target_kitchen_id', kitchenId)
      .orderBy('o.kitchen_assigned_at', 'asc');
    
    if (status) {
      query = query.where('o.kitchen_status', status);
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
    console.error('Get kitchen orders error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch kitchen orders'
      }
    });
  }
};

/**
 * Accept order in kitchen
 * POST /api/v1/restaurant/kitchen/:kitchenId/orders/:orderId/accept
 */
const acceptKitchenOrder = async (req, res) => {
  try {
    const { kitchenId, orderId } = req.params;
    const { estimated_time, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Verify user has chef/bartender access to this kitchen
    if (!['admin', 'manager'].includes(userRole)) {
      const hasAccess = await Restaurant.relatedQuery('staff')
        .for(kitchenId)
        .where('users.id', userId)
        .where('restaurant_staff.role', 'in', ['chef', 'bartender'])
        .where('restaurant_staff.is_active', true)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You do not have chef/bartender access to this kitchen'
          }
        });
      }
    }
    
    // Get the order
    const order = await db('orders')
      .where('id', orderId)
      .first();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Order is already ${order.status}`
        }
      });
    }
    
    // Start transaction
    const trx = await db.transaction();
    
    try {
      // Update order status
      const updateData = {
        status: 'preparing', // Move order to preparing status when accepted by kitchen
        started_at: new Date(),
        updated_at: new Date()
      };

      if (estimated_time) {
        updateData.estimated_preparation_time = parseInt(estimated_time);
      }

      if (notes) {
        updateData.special_instructions = (updateData.special_instructions || '') +
          (updateData.special_instructions ? '\n\nKitchen Notes: ' : 'Kitchen Notes: ') + notes;
      }
      
      await trx('orders')
        .where('id', orderId)
        .update(updateData);
      
      // Log the acceptance
      await trx('order_kitchen_logs').insert({
        id: uuidv4(),
        order_id: orderId,
        restaurant_id: kitchenId,
        action: 'accepted',
        performed_by: userId,
        notes: notes || null,
        created_at: new Date()
      });
      
      await trx.commit();
      
      // Emit Socket.io event for order acceptance
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        const kitchenDetails = await Restaurant.query().findById(kitchenId);
        socketHandler.emitKitchenOrderAction({
          orderId,
          orderNumber: order.order_number,
          action: 'accepted',
          kitchenName: kitchenDetails?.name || 'Kitchen',
          estimatedTime: estimated_time,
          notes: notes,
          chefId: userId,
          waiterId: order.waiter_id
        });
      }
      
      // Get updated order details
      const updatedOrder = await getOrderDetails(orderId);
      
      return res.status(200).json({
        success: true,
        data: { order: updatedOrder },
        message: 'Order accepted in kitchen'
      });
      
    } catch (error) {
      await trx.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Accept kitchen order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to accept order in kitchen'
      }
    });
  }
};

/**
 * Reject order in kitchen
 * POST /api/v1/restaurant/kitchen/:kitchenId/orders/:orderId/reject
 */
const rejectKitchenOrder = async (req, res) => {
  try {
    const { kitchenId, orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rejection reason is required'
        }
      });
    }
    
    // Verify user has chef/bartender access to this kitchen
    if (!['admin', 'manager'].includes(userRole)) {
      const hasAccess = await Restaurant.relatedQuery('staff')
        .for(kitchenId)
        .where('users.id', userId)
        .where('restaurant_staff.role', 'in', ['chef', 'bartender'])
        .where('restaurant_staff.is_active', true)
        .first();
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You do not have chef/bartender access to this kitchen'
          }
        });
      }
    }
    
    // Get the order
    const order = await db('orders')
      .where('id', orderId)
      .first();
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found in this kitchen'
        }
      });
    }
    
    if (!['pending', 'preparing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot reject order with status ${order.status}`
        }
      });
    }
    
    // Start transaction
    const trx = await db.transaction();
    
    try {
      // Update order status
      await trx('orders')
        .where('id', orderId)
        .update({
          status: 'cancelled', // Mark order as cancelled when rejected by kitchen
          special_instructions: (order.special_instructions || '') +
            (order.special_instructions ? '\n\nKitchen Rejection: ' : 'Kitchen Rejection: ') + reason,
          updated_at: new Date()
        });
      
      // Log the rejection
      await trx('order_kitchen_logs').insert({
        id: uuidv4(),
        order_id: orderId,
        restaurant_id: kitchenId,
        action: 'rejected',
        performed_by: userId,
        notes: reason,
        created_at: new Date()
      });
      
      await trx.commit();
      
      // Emit Socket.io event for order rejection
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        const kitchenDetails = await Restaurant.query().findById(kitchenId);
        socketHandler.emitKitchenOrderAction({
          orderId,
          orderNumber: order.order_number,
          action: 'rejected',
          kitchenName: kitchenDetails?.name || 'Kitchen',
          reason: reason,
          chefId: userId,
          waiterId: order.waiter_id
        });
      }
      
      // Get updated order details
      const updatedOrder = await getOrderDetails(orderId);
      
      return res.status(200).json({
        success: true,
        data: { order: updatedOrder },
        message: 'Order rejected in kitchen'
      });
      
    } catch (error) {
      await trx.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Reject kitchen order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to reject order in kitchen'
      }
    });
  }
};

/**
 * Transfer order to different kitchen
 * POST /api/v1/restaurant/orders/:orderId/transfer
 */
const transferOrderToKitchen = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { target_kitchen_id, reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!target_kitchen_id || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Target kitchen and reason are required'
        }
      });
    }
    
    // Only waiters, managers, and admins can transfer orders
    if (!['waiter', 'manager', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only waiters, managers, and admins can transfer orders'
        }
      });
    }
    
    // Verify target kitchen exists
    const targetKitchen = await Restaurant.query()
      .findById(target_kitchen_id)
      .where('has_kitchen', true)
      .where('is_active', true);
    
    if (!targetKitchen) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'KITCHEN_NOT_FOUND',
          message: 'Target kitchen not found or not active'
        }
      });
    }
    
    // Get the order
    const order = await db('orders')
      .where('id', orderId)
      .first();
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    // Check if waiter owns the order
    if (userRole === 'waiter' && order.waiter_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only transfer your own orders'
        }
      });
    }
    
    const oldKitchenId = order.target_kitchen_id;
    
    // Start transaction
    const trx = await db.transaction();
    
    try {
      // Update order
      await trx('orders')
        .where('id', orderId)
        .update({
          target_kitchen_id,
          kitchen_status: 'pending',
          kitchen_assigned_at: new Date(),
          kitchen_accepted_at: null,
          kitchen_rejected_at: null,
          kitchen_notes: null,
          updated_at: new Date()
        });
      
      // Log the transfer
      await trx('order_kitchen_logs').insert({
        id: uuidv4(),
        order_id: orderId,
        restaurant_id: target_kitchen_id,
        action: 'transferred',
        performed_by: userId,
        notes: `Transferred from kitchen ${oldKitchenId}. Reason: ${reason}`,
        created_at: new Date()
      });
      
      await trx.commit();
      
      // Get updated order details
      const updatedOrder = await getOrderDetails(orderId);
      
      return res.status(200).json({
        success: true,
        data: { order: updatedOrder },
        message: 'Order transferred to new kitchen'
      });
      
    } catch (error) {
      await trx.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Transfer order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to transfer order'
      }
    });
  }
};

/**
 * Get kitchen logs for an order
 * GET /api/v1/restaurant/orders/:orderId/kitchen-logs
 */
const getOrderKitchenLogs = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Get order to check permissions
    const order = await db('orders')
      .where('id', orderId)
      .first();
    
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
          message: 'You can only view logs for your own orders'
        }
      });
    }
    
    if (userRole === 'waiter' && order.waiter_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only view logs for orders assigned to you'
        }
      });
    }
    
    // Get kitchen logs
    const logs = await db('order_kitchen_logs as okl')
      .select(
        'okl.*',
        'r.name as kitchen_name',
        'u.first_name',
        'u.last_name'
      )
      .join('restaurants as r', 'okl.restaurant_id', 'r.id')
      .join('users as u', 'okl.performed_by', 'u.id')
      .where('okl.order_id', orderId)
      .orderBy('okl.created_at', 'asc');
    
    return res.status(200).json({
      success: true,
      data: {
        logs,
        totalLogs: logs.length
      }
    });
    
  } catch (error) {
    console.error('Get order kitchen logs error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch kitchen logs'
      }
    });
  }
};

/**
 * Get kitchen dashboard data for chefs
 * GET /api/v1/restaurant/kitchen/dashboard
 */
const getKitchenDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { restaurant_id } = req.query;
    
    if (!['chef', 'bartender', 'manager', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only kitchen staff can access kitchen dashboard'
        }
      });
    }
    
    // Use the kitchen dashboard function from migration
    const dashboardData = await db.raw(
      'SELECT * FROM get_kitchen_dashboard_orders(?)',
      [restaurant_id || null]
    );
    
    // Group items by order
    const ordersMap = new Map();
    
    dashboardData.rows.forEach(row => {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          id: row.order_id,
          orderNumber: row.order_number,
          tableNumber: row.table_number,
          customerName: row.customer_name,
          waiterName: row.waiter_name,
          orderType: row.order_type,
          placedAt: row.placed_at,
          specialInstructions: row.special_instructions,
          items: []
        });
      }
      
      ordersMap.get(row.order_id).items.push({
        id: row.item_id,
        name: row.item_name,
        quantity: row.item_quantity,
        status: row.item_status,
        specialInstructions: row.item_special_instructions,
        preparationTime: row.preparation_time,
        acceptedAt: row.accepted_at,
        startedPreparingAt: row.started_preparing_at,
        readyAt: row.ready_at,
        chefNotes: row.chef_notes
      });
    });
    
    const orders = Array.from(ordersMap.values());
    
    // Get summary statistics
    const stats = {
      totalPendingOrders: orders.filter(o => o.items.some(i => i.status === 'pending')).length,
      totalAcceptedOrders: orders.filter(o => o.items.some(i => i.status === 'accepted')).length,
      totalPreparingOrders: orders.filter(o => o.items.some(i => i.status === 'preparing')).length,
      totalPendingItems: orders.reduce((sum, o) => sum + o.items.filter(i => i.status === 'pending').length, 0),
      totalAcceptedItems: orders.reduce((sum, o) => sum + o.items.filter(i => i.status === 'accepted').length, 0),
      totalPreparingItems: orders.reduce((sum, o) => sum + o.items.filter(i => i.status === 'preparing').length, 0)
    };
    
    return res.status(200).json({
      success: true,
      data: {
        orders,
        stats
      }
    });
    
  } catch (error) {
    console.error('Get kitchen dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch kitchen dashboard'
      }
    });
  }
};

/**
 * Generate bill for order
 * POST /api/v1/restaurant/orders/:orderId/bill
 */
const generateBill = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Get order details
    const orderDetails = await getOrderDetails(orderId);
    
    if (!orderDetails) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    // Check permissions
    if (userRole === 'customer' && orderDetails.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only generate bills for your own orders'
        }
      });
    }
    
    if (userRole === 'waiter' && orderDetails.waiter_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only generate bills for orders assigned to you'
        }
      });
    }
    
    // Calculate bill details
    const billData = {
      orderId,
      orderNumber: orderDetails.order_number,
      customer: {
        name: `${orderDetails.first_name} ${orderDetails.last_name}`,
        phone: orderDetails.phone
      },
      table: {
        number: orderDetails.table_number,
        location: orderDetails.table_location
      },
      items: orderDetails.items.map(item => ({
        name: item.item_name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        totalPrice: parseFloat(item.total_price)
      })),
      summary: {
        subtotal: parseFloat(orderDetails.total_amount),
        tax: parseFloat(orderDetails.tax_amount || 0),
        total: parseFloat(orderDetails.total_amount) + parseFloat(orderDetails.tax_amount || 0)
      },
      generatedAt: new Date(),
      generatedBy: {
        id: userId,
        name: `${req.user.first_name} ${req.user.last_name}`,
        role: userRole
      }
    };
    
    // Check if order is ready for billing
    if (!['ready', 'served'].includes(orderDetails.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_NOT_READY_FOR_BILLING',
          message: 'Order must be ready or served before generating bill'
        }
      });
    }

    // Update order status to indicate bill generated
    await db('orders')
      .where('id', orderId)
      .update({
        status: 'billed',
        billed_at: new Date(),
        updated_at: new Date()
      });
    
    // Emit Socket.io event for bill generation
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.emitOrderStatusUpdate({
        orderId,
        orderNumber: orderDetails.order_number,
        status: 'billed',
        userId,
        userRole,
        waiterId: orderDetails.waiter_id
      });
    }
    
    return res.status(200).json({
      success: true,
      data: { bill: billData },
      message: 'Bill generated successfully'
    });
    
  } catch (error) {
    console.error('Generate bill error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to generate bill'
      }
    });
  }
};

/**
 * Request payment for order (update status to payment_pending)
 * POST /api/v1/restaurant/orders/:orderId/request-payment
 */
const requestPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('💳 [ORDER] Requesting payment for order:', orderId);

    // Get order details
    const orderDetails = await getOrderDetails(orderId);

    if (!orderDetails) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Check permissions
    if (userRole === 'customer' && orderDetails.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only request payment for your own orders'
        }
      });
    }

    // Check if order is billed
    if (orderDetails.status !== 'billed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_NOT_BILLED',
          message: 'Order must be billed before requesting payment'
        }
      });
    }

    // Update order status to payment_pending
    await db('orders')
      .where('id', orderId)
      .update({
        status: 'payment_pending',
        payment_requested_at: new Date(),
        updated_at: new Date()
      });

    // Emit Socket.io event for payment request
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.emitOrderStatusUpdate({
        orderId,
        orderNumber: orderDetails.order_number,
        status: 'payment_pending',
        userId,
        userRole,
        waiterId: orderDetails.waiter_id
      });
    }

    console.log('💳 [ORDER] Payment requested for order:', orderDetails.order_number);

    return res.status(200).json({
      success: true,
      data: {
        orderId,
        orderNumber: orderDetails.order_number,
        status: 'payment_pending',
        totalAmount: orderDetails.total_amount,
        taxAmount: orderDetails.tax_amount
      },
      message: 'Payment requested successfully'
    });

  } catch (error) {
    console.error('❌ [ORDER] Request payment error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to request payment'
      }
    });
  }
};

/**
 * Mark order as completed
 * POST /api/v1/restaurant/orders/:orderId/complete
 */
const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('✅ [ORDER] Completing order:', orderId);

    // Get order details
    const orderDetails = await getOrderDetails(orderId);

    if (!orderDetails) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Check if order is paid or can be completed without payment
    if (!['paid', 'served'].includes(orderDetails.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_NOT_READY_FOR_COMPLETION',
          message: 'Order must be paid or served before completion'
        }
      });
    }

    // Update order status to completed
    await db('orders')
      .where('id', orderId)
      .update({
        status: 'completed',
        completed_at: new Date(),
        updated_at: new Date()
      });

    // Emit Socket.io event for order completion
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler) {
      socketHandler.emitOrderStatusUpdate({
        orderId,
        orderNumber: orderDetails.order_number,
        status: 'completed',
        userId,
        userRole,
        waiterId: orderDetails.waiter_id
      });
    }

    console.log('✅ [ORDER] Order completed:', orderDetails.order_number);

    return res.status(200).json({
      success: true,
      data: {
        orderId,
        orderNumber: orderDetails.order_number,
        status: 'completed',
        completedAt: new Date()
      },
      message: 'Order completed successfully'
    });

  } catch (error) {
    console.error('❌ [ORDER] Complete order error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to complete order'
      }
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderItemStatus,
  addOrderItems,
  generateBill,
  requestPayment,
  completeOrder,
  // Kitchen management
  getKitchenDashboard,
  getKitchenOrders,
  acceptKitchenOrder,
  rejectKitchenOrder,
  transferOrderToKitchen,
  getOrderKitchenLogs
};
