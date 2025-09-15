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
        console.error('🔥 [SOCKET] Database connection health check failed: - socketHandler.js:20', error.message);
      }
    }, 30000); // Check every 30 seconds
  }

  setupSocketIO() {
    // Temporarily disable authentication for table status updates
    this.io.use(async (socket, next) => {
      let retryCount = 0;
      const maxRetries = 3;

      const authenticate = async () => {
        try {
          console.log(`🔐 [SOCKET] Authenticating socket: ${socket.id} - socketHandler.js:33`);
          const token = socket.handshake.auth.token;
          if (!token) {
            console.log(`❌ [SOCKET] No token provided for socket: ${socket.id} - socketHandler.js:36`);
            return next(new Error('Authentication error: No token provided'));
          }

          console.log(`🔐 [SOCKET] Token found, verifying JWT for socket: ${socket.id} - socketHandler.js:40`);
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log(`🔐 [SOCKET] JWT verified, decoded payload: - socketHandler.js:42`, decoded);
          console.log(`🔐 [SOCKET] Available fields: - socketHandler.js:43`, Object.keys(decoded));
          console.log(`🔐 [SOCKET] User ID field (userId): - socketHandler.js:44`, decoded.userId);
          console.log(`🔐 [SOCKET] User ID field (id): - socketHandler.js:45`, decoded.id);

          // Use direct database query with timeout and retry logic
          const userId = decoded.userId || decoded.id; // Support both field names
          console.log(`🔐 [SOCKET] Using user ID: ${userId} - socketHandler.js:49`);

          console.log(`🔐 [SOCKET] Executing database query for user: ${userId} - socketHandler.js:51`);
          console.log(`🔐 [SOCKET] Database connection available: - socketHandler.js:52`, !!db);

          // Query database for user verification
          let user;
          try {
            user = await db('users')
              .where('id', userId)
              .where('is_active', true)
              .timeout(5000) // 5 second timeout
              .first();

            console.log(`🔐 [SOCKET] Database query result: - socketHandler.js:63`, user ? 'User found' : 'User not found');
          } catch (dbError) {
            console.log(`🔐 [SOCKET] Database query failed: - socketHandler.js:65`, dbError.message);
            // For now, create a mock user to keep socket working while we debug DB issues
            user = {
              id: userId,
              email: decoded.email,
              role: decoded.role,
              first_name: decoded.email.split('@')[0],
              last_name: 'User',
              is_active: true
            };
            console.log(`🔐 [SOCKET] Using fallback user: - socketHandler.js:75`, user);
          }

          if (!user) {
            console.log(`❌ [SOCKET] User not found in database: ${userId} - socketHandler.js:79`);
            return next(new Error('Authentication error: User not found'));
          }

          socket.user = user;
          console.log(`✅ [SOCKET] User authenticated: ${user.first_name} ${user.last_name} (${user.role}) - socketHandler.js:84`);
          next();
        } catch (err) {
          console.error(`❌ [SOCKET] Authentication error (attempt ${retryCount + 1}): - socketHandler.js:87`, err.message);

          // Retry on database connection errors
          if ((err.code === 'ECONNRESET' || err.message.includes('Connection terminated') || err.message.includes('timeout')) && retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 [SOCKET] Retrying authentication (${retryCount}/${maxRetries}) - socketHandler.js:92`);
            setTimeout(authenticate, 1000 * retryCount); // Exponential backoff
            return;
          }

          next(new Error('Authentication error: Invalid token or database connection issue'));
        }
      };

      authenticate();
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 [SOCKET] New socket connection attempt: ${socket.id} - socketHandler.js:105`);
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    const user = socket.user;
    console.log(`🔌 User ${user.first_name} ${user.last_name} (${user.role}) connected: ${socket.id} - socketHandler.js:112`);
    
    // Store connected user
    this.connectedUsers.set(user.id, socket);
    this.userRooms.set(user.id, []);

    // Handle user room joining
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      this.addUserToRoom(userId, `user-${userId}`);
      console.log(`👤 [SOCKET] User ${user.first_name} joined room: user${userId} - socketHandler.js:122`);
      console.log(`👤 [SOCKET] User ${user.first_name} current rooms: - socketHandler.js:123`, Array.from(socket.rooms));
    });

    // Handle role-specific room joining
    socket.on('join-kitchen-room', (role) => {
      if (['chef', 'bartender'].includes(role)) {
        socket.join(`kitchen-${role}`);
        this.addUserToRoom(user.id, `kitchen-${role}`);
        console.log(`👨‍🍳 [SOCKET] ${user.first_name} joined kitchen room: kitchen${role} - socketHandler.js:131`);
        console.log(`👨‍🍳 [SOCKET] ${user.first_name} current rooms: - socketHandler.js:132`, Array.from(socket.rooms));
      }
    });

    socket.on('join-waiter-room', () => {
      if (user.role === 'waiter') {
        socket.join('waiters');
        this.addUserToRoom(user.id, 'waiters');
        console.log(`🍽️ [SOCKET] Waiter ${user.first_name} joined waiters room - socketHandler.js:140`);
        console.log(`🍽️ [SOCKET] Waiter ${user.first_name} current rooms: - socketHandler.js:141`, Array.from(socket.rooms));
      }
    });

    socket.on('join-manager-room', () => {
      if (['manager', 'admin'].includes(user.role)) {
        socket.join('managers');
        this.addUserToRoom(user.id, 'managers');
        console.log(`📋 [SOCKET] Manager ${user.first_name} joined managers room - socketHandler.js:149`);
        console.log(`📋 [SOCKET] Manager ${user.first_name} current rooms: - socketHandler.js:150`, Array.from(socket.rooms));
      }
    });

    // Handle order events
    socket.on('new-order-submitted', (data) => {
      console.log('📝 New order submitted: - socketHandler.js:156', data);
      this.handleNewOrderSubmitted(data);
    });
    socket.on('add-order-items', (data) => {
      console.log('📝 New order submitted: - socketHandler.js:160', data);
      this.handleAddOrderItems(data);
    });

    socket.on('order-status-update', (data) => {
      console.log('📊 Order status update: - socketHandler.js:165', data);
      this.handleOrderStatusUpdate(data);
    });
     socket.on('order-item-status-update', (data) => {

      console.log('🍽️ Order item status update: - socketHandler.js:170', data);

      this.handleOrderItemStatusUpdate(data);

    });
    // Handle kitchen events
    socket.on('kitchen-order-action', (data) => {
      console.log('🍳 Kitchen order action: - socketHandler.js:177', data);
      this.handleKitchenOrderAction(data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User ${user.first_name} ${user.last_name} disconnected: ${socket.id} - socketHandler.js:183`);
      this.connectedUsers.delete(user.id);
      this.userRooms.delete(user.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error: - socketHandler.js:190', error);
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
    
    console.log(`📊 [SOCKET] Handling order status update: - socketHandler.js:270`, data);
    console.log(`📊 [SOCKET] Connected users count: ${this.connectedUsers.size} - socketHandler.js:271`);
    console.log(`📊 [SOCKET] Will notify waiter: ${waiterId} - socketHandler.js:272`);

    // Notify the waiter who created the order
    if (data.waiterId) {
      console.log(`📊 [SOCKET] Emitting to waiter room: user${data.waiterId} - socketHandler.js:276`);
      this.io.to(`user-${data.waiterId}`).emit('order-status-updated', {
        orderId,
        orderNumber,
        status,
        timestamp: new Date()
      });
    } else {
      // Only notify all waiters if no specific waiter is assigned (to avoid duplicates)
      console.log(`🍽️ [SOCKET] No specific waiter, emitting to waiters room - socketHandler.js:285`);
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

    console.log(`📦 [SOCKET] Item status update  Order: ${orderNumber}, Item: ${itemId}, Status: ${status} - socketHandler.js:316`);
    console.log(`📦 [SOCKET] Updated by: ${updatedBy} (${updatedByRole}) - socketHandler.js:317`);
    console.log(`📦 [SOCKET] Notifying waiter: ${waiterId}, customer: ${customerId} - socketHandler.js:318`);

    // Notify the specific waiter who created the order
    if (waiterId) {
      console.log(`📦 [SOCKET] Emitting to waiter room: user${waiterId} - socketHandler.js:322`);
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
      console.log(`📦 [SOCKET] No specific waiter, emitting to waiters room - socketHandler.js:335`);
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
    console.log(`📦 [SOCKET] Emitting to kitchen rooms - socketHandler.js:360`);
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
    console.log(`📦 [SOCKET] Emitting to managers room - socketHandler.js:384`);
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
    const { tableId, booking_status, restaurantId } = tableData;

    // Notify all connected users about table status changes
    this.io.emit('table_status_updated', {
      table_id: tableId,
      booking_status,
      restaurantId,
      timestamp: new Date()
    });
  }

  emitTableDeleted(tableData) {
    const { tableId, restaurantId } = tableData;

    // Notify all connected users about table deletion
    this.io.emit('table_deleted', {
      table_id: tableId,
      restaurantId,
      timestamp: new Date()
    });
  }

  emitTableCreated(tableData) {
    const { table, restaurantId } = tableData;

    // Notify all connected users about new table creation
    this.io.emit('table_created', {
      table,
      restaurant_id: restaurantId,
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
        console.log(`🔍 [SOCKET] Checking order status for order: ${orderId}, item status: ${itemStatus} - socketHandler.js:591`);

        // Use a transaction to ensure data consistency with timeout
        const result = await db.transaction(async (trx) => {
          // Get all items for this order
          const orderItems = await trx('order_items')
            .where('order_id', orderId)
            .select('id', 'status')
            .timeout(10000); // 10 second timeout

          console.log(`🔍 [SOCKET] Order ${orderId} has ${orderItems.length} items - socketHandler.js:601`);

          // Get current order status
          const order = await trx('orders')
            .where('id', orderId)
            .timeout(10000)
            .first();

          if (!order) {
            console.log(`❌ [SOCKET] Order ${orderId} not found - socketHandler.js:610`);
            return null;
          }

          console.log(`🔍 [SOCKET] Current order status: ${order.status} - socketHandler.js:614`);

          // Check if all items are ready
          const allItemsReady = orderItems.every(item => item.status === 'ready');
          const anyItemPreparing = orderItems.some(item => item.status === 'preparing');

          console.log(`🔍 [SOCKET] All items ready: ${allItemsReady}, Any item preparing: ${anyItemPreparing} - socketHandler.js:620`);

          let newOrderStatus = null;

          // Determine new order status based on item statuses
          if (allItemsReady && order.status !== 'ready') {
            newOrderStatus = 'ready';
            console.log(`✅ [SOCKET] All items ready, updating order to 'ready' - socketHandler.js:627`);
          } else if (anyItemPreparing && order.status === 'pending') {
            newOrderStatus = 'preparing';
            console.log(`🔄 [SOCKET] Items being prepared, updating order to 'preparing' - socketHandler.js:630`);
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

            console.log(`✅ [SOCKET] Order ${orderId} status updated to: ${newOrderStatus} - socketHandler.js:643`);

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
        console.error(`❌ [SOCKET] Error checking order status (attempt ${retryCount + 1}): - socketHandler.js:663`, error.message);

        // Retry on connection errors
        if ((error.code === 'ECONNRESET' || error.message.includes('Connection terminated') || error.message.includes('timeout')) && retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 [SOCKET] Retrying order status check (${retryCount}/${maxRetries}) - socketHandler.js:668`);
          setTimeout(executeWithRetry, 2000 * retryCount); // Exponential backoff
          return;
        }

        // Log more details about the error
        if (error.code) {
          console.error(`❌ [SOCKET] Database error code: ${error.code} - socketHandler.js:675`);
        }
        if (error.message) {
          console.error(`❌ [SOCKET] Database error message: ${error.message} - socketHandler.js:678`);
        }
      }
    };

    executeWithRetry();
  }
}

module.exports = SocketHandler;
