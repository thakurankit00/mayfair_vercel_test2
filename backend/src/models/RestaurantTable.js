const BaseModel = require('./BaseModel');

class RestaurantTable extends BaseModel {
  static get tableName() {
    return 'restaurant_tables';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['table_number', 'capacity'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        table_number: { type: 'string', maxLength: 10 },
        capacity: { type: 'integer', minimum: 1 },
        location: { type: ['string', 'null'], maxLength: 50 },
        restaurant_id: { type: ['string', 'null'], format: 'uuid' },
        is_active: { type: 'boolean', default: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      // Restaurant this table belongs to
      restaurant: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./Restaurant'),
        join: {
          from: 'restaurant_tables.restaurant_id',
          to: 'restaurants.id'
        }
      },

      // Orders for this table
      orders: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./Order'),
        join: {
          from: 'restaurant_tables.id',
          to: 'orders.table_id'
        }
      },

      // Reservations for this table
      reservations: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./TableReservation'),
        join: {
          from: 'restaurant_tables.id',
          to: 'table_reservations.table_id'
        }
      }
    };
  }

  // Get tables by restaurant
  static getByRestaurant(restaurantId) {
    return this.query()
      .where('restaurant_id', restaurantId)
      .where('is_active', true)
      .orderBy(['location', 'table_number']);
  }

  // Get available tables for reservation
  static getAvailable(restaurantId, date, time, partySize) {
    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    return this.query()
      .where('restaurant_id', restaurantId)
      .where('is_active', true)
      .where('capacity', '>=', partySize)
      .whereNotExists(
        this.relatedQuery('reservations')
          .where('reservation_date', date)
          .where('status', 'confirmed')
          .whereBetween('reservation_time', [
            time,
            endTime.toTimeString().slice(0, 8)
          ])
      )
      .orderBy(['location', 'table_number']);
  }

  // Get table with current status
  static getWithStatus(tableId) {
    return this.query()
      .findById(tableId)
      .withGraphFetched('[restaurant, orders, reservations]')
      .modifyGraph('orders', builder => {
        builder.where('status', 'in', ['pending', 'preparing', 'ready'])
          .orderBy('placed_at', 'desc');
      })
      .modifyGraph('reservations', builder => {
        builder.where('reservation_date', '>=', new Date().toISOString().split('T')[0])
          .where('status', 'confirmed')
          .orderBy('reservation_date', 'asc')
          .orderBy('reservation_time', 'asc');
      });
  }
}

module.exports = RestaurantTable;
