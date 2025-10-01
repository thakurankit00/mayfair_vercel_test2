const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

class NotificationController {
  // GET /api/v1/notifications - Get user's notifications
  static async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const {
        limit = 50,
        offset = 0,
        unread_only = false,
        type = null,
        include_expired = false
      } = req.query;

      console.log(`📋 [NOTIFICATIONS] Getting notifications for user: ${userId}`);

      const notifications = await Notification.getUserNotifications(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        unreadOnly: unread_only === 'true',
        type: type,
        includeExpired: include_expired === 'true'
      });

      const unreadCount = await Notification.getUnreadCount(userId);

      console.log(`📋 [NOTIFICATIONS] Found ${notifications.length} notifications, ${unreadCount} unread`);

      res.json({
        success: true,
        data: {
          notifications,
          unread_count: unreadCount,
          total: notifications.length
        }
      });
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error getting notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  }

  // POST /api/v1/notifications - Create a new notification (admin/system use)
  static async createNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        user_id,
        type,
        title,
        message,
        data,
        priority = 'medium',
        expires_at
      } = req.body;

      console.log(`📋 [NOTIFICATIONS] Creating notification for user: ${user_id}, type: ${type}`);

      const notification = await Notification.createNotification({
        user_id,
        type,
        title,
        message,
        data,
        priority,
        expires_at
      });

      console.log(`✅ [NOTIFICATIONS] Created notification: ${notification.id}`);

      res.status(201).json({
        success: true,
        data: notification,
        message: 'Notification created successfully'
      });
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification',
        error: error.message
      });
    }
  }

  // PUT /api/v1/notifications/:id/read - Mark notification as read
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      console.log(`📋 [NOTIFICATIONS] Marking notification as read: ${id} for user: ${userId}`);

      // Find the notification and verify ownership
      const notification = await Notification.query()
        .findById(id)
        .where('user_id', userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      if (notification.read) {
        return res.json({
          success: true,
          message: 'Notification already marked as read',
          data: notification
        });
      }

      // Mark as read
      await notification.markAsRead();
      const updatedNotification = await Notification.query().findById(id);

      console.log(`✅ [NOTIFICATIONS] Marked notification as read: ${id}`);

      res.json({
        success: true,
        data: updatedNotification,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  // PUT /api/v1/notifications/mark-all-read - Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      console.log(`📋 [NOTIFICATIONS] Marking all notifications as read for user: ${userId}`);

      const updatedCount = await Notification.markAllAsRead(userId);

      console.log(`✅ [NOTIFICATIONS] Marked ${updatedCount} notifications as read`);

      res.json({
        success: true,
        data: { updated_count: updatedCount },
        message: `Marked ${updatedCount} notifications as read`
      });
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }

  // DELETE /api/v1/notifications/:id - Delete a notification
  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      console.log(`📋 [NOTIFICATIONS] Deleting notification: ${id} for user: ${userId}`);

      // Find and delete the notification (verify ownership)
      const deletedCount = await Notification.query()
        .deleteById(id)
        .where('user_id', userId);

      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      console.log(`✅ [NOTIFICATIONS] Deleted notification: ${id}`);

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }

  // DELETE /api/v1/notifications - Clear all notifications for user
  static async clearAllNotifications(req, res) {
    try {
      const userId = req.user.id;

      console.log(`📋 [NOTIFICATIONS] Clearing all notifications for user: ${userId}`);

      const deletedCount = await Notification.query()
        .delete()
        .where('user_id', userId);

      console.log(`✅ [NOTIFICATIONS] Cleared ${deletedCount} notifications`);

      res.json({
        success: true,
        data: { deleted_count: deletedCount },
        message: `Cleared ${deletedCount} notifications`
      });
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error clearing notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear notifications',
        error: error.message
      });
    }
  }

  // GET /api/v1/notifications/unread-count - Get unread notification count
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const unreadCount = await Notification.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unread_count: unreadCount }
      });
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  }
}

module.exports = NotificationController;
