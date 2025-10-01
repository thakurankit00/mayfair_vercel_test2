const { Model } = require('objection');
const BaseModel = require('./BaseModel');

class Notification extends BaseModel {
  static get tableName() {
    return 'notifications';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'type', 'title', 'message'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        user_id: { type: 'string', format: 'uuid' },
        type: { 
          type: 'string', 
          maxLength: 50,
          enum: [
            'new-order',
            'order-update', 
            'order-ready',
            'order-cancelled',
            'order-rejected',
            'items-added',
            'order-transfer',
            'kitchen-assignment',
            'payment-received',
            'booking-confirmed',
            'booking-cancelled',
            'system-alert',
            'test-notification'
          ]
        },
        title: { type: 'string', maxLength: 255 },
        message: { type: 'string' },
        data: { type: ['object', 'null'] },
        read: { type: 'boolean', default: false },
        priority: { 
          type: 'string', 
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        created_at: { type: 'string', format: 'date-time' },
        read_at: { type: ['string', 'null'], format: 'date-time' },
        expires_at: { type: ['string', 'null'], format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User');
    
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'notifications.user_id',
          to: 'users.id'
        }
      }
    };
  }

  // Instance methods
  async markAsRead() {
    return await this.$query().patch({
      read: true,
      read_at: new Date().toISOString()
    });
  }

  // Static methods
  static async createNotification(data) {
    return await this.query().insert({
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || null,
      priority: data.priority || 'medium',
      expires_at: data.expires_at || null
    });
  }

  static async getUserNotifications(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      type = null,
      includeExpired = false
    } = options;

    let query = this.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (unreadOnly) {
      query = query.where('read', false);
    }

    if (type) {
      query = query.where('type', type);
    }

    if (!includeExpired) {
      query = query.where(function() {
        this.whereNull('expires_at')
          .orWhere('expires_at', '>', new Date().toISOString());
      });
    }

    return await query;
  }

  static async getUnreadCount(userId) {
    const result = await this.query()
      .where('user_id', userId)
      .where('read', false)
      .where(function() {
        this.whereNull('expires_at')
          .orWhere('expires_at', '>', new Date().toISOString());
      })
      .count('id as count')
      .first();

    return parseInt(result.count) || 0;
  }

  static async markAllAsRead(userId) {
    return await this.query()
      .where('user_id', userId)
      .where('read', false)
      .patch({
        read: true,
        read_at: new Date().toISOString()
      });
  }

  static async deleteExpiredNotifications() {
    return await this.query()
      .whereNotNull('expires_at')
      .where('expires_at', '<', new Date().toISOString())
      .delete();
  }

  static async bulkCreateNotifications(notifications) {
    return await this.query().insert(notifications);
  }

  // Create notifications for multiple users
  static async createForUsers(userIds, notificationData) {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || null,
      priority: notificationData.priority || 'medium',
      expires_at: notificationData.expires_at || null
    }));

    return await this.bulkCreateNotifications(notifications);
  }

  // Create notification for users with specific role (enhanced for cross-role access)
  static async createForRole(role, notificationData) {
    const User = require('./User');

    // Get users with the specific role
    let targetRoles = [role];

    // Always include managers and admins for comprehensive notification coverage
    // This ensures they see notifications regardless of which interface they're using
    if (!['manager', 'admin'].includes(role)) {
      targetRoles.push('manager', 'admin');
    }

    const users = await User.query()
      .select('id', 'role', 'first_name', 'last_name')
      .whereIn('role', targetRoles)
      .where('is_active', true);

    const userIds = users.map(user => user.id);

    if (userIds.length > 0) {
      console.log(`📋 [NOTIFICATION] Creating notifications for roles: ${targetRoles.join(', ')} (${users.length} users: ${users.map(u => `${u.role}:${u.first_name}`).join(', ')})`);
      return await this.createForUsers(userIds, notificationData);
    }

    console.log(`📋 [NOTIFICATION] No active users found for roles: ${targetRoles.join(', ')}`);
    return [];
  }
}

module.exports = Notification;
