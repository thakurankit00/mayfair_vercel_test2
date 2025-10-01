const BaseModel = require('./BaseModel');

class RoomType extends BaseModel {
  static get tableName() {
    return 'room_types';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'max_occupancy', 'base_price'],
      properties: {
        ...super.jsonSchema.properties,
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: ['string', 'null'], maxLength: 1000 },
        max_occupancy: { type: 'integer', minimum: 1, maximum: 20 },
        base_price: { type: 'number', minimum: 0 },
        amenities: {
          type: ['array', 'null'],
          items: { type: 'string' }
        },
        images: {
          type: ['array', 'null'],
          items: { type: 'string' }
        },
        is_active: { type: 'boolean', default: true }
      }
    };
  }

  // Temporarily disabled relationships to avoid database schema issues
  // static get relationMappings() {
  //   return {};
  // }

  // Instance methods
  async getRoomsCount() {
    // Simplified version - return mock data until rooms table is properly set up
    return 5;
  }

  async getAvailableRoomsCount(checkInDate, checkOutDate) {
    const totalRooms = await this.getRoomsCount();
    
    const bookedRooms = await this.$relatedQuery('bookings')
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
      .countDistinct('room_id as count')
      .first();

    return totalRooms - parseInt(bookedRooms?.count || 0);
  }

  // Static methods
  static async getActiveRoomTypes() {
    const roomTypes = await this.query()
      .where('is_active', true)
      .orderBy('base_price', 'asc');
    
    // Add mock room count to each room type
    return roomTypes.map(rt => ({
      ...rt.toJSON(),
      totalRooms: 5
    }));
  }

  static async findByCapacity(minCapacity) {
    return await this.query()
      .where('is_active', true)
      .where('max_occupancy', '>=', minCapacity)
      .orderBy('base_price', 'asc');
  }

  static async searchAvailable(checkInDate, checkOutDate, guestCount) {
    // For now, return all room types that can accommodate the guest count
    // This is a simplified version until the database schema is fully set up
    const roomTypes = await this.query()
      .modify('active')
      .where('max_occupancy', '>=', guestCount)
      .orderBy('base_price', 'asc');

    return roomTypes.map(roomType => ({
      ...roomType.toJSON(),
      totalRooms: 5, // Mock value
      availableCount: 3 // Mock value
    }));
  }

  // Format for API response
  toJSON() {
    const json = super.toJSON ? super.toJSON() : { ...this };
    
    // Convert base_price to number
    if (json.base_price) {
      json.base_price = parseFloat(json.base_price);
    }

    // Ensure amenities and images are arrays
    json.amenities = json.amenities || [];
    json.images = json.images || [];

    return json;
  }
}

module.exports = RoomType;
