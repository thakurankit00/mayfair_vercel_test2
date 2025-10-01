import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  CheckCheck,
  Trash2,
  Settings,
  X,
  BellOff,
  Filter,
  ExternalLink
} from 'lucide-react';
import '../../styles/notifications.css';
import {
  groupNotificationsByTime,
  getGroupLabel,
  formatRelativeTime,
  getNotificationTypeConfig,
  formatNotificationMessage,
  getNotificationNavigationPath,
  sortNotificationsByPriority,
  filterNotifications
} from '../../utils/notificationUtils';


const NotificationDropdown = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onClearNotification
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, unread, high-priority
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Animation effect on mount
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Filter and sort notifications
  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications;
    
    switch (filter) {
      case 'unread':
        filtered = filterNotifications(notifications, { unreadOnly: true });
        break;
      case 'high-priority':
        filtered = filterNotifications(notifications, { priority: 'high' });
        break;
      default:
        filtered = notifications;
    }
    
    return sortNotificationsByPriority(filtered);
  }, [notifications, filter]);

  // Group notifications by time
  const groupedNotifications = groupNotificationsByTime(filteredNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    // Navigate to relevant page
    const path = getNotificationNavigationPath(notification);
    if (path) {
      navigate(path);
      onClose();
    }
  };

  const handleMarkAsRead = (e, notificationId) => {
    e.stopPropagation();
    onMarkAsRead(notificationId);
  };

  const handleClearNotification = (e, notificationId) => {
    e.stopPropagation();
    onClearNotification(notificationId);
  };

  const renderNotificationItem = (notification) => {
    const typeConfig = getNotificationTypeConfig(notification.type);
    const IconComponent = typeConfig.icon;
    const formattedMessage = formatNotificationMessage(notification);
    const isUnread = !notification.read;
    const priorityClass = `priority-${notification.priority || 'medium'}`;

    return (
      <div
        key={notification.id}
        onClick={() => handleNotificationClick(notification)}
        className={`
          notification-item group relative flex items-start gap-3 px-4 py-3 cursor-pointer
          transition-all duration-200 hover:bg-gray-50
          ${isUnread ? 'notification-unread bg-blue-50/30' : ''}
          ${priorityClass}
        `}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNotificationClick(notification);
          }
        }}
      >
        {/* Enhanced Icon with animation */}
        <div className={`
          notification-icon flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${typeConfig.bgColor} ${isUnread ? 'ring-2 ring-blue-200 animate-pulse' : ''}
          transition-all duration-200
        `}>
          <IconComponent className={`w-5 h-5 ${typeConfig.color} transition-transform duration-200`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                {formattedMessage.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formattedMessage.message}
              </p>
              {formattedMessage.context && (
                <p className="text-xs text-gray-500 mt-1">
                  {formattedMessage.context}
                </p>
              )}
            </div>
            
            {/* Enhanced Action buttons with better animations */}
            <div className="flex items-center gap-1">
              {isUnread && (
                <button
                  onClick={(e) => handleMarkAsRead(e, notification.id)}
                  className="notification-action-btn p-1.5 rounded-full hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-all duration-150"
                  title="Mark as read"
                  aria-label="Mark notification as read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={(e) => handleClearNotification(e, notification.id)}
                className="notification-action-btn p-1.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all duration-150"
                title="Remove notification"
                aria-label="Remove notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {formattedMessage.actionText && (
                <ExternalLink className="w-3 h-3 text-gray-400 ml-1" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {formatRelativeTime(notification.timestamp)}
            </span>
            {formattedMessage.actionText && (
              <span className="text-xs text-blue-500 font-medium">
                {formattedMessage.actionText} →
              </span>
            )}
          </div>
        </div>

        {/* Unread indicator */}
        {isUnread && (
          <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <BellOff className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">You're all caught up!</h3>
      <p className="text-sm text-gray-500 text-center max-w-xs leading-relaxed">
        {filter === 'unread'
          ? "No unread notifications at the moment. Great job staying on top of things!"
          : filter === 'high-priority'
          ? "No high priority notifications right now. Everything looks good!"
          : "No notifications to show. We'll let you know when something important happens."
        }
      </p>
      {filter !== 'all' && (
        <button
          onClick={() => setFilter('all')}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          View all notifications
        </button>
      )}
    </div>
  );

  const renderGroupedNotifications = () => {
    const hasNotifications = Object.values(groupedNotifications).some(group => group.length > 0);
    
    if (!hasNotifications) {
      return renderEmptyState();
    }

    return (
      <div className="divide-y divide-gray-100">
        {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => {
          if (groupNotifications.length === 0) return null;
          
          return (
            <div key={groupKey}>
              <div className="notification-group-header sticky top-0 px-4 py-3 border-b border-gray-200 backdrop-blur-sm">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                  <span>{getGroupLabel(groupKey)}</span>
                  <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {groupNotifications.length}
                  </span>
                </h4>
              </div>
              <div className="divide-y divide-gray-50">
                {groupNotifications.map(renderNotificationItem)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`
      notification-dropdown absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)]
      max-h-[600px] rounded-2xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-50
      overflow-hidden transform transition-all duration-300 ease-out
      ${isAnimating ? 'scale-95 opacity-0 translate-y-2' : 'scale-100 opacity-100 translate-y-0'}
      sm:w-96 sm:max-w-none
    `}>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* Filter dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="high-priority">High Priority</option>
            </select>
            
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title="Notification settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Action buttons */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all as read
              </button>
            )}
            
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Content with enhanced scrolling */}
      <div className="notification-scroll max-h-[500px] overflow-y-auto">
        {renderGroupedNotifications()}
      </div>

    
    </div>
  );
};

export default NotificationDropdown;
