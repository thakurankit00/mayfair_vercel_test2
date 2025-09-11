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
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000', {
        auth: {
          token: token
        },
        query: {
          userId: user.id,
          role: user.role
        }
      });

      newSocket.on('connect', () => {
        console.log('🔌 Connected to server via Socket.io');
        setIsConnected(true);
        
        // Join user-specific room
        newSocket.emit('join-user-room', user.id);
        
        // Join role-specific rooms
        if (['chef', 'bartender'].includes(user.role)) {
          newSocket.emit('join-kitchen-room', user.role);
        } else if (user.role === 'waiter') {
          newSocket.emit('join-waiter-room');
        }
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
        setIsConnected(false);
      });

      // Order-related events
      newSocket.on('order-status-updated', (data) => {
        addNotification({
          id: Date.now(),
          type: 'order-update',
          title: 'Order Status Updated',
          message: `Order #${data.orderNumber} is now ${data.status}`,
          data: data,
          timestamp: new Date(),
          read: false
        });
      });

      newSocket.on('kitchen-order-accepted', (data) => {
        addNotification({
          id: Date.now(),
          type: 'kitchen-accepted',
          title: 'Kitchen Accepted Order',
          message: `Order #${data.orderNumber} accepted by ${data.kitchenName}. Est. time: ${data.estimatedTime || 'N/A'} mins`,
          data: data,
          timestamp: new Date(),
          read: false
        });
      });

      newSocket.on('kitchen-order-rejected', (data) => {
        addNotification({
          id: Date.now(),
          type: 'kitchen-rejected',
          title: 'Kitchen Rejected Order',
          message: `Order #${data.orderNumber} rejected by ${data.kitchenName}. Reason: ${data.reason}`,
          data: data,
          timestamp: new Date(),
          read: false
        });
      });

      newSocket.on('new-kitchen-order', (data) => {
        if (['chef', 'bartender'].includes(user.role)) {
          addNotification({
            id: Date.now(),
            type: 'new-order',
            title: 'New Order Received',
            message: `New order #${data.orderNumber} from Table ${data.tableNumber}`,
            data: data,
            timestamp: new Date(),
            read: false
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
          read: false
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
    
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
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    markNotificationAsRead,
    clearNotifications,
    emitEvent
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
