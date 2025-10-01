import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  console.log('🔌 [SOCKET] SocketProvider initialized');
  console.log('🔌 [SOCKET] React version:', React.version);
  console.log('🔌 [SOCKET] Socket.io client available:', typeof io === 'function');

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [toastNotifications, setToastNotifications] = useState([]);
  const { user } = useAuth();

  // Get token directly from localStorage since AuthContext doesn't expose it
  const token = localStorage.getItem('token');
  console.log('🔌 [SOCKET] Auth context:', { user: user?.first_name, token: token ? 'Present' : 'Missing' });
  console.log('🔌 [SOCKET] Token value:', token ? `${token.substring(0, 20)}...` : 'null');
  console.log('🔌 [SOCKET] LocalStorage keys:', Object.keys(localStorage));

  useEffect(() => {
    console.log('🔌 [SOCKET] useEffect triggered');
    console.log('🔌 [SOCKET] User:', user);
    console.log('🔌 [SOCKET] Token:', token ? 'Present' : 'Missing');

    // Debug: Check if user exists but token is missing
    if (user && !token) {
      console.log('⚠️ [SOCKET] User exists but token is missing - this might be an auth issue');
      console.log('⚠️ [SOCKET] User object:', user);
    }

    if (user && token) {
      console.log('🔌 [SOCKET] Initializing socket connection...');
      console.log('🔌 [SOCKET] User:', user?.first_name || 'Test', user?.last_name || 'User', 'Role:', user?.role || 'waiter');
      console.log('🔌 [SOCKET] Token length:', token?.length || 'No token');

      // Initialize socket connection
      const socketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
      console.log('🔌 [SOCKET] Connecting to:', socketUrl);
      console.log('🔌 [SOCKET] Auth token length:', token?.length);
      console.log('🔌 [SOCKET] User ID:', user.id);
      console.log('🔌 [SOCKET] User role:', user.role);

      const newSocket = io(socketUrl, {
        auth: {
          token: token || 'test-token'
        },
        query: {
          userId: user?.id || 'test-user-id',
          role: user?.role || 'waiter'
        },
        transports: ['websocket', 'polling'], // Ensure both transports are available
        timeout: 20000, // 20 second timeout
        forceNew: true // Force a new connection
      });

      console.log('🔌 [SOCKET] Socket instance created:', newSocket.id);

      // Make socket available globally for debugging
      window.debugSocket = newSocket;
      console.log('🔌 [SOCKET] Socket available as window.debugSocket for debugging');

      newSocket.on('connect', () => {
        console.log('🔌 Connected to server via Socket.io');
        console.log('👤 User:', user.first_name, user.last_name, 'Role:', user.role);
        console.log('🔌 Socket ID:', newSocket.id);
        console.log('🔌 Socket connected:', newSocket.connected);
        setIsConnected(true);

        // Join user-specific room
        console.log('🏠 Joining user room:', user.id);
        newSocket.emit('join-user-room', user.id);

        // Join role-specific rooms
        if (['chef', 'bartender'].includes(user.role)) {
          console.log('🍳 Joining kitchen room:', user.role);
          newSocket.emit('join-kitchen-room', user.role);
        } else if (user.role === 'waiter') {
          console.log('🍽️ Joining waiter room');
          newSocket.emit('join-waiter-room');
        } else if (['manager', 'admin'].includes(user.role)) {
          console.log('📋 Joining manager room');
          newSocket.emit('join-manager-room');
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from server. Reason:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🔥 Socket connection error:', error);
        console.error('🔥 Error type:', error.type);
        console.error('🔥 Error description:', error.description);
        console.error('🔥 Error context:', error.context);
        console.error('🔥 Error transport:', error.transport);
        setIsConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected to server after', attemptNumber, 'attempts');
        setIsConnected(true);
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Attempting to reconnect...', attemptNumber);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('🔥 Reconnection error:', error);
      });

      // Order-related events
      newSocket.on('order-status-updated', (data) => {
        console.log('🎆 [FRONTEND SOCKET] Received order-status-updated:', data);
        console.log('🎆 [FRONTEND SOCKET] Current user role:', user?.role);
        console.log('🎆 [FRONTEND SOCKET] Socket connected:', isConnected);
        addNotification({
          id: `order-${data.orderId}-${Date.now()}`,
          type: 'order-update',
          title: 'Order Status Updated',
          message: `Order #${data.orderNumber} is now ${data.status}`,
          data: data,
          timestamp: new Date(),
          read: false
        });
      });

      // Removed duplicate event listeners - these are handled below with role-specific logic

      // Listen for order item status updates
      newSocket.on('order-item-status-updated', (data) => {
        console.log('📦 [FRONTEND SOCKET] Received order-item-status-updated:', data);
        console.log('📦 [FRONTEND SOCKET] Current user role:', user?.role);
        console.log('📦 [FRONTEND SOCKET] Socket connected:', isConnected);
        console.log('📦 [FRONTEND SOCKET] User ID:', user?.id);
        addNotification({
          id: `item-${data.itemId}-${Date.now()}`,
          type: 'order-update',
          title: 'Item Status Updated',
          message: `Item in order #${data.orderNumber} is now ${data.status}`,
          data: data,
          timestamp: new Date(),
          read: false,
          priority: 'high'
        });
      });

      // Listen for new kitchen orders (for chefs)
      newSocket.on('new-kitchen-order', (data) => {
        console.log('🍳 [FRONTEND SOCKET] Received new-kitchen-order:', data);
        if (user?.role === 'chef' || user?.role === 'bartender') {
          addNotification({
            id: `new-order-${data.orderId}-${Date.now()}`,
            type: 'new-order',
            title: 'New Order Received',
            message: `New order #${data.orderNumber} for ${data.kitchenType} kitchen`,
            data: data,
            timestamp: new Date(),
            read: false,
            priority: 'high'
          });
        }
      });

      // Listen for order items added (for chefs and waiters)
      newSocket.on('order-items-added', (data) => {
        console.log('➕ [FRONTEND SOCKET] Received order-items-added:', data);
        const isChef = user?.role === 'chef' || user?.role === 'bartender';
        const isWaiter = user?.role === 'waiter';

        if (isChef || isWaiter) {
          addNotification({
            id: `items-added-${data.orderId}-${Date.now()}`,
            type: 'items-added',
            title: 'Items Added to Order',
            message: `New items added to order #${data.orderNumber}`,
            data: data,
            timestamp: new Date(),
            read: false,
            priority: 'high'
          });
        }
      });

      // Listen for kitchen order acceptance (for waiters)
      newSocket.on('kitchen-order-accepted', (data) => {
        console.log('✅ [FRONTEND SOCKET] Received kitchen-order-accepted:', data);
        if (user?.role === 'waiter') {
          addNotification({
            id: `accepted-${data.orderId}-${Date.now()}`,
            type: 'order-accepted',
            title: 'Order Accepted',
            message: `Order #${data.orderNumber} accepted by ${data.kitchenName}`,
            data: data,
            timestamp: new Date(),
            read: false,
            priority: 'medium'
          });
        }
      });

      // Listen for kitchen order rejection (for waiters)
      newSocket.on('kitchen-order-rejected', (data) => {
        console.log('❌ [FRONTEND SOCKET] Received kitchen-order-rejected:', data);
        if (user?.role === 'waiter') {
          addNotification({
            id: `rejected-${data.orderId}-${Date.now()}`,
            type: 'order-rejected',
            title: 'Order Rejected',
            message: `Order #${data.orderNumber} rejected by ${data.kitchenName}: ${data.reason}`,
            data: data,
            timestamp: new Date(),
            read: false,
            priority: 'high'
          });
        }
      });

      newSocket.on('order-transferred', (data) => {
        addNotification({
          id: Date.now(),
          type: 'order-transfer',
          title: 'Order Transferred',
          message: `Order #${data.orderNumber} transferred to ${data.newKitchen}`,
          data: data,
          timestamp: new Date(),
          read: false,
          priority: 'medium'
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);

  const addNotification = (notification) => {
    // Prevent duplicate notifications by checking if a similar notification already exists
    setNotifications(prev => {
      const isDuplicate = prev.some(existing =>
        existing.id === notification.id ||
        (existing.message === notification.message &&
         existing.type === notification.type &&
         Math.abs(new Date(existing.timestamp) - new Date(notification.timestamp)) < 1000) // Within 1 second
      );

      if (isDuplicate) {
        console.log('🔔 [NOTIFICATION] Duplicate notification prevented:', notification.message);
        return prev;
      }

      return [notification, ...prev].slice(0, 50); // Keep last 50 notifications
    });

    // Add to toast notifications for popup display (also check for duplicates)
    setToastNotifications(prev => {
      const isDuplicate = prev.some(existing =>
        existing.id === notification.id ||
        (existing.message === notification.message &&
         existing.type === notification.type &&
         Math.abs(new Date(existing.timestamp) - new Date(notification.timestamp)) < 1000)
      );

      if (isDuplicate) {
        return prev;
      }

      return [notification, ...prev];
    });

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.type
      });
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeToastNotification = (id) => {
    setToastNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const emitEvent = (eventName, data) => {
    if (socket && isConnected) {
      socket.emit(eventName, data);
    }
  };

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    toastNotifications,
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    markNotificationAsRead,
    clearNotifications,
    removeToastNotification,
    emitEvent
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
