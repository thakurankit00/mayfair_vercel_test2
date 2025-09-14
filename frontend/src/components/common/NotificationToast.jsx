import React, { useState, useEffect } from 'react';

const NotificationToast = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show animation
    setIsVisible(true);
    
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'kitchen-accepted':
        return '✅';
      case 'kitchen-rejected':
        return '❌';
      case 'new-order':
        return '🆕';
      case 'order-update':
        return '📋';
      case 'success':
        return '✅';
      case 'error':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'kitchen-accepted':
      case 'success':
        return 'bg-green-500';
      case 'kitchen-rejected':
      case 'error':
        return 'bg-red-500';
      case 'new-order':
        return 'bg-blue-500';
      case 'order-update':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`${getBackgroundColor()} text-white p-4 rounded-lg shadow-lg max-w-sm`}>
        <div className="flex items-start space-x-3">
          <span className="text-xl flex-shrink-0">{getIcon()}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="text-sm opacity-90 mt-1">{notification.message}</p>
            <p className="text-xs opacity-75 mt-1">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationContainer = ({ notifications, onRemoveNotification }) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {notifications.slice(0, 3).map((notification, index) => (
        <div
          key={notification.id}
          style={{ 
            transform: `translateY(${index * 10}px)`,
            zIndex: 1000 - index
          }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => onRemoveNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
export { NotificationToast };
