const BaseModel = require('./BaseModel');

class Room extends BaseModel {
  static get tableName() {
    return 'rooms';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['room_type_id', 'room_number'],
      properties: {
        ...super.jsonSchema.properties,
        room_type_id: { type: 'string', format: 'uuid' },
        room_number: { type: 'string', minLength: 1, maxLength: 50 },
        floor: { type: ['integer', 'null'], minimum: 0 },
        status: { 
          type: 'string', 
          enum: ['available', 'occupied', 'maintenance', 'out_of_order'],
          default: 'available'
        },
        is_active: { type: 'boolean', default: true }
      }
    };
  }

  static get relationMappings() {
    return {
      // A room belongs to a room type
      roomType: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./RoomType'),
        join: {
          from: 'rooms.room_type_id',
          to: 'room_types.id'
        }
      },

      // A room has many bookings
      bookings: {
        relation: BaseModel.HasManyRelation,
        modelClass: require('./RoomBooking'),
        join: {
          from: 'rooms.id',
          to: 'room_bookings.room_id'
        }
      }
    };
  }

  // Instance methods
  async isAvailable(checkInDate, checkOutDate) {
    if (this.status !== 'available' || !this.is_active) {
      return false;
    }

    const conflictingBooking = await this.$relatedQuery('bookings')
      .whereNotIn('status', ['cancelled', 'no_show'])
      .andWhere(function() {
        this.where(function() {
          this.where('check_in_date', '<=', checkInDate)
            .andWhere('check_out_date', '>', checkInDate);
        })
        .orWhere(function() {
          this.where('check_in_date', '<', checkOutDate)
            .andWhere('check_out_date', '>=', checkOutDate);
        })
        .orWhere(function() {
          this.where('check_in_date', '>=', checkInDate)
            .andWhere('check_out_date', '<=', checkOutDate);
        });
      })
      .first();

    return !conflictingBooking;
  }

  // Static methods
  static async getAvailableByRoomType(roomTypeId, checkInDate, checkOutDate) {
    const rooms = await this.query()
      .where('room_type_id', roomTypeId)
      .where('status', 'available')
      .modify('active');

    const availableRooms = [];
    for (const room of rooms) {
      if (await room.isAvailable(checkInDate, checkOutDate)) {
        availableRooms.push(room);
      }
    }

    return availableRooms;
  }

  static async countAvailableByRoomType(roomTypeId, checkInDate, checkOutDate) {
    const availableRooms = await this.getAvailableByRoomType(roomTypeId, checkInDate, checkOutDate);
    return availableRooms.length;
  }
}

module.exports = Room;
