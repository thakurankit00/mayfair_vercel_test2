import api from './api';

class NotificationService {
  // Get user's notifications
  async getNotifications(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.unreadOnly) params.append('unread_only', 'true');
      if (options.type) params.append('type', options.type);
      if (options.includeExpired) params.append('include_expired', 'true');

      const response = await api.get(`/notifications?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ [NOTIFICATION API] Error fetching notifications:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.data.unread_count;
    } catch (error) {
      console.error('❌ [NOTIFICATION API] Error fetching unread count:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('❌ [NOTIFICATION API] Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('❌ [NOTIFICATION API] Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('❌ [NOTIFICATION API] Error deleting notification:', error);
      throw error;
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      const response = await api.delete('/notifications');
      return response.data;
    } catch (error) {
      console.error('❌ [NOTIFICATION API] Error clearing all notifications:', error);
      throw error;
    }
  }

  // Create a notification (admin/system use)
  async createNotification(notificationData) {
    try {
      const response = await api.post('/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('❌ [NOTIFICATION API] Error creating notification:', error);
      throw error;
    }
  }

  // Sync notifications with database
  async syncNotifications() {
    try {
      console.log('🔄 [NOTIFICATION API] Syncing notifications with database...');
      const result = await this.getNotifications({ limit: 50 });
      console.log(`✅ [NOTIFICATION API] Synced ${result.data.notifications.length} notifications`);
      return result.data;
    } catch (error) {
      console.error('❌ [NOTIFICATION API] Error syncing notifications:', error);
      return { notifications: [], unread_count: 0, total: 0 };
    }
  }

  // Batch mark notifications as read
  async batchMarkAsRead(notificationIds) {
    try {
      const promises = notificationIds.map(id => this.markAsRead(id));
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      console.log(`📊 [NOTIFICATION API] Batch mark as read: ${successful} successful, ${failed} failed`);
      return { successful, failed };
    } catch (error) {
      console.error('❌ [NOTIFICATION API] Error in batch mark as read:', error);
      throw error;
    }
  }

  // Get notifications by type
  async getNotificationsByType(type, options = {}) {
    try {
      return await this.getNotifications({ ...options, type });
    } catch (error) {
      console.error(`❌ [NOTIFICATION API] Error fetching notifications by type ${type}:`, error);
      throw error;
    }
  }

  // Get recent notifications (last 24 hours)
  async getRecentNotifications(limit = 20) {
    try {
      const result = await this.getNotifications({ limit });
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentNotifications = result.data.notifications.filter(notification => 
        new Date(notification.created_at) > oneDayAgo
      );
      
      return {
        ...result.data,
        notifications: recentNotifications,
        total: recentNotifications.length
      };
    } catch (error) {
      console.error('❌ [NOTIFICATION API] Error fetching recent notifications:', error);
      throw error;
    }
  }

  // Check for new notifications since last check
  async checkForNewNotifications(lastCheckTime) {
    try {
      const result = await this.getNotifications({ limit: 50 });
      
      if (!lastCheckTime) {
        return result.data;
      }
      
      const newNotifications = result.data.notifications.filter(notification => 
        new Date(notification.created_at) > new Date(lastCheckTime)
      );
      
      return {
        ...result.data,
        notifications: newNotifications,
        total: newNotifications.length,
        hasNew: newNotifications.length > 0
      };
    } catch (error) {
      console.error('❌ [NOTIFICATION API] Error checking for new notifications:', error);
      return { notifications: [], unread_count: 0, total: 0, hasNew: false };
    }
  }
}

export default new NotificationService();
