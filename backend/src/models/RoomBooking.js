const BaseModel = require('./BaseModel');

class RoomBooking extends BaseModel {
  static get tableName() {
    return 'room_bookings';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['room_id', 'user_id', 'check_in_date', 'check_out_date', 'adults', 'total_amount'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        booking_reference: { type: 'string' },
        room_id: { type: 'string', format: 'uuid' },
        user_id: { type: 'string', format: 'uuid' },
        check_in_date: { type: 'string', format: 'date' },
        check_out_date: { type: 'string', format: 'date' },
        adults: { type: 'integer', minimum: 1, maximum: 10 },
        children: { type: 'integer', minimum: 0, maximum: 8 },
        total_amount: { type: 'number', minimum: 0 },
        paid_amount: { type: 'number', minimum: 0 },
        status: {
          type: 'string',
          enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'],
          default: 'pending'
        },
        platform_booking_id: { type: ['string', 'null'] },
        platform: {
          type: ['string', 'null'],
          enum: [null, 'makemytrip', 'booking', 'airbnb', 'yatra', 'easemytrip', 'trivago', 'direct']
        },
        special_requests: { type: ['string', 'null'], maxLength: 1000 },
        guest_info: { type: ['string', 'null'] },
        checked_in_at: { type: ['string', 'null'], format: 'date-time' },
        checked_out_at: { type: ['string', 'null'], format: 'date-time' },
        checked_in_by: { type: ['string', 'null'], format: 'uuid' },
        checked_out_by: { type: ['string', 'null'], format: 'uuid' },
        cancellation_reason: { type: ['string', 'null'] },
        cancelled_at: { type: ['string', 'null'], format: 'date-time' },
        cancelled_by: { type: ['string', 'null'], format: 'uuid' }
      }
    };
  }

  static get relationMappings() {
    return {
      // A booking belongs to a room
      room: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./Room'),
        join: {
          from: 'room_bookings.room_id',
          to: 'rooms.id'
        }
      },

      // A booking belongs to a user (customer)
      customer: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require('./User'),
        join: {
          from: 'room_bookings.user_id',
          to: 'users.id'
        }
      }
    };
  }

  // Instance methods
  getNights() {
    const checkIn = new Date(this.check_in_date);
    const checkOut = new Date(this.check_out_date);
    const timeDiff = checkOut - checkIn;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  async canBeCancelled() {
    const checkInDate = new Date(this.check_in_date);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
    
    // Can cancel up to 24 hours before check-in
    return hoursUntilCheckIn > 24 && ['pending', 'confirmed'].includes(this.status);
  }

  async cancel(reason = null) {
    if (await this.canBeCancelled()) {
      return await this.$query().patch({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      });
    }
    throw new Error('Booking cannot be cancelled at this time');
  }

  // Static methods
  static async getActiveBookings() {
    return await this.query()
      .whereNotIn('status', ['cancelled'])
      .modify('active')
      .orderBy('check_in_date', 'asc');
  }

  static async getBookingsByDateRange(startDate, endDate) {
    return await this.query()
      .where('check_in_date', '>=', startDate)
      .where('check_in_date', '<=', endDate)
      .modify('active')
      .orderBy('check_in_date', 'asc');
  }

  static async hasConflictingBookings(roomId, checkInDate, checkOutDate, excludeBookingId = null) {
    let query = this.query()
      .where('room_id', roomId)
      .whereNotIn('status', ['cancelled'])
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
      });

    if (excludeBookingId) {
      query = query.where('id', '!=', excludeBookingId);
    }

    const conflicts = await query;
    return conflicts.length > 0;
  }

  // Format for API response
  toJSON() {
    const json = super.toJSON ? super.toJSON() : { ...this };
    
    // Convert total_amount to number
    if (json.total_amount) {
      json.total_amount = parseFloat(json.total_amount);
    }

    // Add computed properties
    json.nights = this.getNights();

    return json;
  }
}

module.exports = RoomBooking;
