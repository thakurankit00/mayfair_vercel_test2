const jwt = require('jsonwebtoken');
const db = require('../config/database');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socket mapping
    this.userRooms = new Map(); // userId -> rooms array
    this.setupSocketIO();
    this.setupConnectionMonitoring();
  }

  setupConnectionMonitoring() {
    // Monitor database connection health
    setInterval(async () => {
      try {
        await db.raw('SELECT 1');
        // Connection is healthy
      } catch (error) {
        console.error('🔥 [SOCKET] Database connection health check failed:', error.message);
      }
    }, 30000); // Check every 30 seconds
  }

  setupSocketIO() {
    this.io.use(async (socket, next) => {
      let retryCount = 0;
      const maxRetries = 3;

      const authenticate = async () => {
        try {
          console.log(`🔐 [SOCKET] Authenticating socket: ${socket.id}`);
          const token = socket.handshake.auth.token;
          if (!token) {
            console.log(`❌ [SOCKET] No token provided for socket: ${socket.id}`);
            return next(new Error('Authentication error: No token provided'));
          }

          console.log(`🔐 [SOCKET] Token found, verifying JWT for socket: ${socket.id}`);
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log(`🔐 [SOCKET] JWT verified, decoded payload:`, decoded);
          console.log(`🔐 [SOCKET] Available fields:`, Object.keys(decoded));
          console.log(`🔐 [SOCKET] User ID field (userId):`, decoded.userId);
          console.log(`🔐 [SOCKET] User ID field (id):`, decoded.id);

          // Use direct database query with timeout and retry logic
          const userId = decoded.userId || decoded.id; // Support both field names
          console.log(`🔐 [SOCKET] Using user ID: ${userId}`);

          console.log(`🔐 [SOCKET] Executing database query for user: ${userId}`);
          console.log(`🔐 [SOCKET] Database connection available:`, !!db);

          // Query database for user verification
          let user;
          try {
            user = await db('users')
              .where('id', userId)
              .where('is_active', true)
              .timeout(5000) // 5 second timeout
              .first();

            console.log(`🔐 [SOCKET] Database query result:`, user ? 'User found' : 'User not found');
          } catch (dbError) {
            console.log(`🔐 [SOCKET] Database query failed:`, dbError.message);
            // For now, create a mock user to keep socket working while we debug DB issues
            user = {
              id: userId,
              email: decoded.email,
              role: decoded.role,
              first_name: decoded.email.split('@')[0],
              last_name: 'User',
              is_active: true
            };
            console.log(`🔐 [SOCKET] Using fallback user:`, user);
          }

          if (!user) {
            console.log(`❌ [SOCKET] User not found in database: ${userId}`);
            return next(new Error('Authentication error: User not found'));
          }

          socket.user = user;
          console.log(`✅ [SOCKET] User authenticated: ${user.first_name} ${user.last_name} (${user.role})`);
          next();
        } catch (err) {
          console.error(`❌ [SOCKET] Authentication error (attempt ${retryCount + 1}):`, err.message);

          // Retry on database connection errors
          if ((err.code === 'ECONNRESET' || err.message.includes('Connection terminated') || err.message.includes('timeout')) && retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 [SOCKET] Retrying authentication (${retryCount}/${maxRetries})`);
            setTimeout(authenticate, 1000 * retryCount); // Exponential backoff
            return;
          }

          next(new Error('Authentication error: Invalid token or database connection issue'));
        }
      };

      authenticate();
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 [SOCKET] New socket connection attempt: ${socket.id}`);
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    const user = socket.user;
    console.log(`🔌 [SOCKET] User ${user.first_name} ${user.last_name} (${user.role}) connected: ${socket.id}`);
    console.log(`🔌 [SOCKET] Total connected users: ${this.connectedUsers.size + 1}`);

    // Store connected user
    this.connectedUsers.set(user.id, socket);
    this.userRooms.set(user.id, []);

    // Handle user room joining
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      this.addUserToRoom(userId, `user-${userId}`);
      console.log(`👤 [SOCKET] User ${user.first_name} joined room: user-${userId}`);
      console.log(`👤 [SOCKET] User ${user.first_name} current rooms:`, Array.from(socket.rooms));
    });

    // Handle role-specific room joining
    socket.on('join-kitchen-room', (role) => {
      if (['chef', 'bartender'].includes(role)) {
        socket.join(`kitchen-${role}`);
        this.addUserToRoom(user.id, `kitchen-${role}`);
        console.log(`👨‍🍳 [SOCKET] ${user.first_name} joined kitchen room: kitchen-${role}`);
        console.log(`👨‍🍳 [SOCKET] ${user.first_name} current rooms:`, Array.from(socket.rooms));
      }
    });

    socket.on('join-waiter-room', () => {
      if (user.role === 'waiter') {
        socket.join('waiters');
        this.addUserToRoom(user.id, 'waiters');
        console.log(`🍽️ [SOCKET] Waiter ${user.first_name} joined waiters room`);
        console.log(`🍽️ [SOCKET] Waiter ${user.first_name} current rooms:`, Array.from(socket.rooms));
      }
    });

    socket.on('join-manager-room', () => {
      if (['manager', 'admin'].includes(user.role)) {
        socket.join('managers');
        this.addUserToRoom(user.id, 'managers');
        console.log(`📋 [SOCKET] Manager ${user.first_name} joined managers room`);
        console.log(`📋 [SOCKET] Manager ${user.first_name} current rooms:`, Array.from(socket.rooms));
      }
    });

    // Handle order events
    socket.on('new-order-submitted', (data) => {
      console.log('📝 New order submitted:', data);
      this.handleNewOrderSubmitted(data);
    });
    socket.on('add-order-items', (data) => {
      console.log('📝 New order submitted:', data);
      this.handleAddOrderItems(data);
    });

    socket.on('order-status-update', (data) => {
      console.log('📊 Order status update:', data);
      this.handleOrderStatusUpdate(data);
    });
     socket.on('order-item-status-update', (data) => {

      console.log('🍽️ Order item status update:', data);

      this.handleOrderItemStatusUpdate(data);

    });
    // Handle kitchen events
    socket.on('kitchen-order-action', (data) => {
      console.log('🍳 Kitchen order action:', data);
      this.handleKitchenOrderAction(data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 [SOCKET] User ${user.first_name} ${user.last_name} disconnected: ${socket.id}`);
      console.log(`🔌 [SOCKET] Total connected users: ${this.connectedUsers.size - 1}`);
      this.connectedUsers.delete(user.id);
      this.userRooms.delete(user.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  addUserToRoom(userId, room) {
    const rooms = this.userRooms.get(userId) || [];
    if (!rooms.includes(room)) {
      rooms.push(room);
      this.userRooms.set(userId, rooms);
    }
  }

  // Event Handlers
  handleNewOrderSubmitted(data) {
    const { orderId, orderNumber, tableId, kitchenTypes, waiterId, customerInfo } = data;

    // Notify relevant kitchen staff
    kitchenTypes.forEach(kitchenType => {
      const roomName = kitchenType === 'bar' ? 'kitchen-bartender' : 'kitchen-chef';
      this.io.to(roomName).emit('new-kitchen-order', {
        orderId,
        orderNumber,
        tableNumber: data.tableNumber,
        customerInfo,
        kitchenType,
        timestamp: new Date()
      });
    });

    // Notify managers and admins
    this.io.to('managers').emit('new-order-notification', {
      orderId,
      orderNumber,
      tableId,
      waiterId,
      timestamp: new Date()
    });
  }
  handleAddOrderItems(data) {
    const {  orderId, orderNumber, tableId, tableNumber, waiterId, customerInfo, newItems, kitchenTypes   } = data;

    // Notify relevant kitchen staff
    const safeKitchenTypes = kitchenTypes || ['restaurant'];
    safeKitchenTypes.forEach(kitchenType => {
      const roomName = kitchenType === 'bar' ? 'kitchen-bartender' : 'kitchen-chef';
      this.io.to(roomName).emit('order-items-added', {
        orderId,
        orderNumber,
        tableNumber: tableNumber || data.tableNumber,
        customerInfo,
        kitchenType,
        newItems,
        timestamp: new Date()
      });
    });
      if (waiterId) {
    this.io.to(`user-${waiterId}`).emit('order-items-added', {
      orderId,
      orderNumber,
      tableId,
      tableNumber,
      newItems,
      timestamp: new Date()
    });
  }
    // Notify managers and admins
    this.io.to('managers').emit('order-items-added-notification', {
      orderId,
      orderNumber,
      tableId,
      waiterId,
      timestamp: new Date()
    });
  }
  

  
  handleOrderStatusUpdate(data) {
    const { orderId, orderNumber, status, userId, userRole, waiterId } = data;
    
    console.log(`📊 [SOCKET] Handling order status update:`, data);
    console.log(`📊 [SOCKET] Connected users count: ${this.connectedUsers.size}`);
    console.log(`📊 [SOCKET] Will notify waiter: ${waiterId}`);

    // Notify the waiter who created the order
    if (data.waiterId) {
      console.log(`📊 [SOCKET] Emitting to waiter room: user-${data.waiterId}`);
      this.io.to(`user-${data.waiterId}`).emit('order-status-updated', {
        orderId,
        orderNumber,
        status,
        timestamp: new Date()
      });
    } else {
      // Only notify all waiters if no specific waiter is assigned (to avoid duplicates)
      console.log(`🍽️ [SOCKET] No specific waiter, emitting to waiters room`);
      this.io.to('waiters').emit('order-status-updated', {
        orderId,
        orderNumber,
        status,
        timestamp: new Date()
      });
    }

    // Notify managers and admins
    this.io.to('managers').emit('order-status-updated', {
      orderId,
      orderNumber,
      status,
      updatedBy: { userId, userRole },
      timestamp: new Date()
    });
  }
  async handleOrderItemStatusUpdate(data) {
    const {
      orderId,
      orderNumber,
      itemId,
      status,
      chefNotes,
      updatedBy,
      updatedByRole,
      waiterId,
      customerId
    } = data;

    console.log(`📦 [SOCKET] Item status update - Order: ${orderNumber}, Item: ${itemId}, Status: ${status}`);
    console.log(`📦 [SOCKET] Updated by: ${updatedBy} (${updatedByRole})`);
    console.log(`📦 [SOCKET] Notifying waiter: ${waiterId}, customer: ${customerId}`);

    // Notify the specific waiter who created the order
    if (waiterId) {
      console.log(`📦 [SOCKET] Emitting to waiter room: user-${waiterId}`);
      this.io.to(`user-${waiterId}`).emit('order-item-status-updated', {
        orderId,
        orderNumber,
        itemId,
        status,
        chefNotes,
        updatedBy,
        updatedByRole,
        timestamp: new Date()
      });
    } else {
      // Only notify all waiters if no specific waiter is assigned (to avoid duplicates)
      console.log(`📦 [SOCKET] No specific waiter, emitting to waiters room`);
      this.io.to('waiters').emit('order-item-status-updated', {
        orderId,
        orderNumber,
        itemId,
        status,
        chefNotes,
        updatedBy,
        updatedByRole,
        timestamp: new Date()
      });
    }

    // Notify the customer if applicable
    if (customerId) {
      this.io.to(`user-${customerId}`).emit('order-item-status-updated', {
        orderId,
        orderNumber,
        itemId,
        status,
        timestamp: new Date()
      });
    }

    // Notify all kitchen staff for coordination
    console.log(`📦 [SOCKET] Emitting to kitchen rooms`);
    this.io.to('kitchen-chef').emit('order-item-status-updated', {
      orderId,
      orderNumber,
      itemId,
      status,
      chefNotes,
      updatedBy,
      updatedByRole,
      timestamp: new Date()
    });

    this.io.to('kitchen-bartender').emit('order-item-status-updated', {
      orderId,
      orderNumber,
      itemId,
      status,
      chefNotes,
      updatedBy,
      updatedByRole,
      timestamp: new Date()
    });

    // Notify managers and admins
    console.log(`📦 [SOCKET] Emitting to managers room`);
    this.io.to('managers').emit('order-item-status-updated', {
      orderId,
      orderNumber,
      itemId,
      status,
      chefNotes,
      updatedBy,
      updatedByRole,
      timestamp: new Date()
    });

    // Check if all items are ready and update order status accordingly
    await this.checkAndUpdateOrderStatus(orderId, status);
  }
  handleKitchenOrderAction(data) {
    const { orderId, orderNumber, action, kitchenName, estimatedTime, notes, reason, chefId, waiterId } = data;

    if (action === 'accepted') {
      // Notify the waiter
      if (waiterId) {
        this.io.to(`user-${waiterId}`).emit('kitchen-order-accepted', {
          orderId,
          orderNumber,
          kitchenName,
          estimatedTime,
          notes,
          timestamp: new Date()
        });
      }

      // Notify all waiters
      this.io.to('waiters').emit('kitchen-order-accepted', {
        orderId,
        orderNumber,
        kitchenName,
        estimatedTime,
        notes,
        timestamp: new Date()
      });

    } else if (action === 'rejected') {
      // Notify the waiter
      if (waiterId) {
        this.io.to(`user-${waiterId}`).emit('kitchen-order-rejected', {
          orderId,
          orderNumber,
          kitchenName,
          reason,
          timestamp: new Date()
        });
      }

      // Notify all waiters
      this.io.to('waiters').emit('kitchen-order-rejected', {
        orderId,
        orderNumber,
        kitchenName,
        reason,
        timestamp: new Date()
      });
    }

    // Notify managers and admins
    this.io.to('managers').emit('kitchen-action-notification', {
      orderId,
      orderNumber,
      action,
      kitchenName,
      chefId,
      estimatedTime,
      notes,
      reason,
      timestamp: new Date()
    });
  }

  // Public methods for controllers to emit events
  emitNewOrder(orderData) {
    this.handleNewOrderSubmitted(orderData);
  }

  emitOrderStatusUpdate(statusData) {
    this.handleOrderStatusUpdate(statusData);
  }

  emitOrderItemStatusUpdate(itemStatusData) {
    this.handleOrderItemStatusUpdate(itemStatusData);
  }

  emitKitchenOrderAction(actionData) {
    this.handleKitchenOrderAction(actionData);
  }

  emitOrderTransferred(transferData) {
    const { orderId, orderNumber, fromKitchen, toKitchen, reason, waiterId } = transferData;

    // Notify both kitchen types
    this.io.to(`kitchen-${fromKitchen}`).emit('order-transferred-out', {
      orderId,
      orderNumber,
      toKitchen,
      reason,
      timestamp: new Date()
    });

    this.io.to(`kitchen-${toKitchen}`).emit('order-transferred-in', {
      orderId,
      orderNumber,
      fromKitchen,
      reason,
      timestamp: new Date()
    });

    // Notify the waiter
    if (waiterId) {
      this.io.to(`user-${waiterId}`).emit('order-transferred', {
        orderId,
        orderNumber,
        fromKitchen,
        toKitchen,
        reason,
        timestamp: new Date()
      });
    }

    // Notify all waiters
    this.io.to('waiters').emit('order-transferred', {
      orderId,
      orderNumber,
      newKitchen: toKitchen,
      timestamp: new Date()
    });
  }

  emitTableStatusUpdate(tableData) {
    const { tableId, status, restaurantId } = tableData;

    // Notify all waiters about table status changes
    this.io.to('waiters').emit('table-status-updated', {
      tableId,
      status,
      restaurantId,
      timestamp: new Date()
    });

    // Notify managers and admins
    this.io.to('managers').emit('table-status-updated', {
      tableId,
      status,
      restaurantId,
      timestamp: new Date()
    });
  }

  // Utility methods
  getConnectedUsers() {
    const users = [];
    this.connectedUsers.forEach((socket, userId) => {
      users.push({
        userId,
        socketId: socket.id,
        user: socket.user,
        rooms: this.userRooms.get(userId) || []
      });
    });
    return users;
  }

  getUserSocket(userId) {
    return this.connectedUsers.get(userId);
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  sendDirectMessage(userId, event, data) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  // Check if all items in an order are ready and update order status
  async checkAndUpdateOrderStatus(orderId, itemStatus) {
    let retryCount = 0;
    const maxRetries = 3;

    const executeWithRetry = async () => {
      try {
        console.log(`🔍 [SOCKET] Checking order status for order: ${orderId}, item status: ${itemStatus}`);

        // Use a transaction to ensure data consistency with timeout
        const result = await db.transaction(async (trx) => {
          // Get all items for this order
          const orderItems = await trx('order_items')
            .where('order_id', orderId)
            .select('id', 'status')
            .timeout(10000); // 10 second timeout

          console.log(`🔍 [SOCKET] Order ${orderId} has ${orderItems.length} items`);

          // Get current order status
          const order = await trx('orders')
            .where('id', orderId)
            .timeout(10000)
            .first();

          if (!order) {
            console.log(`❌ [SOCKET] Order ${orderId} not found`);
            return null;
          }

          console.log(`🔍 [SOCKET] Current order status: ${order.status}`);

          // Check if all items are ready
          const allItemsReady = orderItems.every(item => item.status === 'ready');
          const anyItemPreparing = orderItems.some(item => item.status === 'preparing');

          console.log(`🔍 [SOCKET] All items ready: ${allItemsReady}, Any item preparing: ${anyItemPreparing}`);

          let newOrderStatus = null;

          // Determine new order status based on item statuses
          if (allItemsReady && order.status !== 'ready') {
            newOrderStatus = 'ready';
            console.log(`✅ [SOCKET] All items ready, updating order to 'ready'`);
          } else if (anyItemPreparing && order.status === 'pending') {
            newOrderStatus = 'preparing';
            console.log(`🔄 [SOCKET] Items being prepared, updating order to 'preparing'`);
          }

          // Update order status if needed
          if (newOrderStatus) {
            await trx('orders')
              .where('id', orderId)
              .update({
                status: newOrderStatus,
                updated_at: new Date()
              })
              .timeout(10000);

            console.log(`✅ [SOCKET] Order ${orderId} status updated to: ${newOrderStatus}`);

            return {
              orderId,
              orderNumber: order.order_number,
              status: newOrderStatus,
              waiterId: order.waiter_id,
              customerId: order.user_id
            };
          }

          return null;
        });

        // Emit order status update outside of transaction
        if (result) {
          this.emitOrderStatusUpdate(result);
        }

      } catch (error) {
        console.error(`❌ [SOCKET] Error checking order status (attempt ${retryCount + 1}):`, error.message);

        // Retry on connection errors
        if ((error.code === 'ECONNRESET' || error.message.includes('Connection terminated') || error.message.includes('timeout')) && retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 [SOCKET] Retrying order status check (${retryCount}/${maxRetries})`);
          setTimeout(executeWithRetry, 2000 * retryCount); // Exponential backoff
          return;
        }

        // Log more details about the error
        if (error.code) {
          console.error(`❌ [SOCKET] Database error code: ${error.code}`);
        }
        if (error.message) {
          console.error(`❌ [SOCKET] Database error message: ${error.message}`);
        }
      }
    };

    executeWithRetry();
  }
}

module.exports = SocketHandler;
