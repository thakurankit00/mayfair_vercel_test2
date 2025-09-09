const BaseModel = require('./BaseModel');

class MenuItem extends BaseModel {
  static get tableName() {
    return 'menu_items';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['category_id', 'name', 'price'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        category_id: { type: 'string', format: 'uuid' },
        name: { type: 'string', maxLength: 200 },
        description: { type: ['string', 'null'] },
        price: { type: 'number', minimum: 0 },
        image_url: { type: ['string', 'null'] },
        ingredients: { type: ['string', 'null'] },
        allergens: { type: ['string', 'null'] },
        is_vegetarian: { type: 'boolean', default: false },
        is_vegan: { type: 'boolean', default: false },
        is_gluten_free: { type: 'boolean', default: false },
        is_available: { type: 'boolean', default: true },
        preparation_time: { type: ['integer', 'null'], minimum: 0 },
        calories: { type: ['integer', 'null'], minimum: 0 },
        display_order: { type: 'integer', minimum: 0 },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      // Category this item belongs to
      category: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./MenuCategory'),
        join: {
          from: 'menu_items.category_id',
          to: 'menu_categories.id'
        }
      }
    };
  }

  // Get available items by category
  static getByCategory(categoryId) {
    return this.query()
      .where('category_id', categoryId)
      .where('is_available', true)
      .orderBy('display_order', 'asc');
  }

  // Get available items by restaurant
  static getByRestaurant(restaurantId) {
    return this.query()
      .join('menu_categories', 'menu_items.category_id', 'menu_categories.id')
      .where('menu_categories.restaurant_id', restaurantId)
      .where('menu_items.is_available', true)
      .where('menu_categories.is_active', true)
      .select('menu_items.*')
      .orderBy('menu_categories.display_order', 'asc')
      .orderBy('menu_items.display_order', 'asc');
  }

  // Search items by name or description
  static search(query, restaurantId = null) {
    let queryBuilder = this.query()
      .where(builder => {
        builder
          .where('name', 'ilike', `%${query}%`)
          .orWhere('description', 'ilike', `%${query}%`);
      })
      .where('is_available', true);

    if (restaurantId) {
      queryBuilder = queryBuilder
        .join('menu_categories', 'menu_items.category_id', 'menu_categories.id')
        .where('menu_categories.restaurant_id', restaurantId)
        .where('menu_categories.is_active', true)
        .select('menu_items.*');
    }

    return queryBuilder.orderBy('name');
  }
}

module.exports = MenuItem;
