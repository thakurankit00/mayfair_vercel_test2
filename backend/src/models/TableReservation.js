const BaseModel = require('./BaseModel');

class TableReservation extends BaseModel {
  static get tableName() {
    return 'table_reservations';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      table: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./RestaurantTable'),
        join: {
          from: 'table_reservations.table_id',
          to: 'restaurant_tables.id'
        }
      },
      
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./User'),
        join: {
          from: 'table_reservations.user_id',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = TableReservation;
