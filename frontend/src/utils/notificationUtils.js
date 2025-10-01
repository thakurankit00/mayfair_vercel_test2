import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  ChefHat, 
  Coffee, 
  Utensils,
  ArrowRight,
  Package,
  RefreshCw
} from 'lucide-react';

// Notification type configurations with icons and colors
export const NOTIFICATION_TYPES = {
  'order-update': {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    priority: 'medium'
  },
  'new-order': {
    icon: ChefHat,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    priority: 'high'
  },
  'items-added': {
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    priority: 'high'
  },
  'order-accepted': {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    priority: 'medium'
  },
  'order-rejected': {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    priority: 'high'
  },
  'order-transfer': {
    icon: ArrowRight,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    priority: 'medium'
  },
  'system': {
    icon: Bell,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    priority: 'low'
  },
  'default': {
    icon: Bell,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    priority: 'medium'
  }
};

// Get notification type configuration
export const getNotificationTypeConfig = (type) => {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.default;
};

// Format relative time (e.g., "2 minutes ago", "1 hour ago")
export const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - notificationTime) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return notificationTime.toLocaleDateString();
  }
};

// Group notifications by time periods
export const groupNotificationsByTime = (notifications) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };

  notifications.forEach(notification => {
    const notificationDate = new Date(notification.timestamp);
    
    if (notificationDate >= today) {
      groups.today.push(notification);
    } else if (notificationDate >= yesterday) {
      groups.yesterday.push(notification);
    } else if (notificationDate >= thisWeek) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
};

// Get group label for display
export const getGroupLabel = (groupKey) => {
  const labels = {
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    older: 'Older'
  };
  return labels[groupKey] || groupKey;
};

// Enhanced notification message formatting
export const formatNotificationMessage = (notification) => {
  const { type, title, message, data } = notification;
  
  // Add more context based on notification type and data
  switch (type) {
    case 'new-order':
      return {
        title: title,
        message: message,
        context: data?.tableNumber ? `Table ${data.tableNumber}` : null,
        actionText: 'View Order'
      };
    
    case 'order-update':
      return {
        title: title,
        message: message,
        context: data?.tableNumber ? `Table ${data.tableNumber}` : null,
        actionText: 'View Details'
      };
    
    case 'items-added':
      return {
        title: title,
        message: message,
        context: data?.itemCount ? `${data.itemCount} items` : null,
        actionText: 'View Items'
      };
    
    case 'order-rejected':
      return {
        title: title,
        message: message,
        context: data?.reason ? `Reason: ${data.reason}` : null,
        actionText: 'View Details'
      };
    
    default:
      return {
        title: title,
        message: message,
        context: null,
        actionText: 'View'
      };
  }
};

// Get navigation path for notification
export const getNotificationNavigationPath = (notification) => {
  const { type, data } = notification;
  
  switch (type) {
    case 'new-order':
    case 'order-update':
    case 'items-added':
    case 'order-accepted':
    case 'order-rejected':
      return data?.orderId ? `/orders/${data.orderId}` : '/orders';
    
    case 'order-transfer':
      return '/kitchen';
    
    default:
      return null;
  }
};

// Priority-based sorting
export const sortNotificationsByPriority = (notifications) => {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  
  return [...notifications].sort((a, b) => {
    const aPriority = priorityOrder[a.priority] || priorityOrder.medium;
    const bPriority = priorityOrder[b.priority] || priorityOrder.medium;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }
    
    // If same priority, sort by timestamp (newest first)
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
};

// Filter notifications by criteria
export const filterNotifications = (notifications, criteria) => {
  return notifications.filter(notification => {
    if (criteria.unreadOnly && notification.read) {
      return false;
    }
    
    if (criteria.types && criteria.types.length > 0 && !criteria.types.includes(notification.type)) {
      return false;
    }
    
    if (criteria.priority && notification.priority !== criteria.priority) {
      return false;
    }
    
    return true;
  });
};

// Sound notification utility
export const playNotificationSound = (type, priority) => {
  // Only play sounds for high priority notifications or if user has enabled sounds
  const shouldPlaySound = priority === 'high' || localStorage.getItem('notificationSounds') === 'true';
  
  if (shouldPlaySound && 'Audio' in window) {
    try {
      // You can add different sounds for different types
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Notification sound not available:', error);
    }
  }
};
