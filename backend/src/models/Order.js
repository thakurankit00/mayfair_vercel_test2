const BaseModel = require('./BaseModel');

class Order extends BaseModel {
  static get tableName() {
    return 'orders';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['order_number', 'order_type', 'total_amount'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        order_number: { type: 'string', maxLength: 20 },
        user_id: { type: ['string', 'null'], format: 'uuid' },
        table_id: { type: ['string', 'null'], format: 'uuid' },
        table_reservation_id: { type: ['string', 'null'], format: 'uuid' },
        order_type: { type: 'string', maxLength: 20 },
        room_booking_id: { type: ['string', 'null'], format: 'uuid' },
        waiter_id: { type: ['string', 'null'], format: 'uuid' },
        restaurant_id: { type: ['string', 'null'], format: 'uuid' },
        target_kitchen_id: { type: ['string', 'null'], format: 'uuid' },
        kitchen_status: { type: 'string', maxLength: 20, default: 'pending' },
        kitchen_notes: { type: ['string', 'null'] },
        kitchen_assigned_at: { type: ['string', 'null'], format: 'date-time' },
        kitchen_accepted_at: { type: ['string', 'null'], format: 'date-time' },
        kitchen_rejected_at: { type: ['string', 'null'], format: 'date-time' },
        total_amount: { type: 'number', minimum: 0 },
        tax_amount: { type: 'number', minimum: 0 },
        tip_amount: { type: 'number', minimum: 0 },
        status: { type: 'string' },
        special_instructions: { type: ['string', 'null'] },
        estimated_preparation_time: { type: ['integer', 'null'], minimum: 0 },
        placed_at: { type: 'string', format: 'date-time' },
        started_at: { type: ['string', 'null'], format: 'date-time' },
        ready_at: { type: ['string', 'null'], format: 'date-time' },
        served_at: { type: ['string', 'null'], format: 'date-time' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      // Customer who placed the order
      customer: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./User'),
        join: {
          from: 'orders.user_id',
          to: 'users.id'
        }
      },

      // Waiter assigned to the order
      waiter: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./User'),
        join: {
          from: 'orders.waiter_id',
          to: 'users.id'
        }
      },

      // Table for the order
      table: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./RestaurantTable'),
        join: {
          from: 'orders.table_id',
          to: 'restaurant_tables.id'
        }
      },

      // Restaurant where order was placed
      restaurant: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./Restaurant'),
        join: {
          from: 'orders.restaurant_id',
          to: 'restaurants.id'
        }
      },

      // Kitchen assigned to prepare the order
      targetKitchen: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./Restaurant'),
        join: {
          from: 'orders.target_kitchen_id',
          to: 'restaurants.id'
        }
      },

      // Order items
      items: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./OrderItem'),
        join: {
          from: 'orders.id',
          to: 'order_items.order_id'
        }
      },

      // Kitchen logs for this order
      kitchenLogs: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./OrderKitchenLog'),
        join: {
          from: 'orders.id',
          to: 'order_kitchen_logs.order_id'
        }
      },

      // Table reservation (if applicable)
      reservation: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./TableReservation'),
        join: {
          from: 'orders.table_reservation_id',
          to: 'table_reservations.id'
        }
      }
    };
  }

  // Get orders by restaurant
  static getByRestaurant(restaurantId, status = null) {
    let query = this.query()
      .where('restaurant_id', restaurantId)
      .withGraphFetched('[customer, waiter, table, items]');

    if (status) {
      query = query.where('status', status);
    }

    return query.orderBy('placed_at', 'desc');
  }

  // Get orders by kitchen
  static getByKitchen(kitchenId, kitchenStatus = null) {
    let query = this.query()
      .where('target_kitchen_id', kitchenId)
      .withGraphFetched('[customer, waiter, table, restaurant, items]');

    if (kitchenStatus) {
      query = query.where('kitchen_status', kitchenStatus);
    }

    return query.orderBy('kitchen_assigned_at', 'asc');
  }

  // Get pending kitchen orders
  static getPendingKitchenOrders(kitchenId) {
    return this.getByKitchen(kitchenId, 'pending');
  }

  // Assign order to kitchen
  async assignToKitchen(kitchenId, assignedBy) {
    const updateData = {
      target_kitchen_id: kitchenId,
      kitchen_status: 'pending',
      kitchen_assigned_at: new Date(),
      updated_at: new Date()
    };

    await this.$query().patch(updateData);

    // Log the kitchen assignment
    await this.constructor.relatedQuery('kitchenLogs', this).insert({
      restaurant_id: kitchenId,
      action: 'assigned',
      performed_by: assignedBy,
      notes: null
    });

    return this;
  }

  // Accept order in kitchen
  async acceptInKitchen(acceptedBy, estimatedTime = null, notes = null) {
    const updateData = {
      kitchen_status: 'accepted',
      kitchen_accepted_at: new Date(),
      updated_at: new Date()
    };

    if (estimatedTime) {
      updateData.estimated_preparation_time = estimatedTime;
    }

    if (notes) {
      updateData.kitchen_notes = notes;
    }

    await this.$query().patch(updateData);

    // Log the acceptance
    await this.constructor.relatedQuery('kitchenLogs', this).insert({
      restaurant_id: this.target_kitchen_id,
      action: 'accepted',
      performed_by: acceptedBy,
      notes: notes
    });

    return this;
  }

  // Reject order in kitchen
  async rejectInKitchen(rejectedBy, reason = null) {
    const updateData = {
      kitchen_status: 'rejected',
      kitchen_rejected_at: new Date(),
      updated_at: new Date()
    };

    if (reason) {
      updateData.kitchen_notes = reason;
    }

    await this.$query().patch(updateData);

    // Log the rejection
    await this.constructor.relatedQuery('kitchenLogs', this).insert({
      restaurant_id: this.target_kitchen_id,
      action: 'rejected',
      performed_by: rejectedBy,
      notes: reason
    });

    return this;
  }

  // Transfer order to different kitchen
  async transferToKitchen(newKitchenId, transferredBy, reason = null) {
    const oldKitchenId = this.target_kitchen_id;
    
    const updateData = {
      target_kitchen_id: newKitchenId,
      kitchen_status: 'pending',
      kitchen_assigned_at: new Date(),
      kitchen_accepted_at: null,
      kitchen_rejected_at: null,
      kitchen_notes: null,
      updated_at: new Date()
    };

    await this.$query().patch(updateData);

    // Log the transfer
    await this.constructor.relatedQuery('kitchenLogs', this).insert({
      restaurant_id: newKitchenId,
      action: 'transferred',
      performed_by: transferredBy,
      notes: `Transferred from kitchen ${oldKitchenId}. Reason: ${reason || 'Not specified'}`
    });

    return this;
  }

  // Get order with full details including kitchen logs
  static getWithKitchenDetails(orderId) {
    return this.query()
      .findById(orderId)
      .withGraphFetched('[customer, waiter, table, restaurant, targetKitchen, items, kitchenLogs.[performer]]');
  }

  // Get orders for waiter
  static getForWaiter(waiterId, status = null) {
    let query = this.query()
      .where('waiter_id', waiterId)
      .withGraphFetched('[customer, table, restaurant, targetKitchen, items]');

    if (status) {
      query = query.where('status', status);
    }

    return query.orderBy('placed_at', 'desc');
  }
}

module.exports = Order;
