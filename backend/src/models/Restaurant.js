const BaseModel = require('./BaseModel');

class Restaurant extends BaseModel {
  static get tableName() {
    return 'restaurants';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'location', 'restaurant_type'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', maxLength: 100 },
        description: { type: ['string', 'null'] },
        location: { type: 'string', maxLength: 100 },
        restaurant_type: { type: 'string', maxLength: 50 },
        is_active: { type: 'boolean', default: true },
        has_kitchen: { type: 'boolean', default: true },
        kitchen_name: { type: ['string', 'null'], maxLength: 100 },
        operating_hours: { type: ['object', 'null'] },
        contact_extension: { type: ['string', 'null'], maxLength: 10 },
        max_capacity: { type: 'integer', minimum: 0 },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      // Tables belonging to this restaurant
      tables: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./RestaurantTable'),
        join: {
          from: 'restaurants.id',
          to: 'restaurant_tables.restaurant_id'
        }
      },

      // Menu categories for this restaurant
      menuCategories: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./MenuCategory'),
        join: {
          from: 'restaurants.id',
          to: 'menu_categories.restaurant_id'
        }
      },

      // Orders placed for this restaurant
      orders: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./Order'),
        join: {
          from: 'restaurants.id',
          to: 'orders.restaurant_id'
        }
      },

      // Orders assigned to this restaurant's kitchen
      kitchenOrders: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./Order'),
        join: {
          from: 'restaurants.id',
          to: 'orders.target_kitchen_id'
        }
      },

      // Staff assigned to this restaurant
      staff: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: require('./User'),
        join: {
          from: 'restaurants.id',
          through: {
            from: 'restaurant_staff.restaurant_id',
            to: 'restaurant_staff.user_id',
            extra: ['role', 'is_active']
          },
          to: 'users.id'
        }
      },

      // Kitchen logs for this restaurant
      kitchenLogs: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./OrderKitchenLog'),
        join: {
          from: 'restaurants.id',
          to: 'order_kitchen_logs.restaurant_id'
        }
      }
    };
  }

  // Get active restaurants
  static getActive() {
    return this.query().where('is_active', true).orderBy('name');
  }

  // Get restaurants by type
  static getByType(type) {
    return this.query()
      .where('restaurant_type', type)
      .where('is_active', true)
      .orderBy('name');
  }

  // Get restaurants with kitchens
  static getWithKitchens() {
    return this.query()
      .where('has_kitchen', true)
      .where('is_active', true)
      .orderBy('name');
  }

  // Get restaurant with its menu
  static getWithMenu(restaurantId) {
    return this.query()
      .findById(restaurantId)
      .withGraphFetched('[menuCategories.items]')
      .modifyGraph('menuCategories', builder => {
        builder.where('is_active', true).orderBy('display_order');
      })
      .modifyGraph('menuCategories.items', builder => {
        builder.where('is_available', true).orderBy('display_order');
      });
  }

  // Get restaurant with its staff
  static getWithStaff(restaurantId) {
    return this.query()
      .findById(restaurantId)
      .withGraphFetched('staff')
      .modifyGraph('staff', builder => {
        builder.select('users.*', 'restaurant_staff.role as restaurant_role', 'restaurant_staff.is_active as is_active_in_restaurant');
      });
  }

  // Get restaurant statistics
  async getStatistics() {
    const stats = await Restaurant.knex().raw(`
      SELECT 
        (SELECT COUNT(*) FROM restaurant_tables WHERE restaurant_id = ? AND is_active = true) as total_tables,
        (SELECT COUNT(*) FROM menu_categories WHERE restaurant_id = ? AND is_active = true) as total_menu_categories,
        (SELECT COUNT(*) FROM menu_items mi 
         JOIN menu_categories mc ON mi.category_id = mc.id 
         WHERE mc.restaurant_id = ? AND mi.is_available = true) as total_menu_items,
        (SELECT COUNT(*) FROM orders WHERE restaurant_id = ? AND DATE(created_at) = CURRENT_DATE) as todays_orders,
        (SELECT COUNT(*) FROM orders WHERE target_kitchen_id = ? AND kitchen_status = 'pending') as pending_kitchen_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE restaurant_id = ? AND DATE(created_at) = CURRENT_DATE) as todays_revenue
    `, [this.id, this.id, this.id, this.id, this.id, this.id]);

    return stats.rows[0];
  }

  // Check if user has access to this restaurant
  async hasUserAccess(userId, requiredRole = null) {
    let query = Restaurant.relatedQuery('staff', this)
      .where('users.id', userId)
      .where('restaurant_staff.is_active', true);

    if (requiredRole) {
      query = query.where('restaurant_staff.role', requiredRole);
    }

    const staffRecord = await query.first();
    return !!staffRecord;
  }

  // Assign staff to restaurant
  async assignStaff(userId, role) {
    const existingAssignment = await Restaurant.knex()('restaurant_staff')
      .where({
        user_id: userId,
        restaurant_id: this.id,
        role: role
      })
      .first();

    if (existingAssignment) {
      return await Restaurant.knex()('restaurant_staff')
        .where({
          user_id: userId,
          restaurant_id: this.id,
          role: role
        })
        .update({
          is_active: true,
          updated_at: new Date()
        })
        .returning('*');
    } else {
      return await Restaurant.knex()('restaurant_staff').insert({
        user_id: userId,
        restaurant_id: this.id,
        role: role,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');
    }
  }

  // Remove staff from restaurant
  async removeStaff(userId, role) {
    return await Restaurant.knex()('restaurant_staff')
      .where({
        user_id: userId,
        restaurant_id: this.id,
        role: role
      })
      .update({
        is_active: false,
        updated_at: new Date()
      });
  }
}

module.exports = Restaurant;
