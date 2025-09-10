const BaseModel = require('./BaseModel');

class OrderItem extends BaseModel {
  static get tableName() {
    return 'order_items';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      order: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./Order'),
        join: {
          from: 'order_items.order_id',
          to: 'orders.id'
        }
      }
    };
  }
}

module.exports = OrderItem;
