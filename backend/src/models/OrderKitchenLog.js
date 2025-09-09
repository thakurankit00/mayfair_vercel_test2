const BaseModel = require('./BaseModel');

class OrderKitchenLog extends BaseModel {
  static get tableName() {
    return 'order_kitchen_logs';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['order_id', 'restaurant_id', 'action', 'performed_by'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        order_id: { type: 'string', format: 'uuid' },
        restaurant_id: { type: 'string', format: 'uuid' },
        action: { type: 'string', maxLength: 50 },
        performed_by: { type: 'string', format: 'uuid' },
        notes: { type: ['string', 'null'] },
        created_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      // Order this log belongs to
      order: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./Order'),
        join: {
          from: 'order_kitchen_logs.order_id',
          to: 'orders.id'
        }
      },

      // Restaurant/kitchen this log is for
      restaurant: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./Restaurant'),
        join: {
          from: 'order_kitchen_logs.restaurant_id',
          to: 'restaurants.id'
        }
      },

      // User who performed the action
      performer: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./User'),
        join: {
          from: 'order_kitchen_logs.performed_by',
          to: 'users.id'
        }
      }
    };
  }

  // Create kitchen log entry
  static async createLog(orderData) {
    const { orderId, restaurantId, action, performedBy, notes } = orderData;
    
    return await this.query().insert({
      order_id: orderId,
      restaurant_id: restaurantId,
      action,
      performed_by: performedBy,
      notes: notes || null,
      created_at: new Date()
    });
  }

  // Get logs for an order
  static getOrderLogs(orderId) {
    return this.query()
      .where('order_id', orderId)
      .withGraphFetched('[restaurant, performer]')
      .orderBy('created_at', 'asc');
  }

  // Get logs for a restaurant's kitchen
  static getKitchenLogs(restaurantId, limit = 50) {
    return this.query()
      .where('restaurant_id', restaurantId)
      .withGraphFetched('[order, performer]')
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  // Get recent kitchen activity
  static getRecentActivity(restaurantId, hoursBack = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hoursBack);

    return this.query()
      .where('restaurant_id', restaurantId)
      .where('created_at', '>=', since.toISOString())
      .withGraphFetched('[order, performer]')
      .orderBy('created_at', 'desc');
  }
}

module.exports = OrderKitchenLog;
