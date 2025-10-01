import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import './PopupNotification.css';

const PopupNotification = () => {
  const { notifications, removeToastNotification } = useSocket();
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    // Show only high-priority notifications as popups
    const highPriorityNotifications = notifications
      .filter(notification => notification.priority === 'high' && !notification.read)
      .slice(0, 3); // Show max 3 notifications at once

    setVisibleNotifications(highPriorityNotifications);
  }, [notifications]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    visibleNotifications.forEach(notification => {
      const timer = setTimeout(() => {
        console.log('🔔 [POPUP] Auto-dismissing notification:', notification.id);
        handleClose(notification.id);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [visibleNotifications]);

  const handleClose = (notificationId) => {
    console.log('🔔 [POPUP] Close button clicked for notification:', notificationId);
    console.log('🔔 [POPUP] Current visible notifications:', visibleNotifications.length);

    setVisibleNotifications(prev => {
      const filtered = prev.filter(notification => notification.id !== notificationId);
      console.log('🔔 [POPUP] After filtering:', filtered.length);
      return filtered;
    });

    if (removeToastNotification) {
      console.log('🔔 [POPUP] Calling removeToastNotification');
      removeToastNotification(notificationId);
    } else {
      console.log('🔔 [POPUP] removeToastNotification function not available');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new-order':
        return '🆕';
      case 'items-added':
        return '➕';
      case 'order-update':
        return '📦';
      case 'order-accepted':
        return '✅';
      case 'order-rejected':
        return '❌';
      case 'order-transfer':
        return '🔄';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new-order':
        return '#4CAF50'; // Green
      case 'items-added':
        return '#2196F3'; // Blue
      case 'order-update':
        return '#FF9800'; // Orange
      case 'order-accepted':
        return '#4CAF50'; // Green
      case 'order-rejected':
        return '#F44336'; // Red
      case 'order-transfer':
        return '#9C27B0'; // Purple
      default:
        return '#607D8B'; // Blue Grey
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="popup-notifications-container">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="popup-notification"
          style={{
            '--notification-color': getNotificationColor(notification.type),
            '--notification-index': index
          }}
        >
          <div className="popup-notification-header">
            <span className="popup-notification-icon">
              {getNotificationIcon(notification.type)}
            </span>
            <span className="popup-notification-title">
              {notification.title}
            </span>
            <button
              className="popup-notification-close"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose(notification.id);
              }}
              onMouseDown={(e) => e.preventDefault()}
              aria-label="Close notification"
              type="button"
            >
              ×
            </button>
          </div>
          <div className="popup-notification-message">
            {notification.message}
          </div>
          <div className="popup-notification-time">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PopupNotification;
