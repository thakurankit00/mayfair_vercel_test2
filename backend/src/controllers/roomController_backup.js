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
      console.error('Error fetching occupied rooms:', error);
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
      console.error('Error fetching room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch room details'
      });
    }
  }
};

module.exports = roomController;