const RoomType = require('../models/RoomType');
const Room = require('../models/Room');
const db = require('../config/database');

class RoomTypeDAO {
  /**
   * Get all active room types
   */
  async getAllActive() {
    try {
      return await RoomType.getActiveRoomTypes();
    } catch (error) {
      throw new Error(`Failed to fetch room types: ${error.message}`);
    }
  }

  /**
   * Get room type by ID
   */
  async getById(id) {
    try {
      const roomType = await RoomType.query()
        .findById(id)
        .where('is_active', true)
        .first();
      
      if (!roomType) {
        throw new Error('Room type not found');
      }

      return {
        ...roomType.toJSON(),
        totalRooms: 5 // Mock value until rooms table is set up
      };
    } catch (error) {
      throw new Error(`Failed to fetch room type: ${error.message}`);
    }
  }

  /**
   * Create new room type
   */
  async create(roomTypeData) {
    try {
      // Validate required fields
      if (!roomTypeData.name || !roomTypeData.max_occupancy || !roomTypeData.base_price) {
        throw new Error('Name, max_occupancy, and base_price are required');
      }

      const roomType = await RoomType.query().insert(roomTypeData);
      return roomType.toJSON();
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Room type with this name already exists');
      }
      throw new Error(`Failed to create room type: ${error.message}`);
    }
  }

  /**
   * Update room type
   */
  async update(id, updateData) {
    try {
      const roomType = await RoomType.query().findById(id).where('is_active', true).first();
      
      if (!roomType) {
        throw new Error('Room type not found');
      }

      const updatedRoomType = await RoomType.query()
        .patchAndFetchById(id, updateData);
      
      return updatedRoomType.toJSON();
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Room type with this name already exists');
      }
      throw new Error(`Failed to update room type: ${error.message}`);
    }
  }

  /**
   * Soft delete room type
   */
  async delete(id) {
    try {
      const roomType = await RoomType.query().findById(id).where('is_active', true).first();
      
      if (!roomType) {
        throw new Error('Room type not found');
      }

      // For now, skip room validation until rooms table is properly set up
      // In production, you'd check for active rooms first

      await roomType.softDelete();
      return { message: 'Room type deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete room type: ${error.message}`);
    }
  }

  /**
   * Check room availability for date range
   */
  async checkAvailability(checkInDate, checkOutDate, guestCount) {
    try {
      // Use direct database query to avoid ORM relationship issues
      const roomTypes = await db('room_types')
        .where('is_active', true)
        .where('max_occupancy', '>=', guestCount)
        .orderBy('base_price', 'asc');

      return roomTypes.map(roomType => {
        const nights = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
        const basePrice = parseFloat(roomType.base_price);
        const totalPrice = basePrice * nights;
        const taxes = Math.round(totalPrice * 0.12 * 100) / 100; // 12% tax
        
        return {
          id: roomType.id,
          name: roomType.name,
          description: roomType.description,
          capacity: roomType.max_occupancy, // Use max_occupancy as capacity for API consistency
          max_occupancy: roomType.max_occupancy,
          amenities: roomType.amenities,
          images: roomType.images,
          totalRooms: 5, // Mock value
          availableCount: 3, // Mock value
          pricing: {
            basePrice: basePrice,
            pricePerNight: basePrice,
            totalPrice: totalPrice,
            nights: nights,
            taxes: taxes,
            totalWithTax: Math.round((totalPrice + taxes) * 100) / 100
          }
        };
      });
    } catch (error) {
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  }

  /**
   * Get room types with capacity filter
   */
  async getByCapacity(minCapacity) {
    try {
      return await RoomType.query()
        .where('is_active', true)
        .where('max_occupancy', '>=', minCapacity)
        .orderBy('base_price', 'asc');
    } catch (error) {
      throw new Error(`Failed to fetch room types by capacity: ${error.message}`);
    }
  }

  /**
   * Bulk update prices
   */
  async bulkUpdatePrices(priceAdjustment) {
    try {
      const { percentage, roomTypeIds } = priceAdjustment;
      
      let query = RoomType.query().where('is_active', true);
      
      if (roomTypeIds && roomTypeIds.length > 0) {
        query = query.whereIn('id', roomTypeIds);
      }

      const roomTypes = await query;
      const updatePromises = roomTypes.map(async (roomType) => {
        const currentPrice = parseFloat(roomType.base_price);
        const newPrice = currentPrice * (1 + percentage / 100);
        
        return await roomType.$query().patch({
          base_price: Math.round(newPrice * 100) / 100
        });
      });

      await Promise.all(updatePromises);
      
      return {
        message: `Updated prices for ${roomTypes.length} room types`,
        adjustedCount: roomTypes.length
      };
    } catch (error) {
      throw new Error(`Failed to bulk update prices: ${error.message}`);
    }
  }
}

module.exports = new RoomTypeDAO();
