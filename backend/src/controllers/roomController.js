const db = require('../config/database');

const roomController = {
  // Get occupied rooms for room service
  getOccupiedRooms: async (req, res) => {
    try {
      const query = `
        SELECT 
          r.id,
          r.room_number,
          b.guest_first_name,
          b.guest_last_name,
          b.guest_phone,
          b.guest_email,
          b.check_in_date,
          b.check_out_date,
          b.status as booking_status
        FROM rooms r
        INNER JOIN bookings b ON r.id = b.room_id
        WHERE b.status = 'checked_in'
          AND b.check_in_date <= CURRENT_DATE
          AND b.check_out_date > CURRENT_DATE
        ORDER BY r.room_number ASC
      `;

      const result = await db.query(query);
      
      res.json({
        success: true,
        rooms: result.rows || []
      });
    } catch (error) {
      console.error('Error fetching occupied rooms: - roomController.js:33', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch occupied rooms'
      });
    }
  },

  // Get room by ID
  getRoomById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          r.*,
          b.guest_first_name,
          b.guest_last_name,
          b.guest_phone,
          b.guest_email,
          b.check_in_date,
          b.check_out_date,
          b.status as booking_status
        FROM rooms r
        LEFT JOIN bookings b ON r.id = b.room_id 
          AND b.status = 'checked_in'
          AND b.check_in_date <= CURRENT_DATE
          AND b.check_out_date > CURRENT_DATE
        WHERE r.id = $1
      `;

      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      res.json({
        success: true,
        room: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching room: - roomController.js:78', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch room details'
      });
    }
  },

  // Check room availability
  checkAvailability: async (req, res) => {
    try {
      const { checkIn, checkOut, roomType } = req.query;
      
      if (!checkIn || !checkOut) {
        return res.status(400).json({
          success: false,
          message: 'Check-in and check-out dates are required'
        });
      }
      
      let query = `
        SELECT 
          r.id,
          r.room_number,
          r.floor,
          r.status,
          r.max_occupancy,
          r.base_price,
          rt.id as room_type_id,
          rt.name as room_type_name,
          rt.base_price as type_base_price,
          rt.max_occupancy as type_max_occupancy
        FROM rooms r
        LEFT JOIN room_types rt ON r.room_type_id = rt.id
        WHERE r.status = 'available'
          AND rt.id IS NOT NULL
          AND r.id NOT IN (
            SELECT DISTINCT rb.room_id 
            FROM room_bookings rb
            WHERE rb.status IN ('confirmed', 'checked_in', 'pending')
              AND ((rb.check_in_date <= $1 AND rb.check_out_date > $1)
                   OR (rb.check_in_date < $2 AND rb.check_out_date >= $2)
                   OR (rb.check_in_date >= $1 AND rb.check_out_date <= $2))
          )
      `;
      
      const params = [checkIn, checkOut];
      
      if (roomType) {
        query += ` AND rt.id = $3`;
        params.push(roomType);
      }
      
      query += ` ORDER BY r.room_number`;
      
      const result = await db.query(query, params);
      
      res.json({
        success: true,
        availableRooms: result.rows || [],
        totalRooms: result.rows?.length || 0
      });
    } catch (error) {
      console.error('Error checking availability: - roomController.js:121', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check room availability',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Search rooms (alias for checkAvailability)
  searchRooms: async (req, res) => {
    return roomController.checkAvailability(req, res);
  },

  // Get room types
  getRoomTypes: async (req, res) => {
    try {
      const query = `
        SELECT rt.*, 
               COUNT(r.id) as total_rooms,
               COUNT(CASE WHEN r.status = 'available' THEN 1 END) as available_rooms
        FROM room_types rt
        LEFT JOIN rooms r ON rt.id = r.room_type_id
        GROUP BY rt.id, rt.name, rt.description, rt.base_price, rt.max_occupancy, rt.amenities
        ORDER BY rt.name
      `;
      
      const result = await db.query(query);
      
      res.json({
        success: true,
        roomTypes: result.rows
      });
    } catch (error) {
      console.error('Error fetching room types: - roomController.js:149', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch room types'
      });
    }
  },

  // Get room type by ID
  getRoomTypeById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT rt.*, 
               COUNT(r.id) as total_rooms,
               COUNT(CASE WHEN r.status = 'available' THEN 1 END) as available_rooms
        FROM room_types rt
        LEFT JOIN rooms r ON rt.id = r.room_type_id
        WHERE rt.id = $1
        GROUP BY rt.id, rt.name, rt.description, rt.base_price, rt.max_occupancy, rt.amenities
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Room type not found'
        });
      }
      
      res.json({
        success: true,
        roomType: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching room type: - roomController.js:186', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch room type'
      });
    }
  },

  // Create room type
  createRoomType: async (req, res) => {
    try {
      const { name, description, base_price, max_occupancy, amenities } = req.body;
      
      const query = `
        INSERT INTO room_types (name, description, base_price, max_occupancy, amenities)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const result = await db.query(query, [name, description, base_price, max_occupancy, amenities]);
      
      res.status(201).json({
        success: true,
        roomType: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating room type: - roomController.js:212', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create room type'
      });
    }
  },

  // Update room type
  updateRoomType: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, base_price, max_occupancy, amenities } = req.body;
      
      const query = `
        UPDATE room_types 
        SET name = $1, description = $2, base_price = $3, max_occupancy = $4, amenities = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `;
      
      const result = await db.query(query, [name, description, base_price, max_occupancy, amenities, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Room type not found'
        });
      }
      
      res.json({
        success: true,
        roomType: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating room type: - roomController.js:247', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update room type'
      });
    }
  },

  // Delete room type
  deleteRoomType: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `DELETE FROM room_types WHERE id = $1 RETURNING *`;
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Room type not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Room type deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting room type: - roomController.js:275', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete room type'
      });
    }
  },

  // Bulk update prices
  bulkUpdatePrices: async (req, res) => {
    try {
      const { updates } = req.body; // Array of {id, base_price}
      
      const client = await db.getClient();
      await client.query('BEGIN');
      
      try {
        for (const update of updates) {
          await client.query(
            'UPDATE room_types SET base_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [update.base_price, update.id]
          );
        }
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Prices updated successfully'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error bulk updating prices: - roomController.js:312', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update prices'
      });
    }
  }
};

module.exports = roomController;