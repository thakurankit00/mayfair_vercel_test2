const BaseModel = require('./BaseModel');

class User extends BaseModel {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['email', 'password', 'first_name', 'role'],
      properties: {
        ...super.jsonSchema.properties,
        email: { type: 'string', format: 'email', maxLength: 255 },
        password: { type: 'string', minLength: 6, maxLength: 255 },
        first_name: { type: 'string', minLength: 1, maxLength: 255 },
        last_name: { type: ['string', 'null'], maxLength: 255 },
        phone: { type: ['string', 'null'], maxLength: 20 },
        role: { 
          type: 'string', 
          enum: ['customer', 'receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin']
        },
        preferences: { type: ['object', 'null'] },
        is_active: { type: 'boolean', default: true }
      }
    };
  }

  static get relationMappings() {
    return {
      // A user has many bookings
      bookings: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./RoomBooking'),
        join: {
          from: 'users.id',
          to: 'room_bookings.customer_id'
        }
      }
    };
  }

  // Hide password in JSON responses
  $formatJson(json) {
    json = super.$formatJson(json);
    delete json.password;
    return json;
  }
}

module.exports = User;
