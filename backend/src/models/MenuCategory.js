const BaseModel = require('./BaseModel');

class MenuCategory extends BaseModel {
  static get tableName() {
    return 'menu_categories';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'type'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', maxLength: 100 },
        description: { type: ['string', 'null'] },
        type: { type: 'string', maxLength: 20 },
        restaurant_id: { type: ['string', 'null'], format: 'uuid' },
        display_order: { type: 'integer', minimum: 0 },
        is_active: { type: 'boolean', default: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      // Restaurant this category belongs to
      restaurant: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./Restaurant'),
        join: {
          from: 'menu_categories.restaurant_id',
          to: 'restaurants.id'
        }
      },

      // Menu items in this category
      items: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./MenuItem'),
        join: {
          from: 'menu_categories.id',
          to: 'menu_items.category_id'
        }
      }
    };
  }

  // Get categories by restaurant
  static getByRestaurant(restaurantId) {
    return this.query()
      .where('restaurant_id', restaurantId)
      .where('is_active', true)
      .orderBy('display_order', 'asc');
  }

  // Get categories by type
  static getByType(type, restaurantId = null) {
    let query = this.query()
      .where('type', type)
      .where('is_active', true);
    
    if (restaurantId) {
      query = query.where('restaurant_id', restaurantId);
    }

    return query.orderBy('display_order', 'asc');
  }

  // Get category with items
  static getWithItems(categoryId) {
    return this.query()
      .findById(categoryId)
      .withGraphFetched('items')
      .modifyGraph('items', builder => {
        builder.where('is_available', true).orderBy('display_order');
      });
  }
}

module.exports = MenuCategory;
