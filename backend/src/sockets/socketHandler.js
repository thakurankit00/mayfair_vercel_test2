const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socket mapping
    this.userRooms = new Map(); // userId -> rooms array
    this.setupSocketIO();
  }

  setupSocketIO() {
    // Temporarily disable authentication for table status updates
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId);
          if (user) {
            socket.user = user;
          }
        }
        // Allow connection even without authentication for table updates
        next();
      } catch (err) {
        // Allow connection even with invalid token for table updates
        next();
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    const user = socket.user;
    if (user) {
      console.log(`🔌 User ${user.first_name} ${user.last_name} (${user.role}) connected: ${socket.id}`);
      // Store connected user
      this.connectedUsers.set(user.id, socket);
      this.userRooms.set(user.id, []);
    } else {
      console.log(`🔌 Anonymous user connected: ${socket.id}`);
    }

    // Handle user room joining
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      this.addUserToRoom(userId, `user-${userId}`);
      console.log(`👤 User ${user.first_name} joined room: user-${userId}`);
    });

    // Handle role-specific room joining
    socket.on('join-kitchen-room', (role) => {
      if (['chef', 'bartender'].includes(role)) {
        socket.join(`kitchen-${role}`);
        this.addUserToRoom(user.id, `kitchen-${role}`);
        console.log(`👨‍🍳 ${user.first_name} joined kitchen room: kitchen-${role}`);
      }
    });

    socket.on('join-waiter-room', () => {
      if (user.role === 'waiter') {
        socket.join('waiters');
        this.addUserToRoom(user.id, 'waiters');
        console.log(`🍽️ Waiter ${user.first_name} joined waiters room`);
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
      if (user) {
        console.log(`🔌 User ${user.first_name} ${user.last_name} disconnected: ${socket.id}`);
        this.connectedUsers.delete(user.id);
        this.userRooms.delete(user.id);
      } else {
        console.log(`🔌 Anonymous user disconnected: ${socket.id}`);
      }
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

    // Notify the waiter who created the order
    if (data.waiterId) {
      this.io.to(`user-${data.waiterId}`).emit('order-status-updated', {
        orderId,
        orderNumber,
        status,
        timestamp: new Date()
      });
    }

    // Notify all waiters if it's a general update
    this.io.to('waiters').emit('order-status-updated', {
      orderId,
      orderNumber,
      status,
      timestamp: new Date()
    });

    // Notify managers and admins
    this.io.to('managers').emit('order-status-updated', {
      orderId,
      orderNumber,
      status,
      updatedBy: { userId, userRole },
      timestamp: new Date()
    });
  }
  handleOrderItemStatusUpdate(data) {
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

    // Notify the specific waiter who created the order
    if (waiterId) {
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

    // Notify all waiters about item status changes
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

    // Notify all kitchen staff for coordination
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
}

module.exports = SocketHandler;
