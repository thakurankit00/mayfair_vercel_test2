const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Table Reservation Management Controller
 */

/**
 * Get table availability
 * GET /api/v1/restaurant/availability
 */
const getTableAvailability = async (req, res) => {
  try {
    const { date, time, party_size, location } = req.query;
    
    if (!date || !time || !party_size) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Date, time, and party size are required'
        }
      });
    }
    
    const partySize = parseInt(party_size);
    const reservationDate = new Date(date);
    const reservationTime = time + ':00'; // Ensure proper time format
    
    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (reservationDate < today) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAST_DATE',
          message: 'Reservation date cannot be in the past'
        }
      });
    }
    
    // Get all tables that can accommodate the party size
    let tablesQuery = db('restaurant_tables')
      .select('*')
      .where('is_active', true)
      .where('capacity', '>=', partySize)
      .orderBy(['location', 'table_number']);
    
    if (location) {
      tablesQuery = tablesQuery.where('location', location);
    }
    
    const allTables = await tablesQuery;
    
    // Get existing reservations for the date and time slot (2-hour window)
    const startTime = new Date(`${date}T${reservationTime}`);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    
    const existingReservations = await db('table_reservations')
      .select('table_id')
      .where('reservation_date', date)
      .where('status', 'confirmed','pending','cancelled')
      .where(function() {
        this.whereBetween('reservation_time', [
          time,
          new Date(endTime).toTimeString().slice(0, 8)
        ]);
      });
    
    const reservedTableIds = new Set(existingReservations.map(r => r.table_id));
    
    // Filter available tables
    const availableTables = allTables.filter(table => 
      !reservedTableIds.has(table.id)
    );
    
    return res.status(200).json({
      success: true,
      data: {
        availableTables,
        searchCriteria: {
          date,
          time,
          party_size: partySize,
          location: location || 'all'
        },
        totalAvailable: availableTables.length,
        locations: [...new Set(availableTables.map(t => t.location))]
      }
    });
    
  } catch (error) {
    console.error('Get table availability error: - reservationController.js:95', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to check table availability'
      }
    });
  }
};

/**
 * Create table reservation
 * POST /api/v1/restaurant/reservations
 */
const createReservation = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      table_id,
      reservation_date,
      reservation_time,
      party_size,
      status,
      special_requests
    } = req.body;
    
    const userId = req.user.id;
    
    // Validation
    if (!table_id || !reservation_date || !reservation_time || !party_size) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Table, date, time, and party size are required'
        }
      });
    }
    
    // Check if table exists and is active
    const table = await db('restaurant_tables')
      .where('id', table_id)
      .where('is_active', true)
      .first();
    
    if (!table) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TABLE_NOT_FOUND',
          message: 'Table not found or not available'
        }
      });
    }
    
    // Check table capacity
    if (table.capacity < parseInt(party_size)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_CAPACITY',
          message: `Table can only accommodate ${table.capacity} guests`
        }
      });
    }
    
    // Check if table is already reserved for this time slot
    const existingReservation = await db('table_reservations')
      .where('table_id', table_id)
      .where('reservation_date', reservation_date)
      .where('reservation_time', reservation_time + ':00')
      .where('status', 'confirmed')
      .first();
    
    if (existingReservation) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'TABLE_UNAVAILABLE',
          message: 'Table is already reserved for this time'
        }
      });
    }
    
    // Generate reservation reference
    const reservationReference = 'RES' + Date.now().toString().slice(-6);
    
    const reservationId = uuidv4();
    const newReservation = await db('table_reservations')
      .insert({
        id: reservationId,
        reservation_reference: reservationReference,
        user_id: userId,
        table_id,
        reservation_date,
        reservation_time: reservation_time + ':00',
        party_size: parseInt(party_size),
        duration_minutes: 120, // Default 2 hours
        special_requests,
        status: 'confirmed',
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    // Get complete reservation details with table info
    const reservationDetails = await db('table_reservations as tr')
      .select('tr.*', 'rt.table_number', 'rt.location', 'rt.capacity')
      .join('restaurant_tables as rt', 'tr.table_id', 'rt.id')
      .where('tr.id', reservationId)
      .first();
    
    return res.status(201).json({
      success: true,
      data: { reservation: reservationDetails },
      message: 'Table reservation created successfully'
    });
    
  } catch (error) {
    console.error('Create reservation error: - reservationController.js:218', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create table reservation'
      }
    });
  }
};

/**
 * Get user reservations
 * GET /api/v1/restaurant/reservations
 */
const getReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, date_from, date_to } = req.query;
    
    let query = db('table_reservations as tr')
      .select(
        'tr.*',
        'rt.table_number',
        'rt.location',
        'rt.capacity',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.phone'
      )
      .join('restaurant_tables as rt', 'tr.table_id', 'rt.id')
      .join('users as u', 'tr.user_id', 'u.id')
      .orderBy('tr.reservation_date', 'desc')
      .orderBy('tr.reservation_time', 'desc');
    
    // Filter by user role
    if (['customer'].includes(userRole)) {
      query = query.where('tr.user_id', userId);
    }
    // Staff can see all reservations
    
    // Apply filters
    if (status) {
      query = query.where('tr.status', status);
    }
    
    if (date_from) {
      query = query.where('tr.reservation_date', '>=', date_from);
    }
    
    if (date_to) {
      query = query.where('tr.reservation_date', '<=', date_to);
    }
    
    const reservations = await query;
    
    return res.status(200).json({
      success: true,
      data: {
        reservations,
        totalReservations: reservations.length
      }
    });
    
  } catch (error) {
    console.error('Get reservations error: - reservationController.js:285', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch reservations'
      }
    });
  }
};

/**
 * Update reservation
 * PUT /api/v1/restaurant/reservations/:id
 */
const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const updateData = req.body;
    
    // Get existing reservation
    const existingReservation = await db('table_reservations')
      .where('id', id)
      .first();
    
    if (!existingReservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reservation not found'
        }
      });
    }
    
    // Check permissions
    if (userRole === 'customer' && existingReservation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only update your own reservations'
        }
      });
    }
    
    // Process update data
    const processedData = { updated_at: new Date() };
    
    if (updateData.reservation_date) processedData.reservation_date = updateData.reservation_date;
    if (updateData.reservation_time) processedData.reservation_time = updateData.reservation_time + ':00';
    if (updateData.party_size) processedData.party_size = parseInt(updateData.party_size);
    if (updateData.special_requests) processedData.special_requests = updateData.special_requests;
    if (updateData.status && ['receptionist', 'waiter', 'manager', 'admin'].includes(userRole)) {
      processedData.status = updateData.status;
      if (updateData.status === 'seated') {
        processedData.seated_at = new Date();
      }
      if (updateData.status === 'completed') {
        processedData.completed_at = new Date();
      }
    }
    
    const updatedReservation = await db('table_reservations')
      .where('id', id)
      .update(processedData)
      .returning('*');
    
    return res.status(200).json({
      success: true,
      data: { reservation: updatedReservation[0] },
      message: 'Reservation updated successfully'
    });
    
  } catch (error) {
    console.error('Update reservation error: - reservationController.js:362', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update reservation'
      }
    });
  }
};

/**
 * Cancel reservation
 * DELETE /api/v1/restaurant/reservations/:id
 */
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const existingReservation = await db('table_reservations')
      .where('id', id)
      .first();
    
    if (!existingReservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reservation not found'
        }
      });
    }
    
    // Check permissions
    if (userRole === 'customer' && existingReservation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You can only cancel your own reservations'
        }
      });
    }
    
    // Update status to cancelled
    await db('table_reservations')
      .where('id', id)
      .update({
        status: 'cancelled',
        updated_at: new Date()
      });
    
    return res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
    
  } catch (error) {
    console.error('Cancel reservation error: - reservationController.js:422', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to cancel reservation'
      }
    });
  }
};

module.exports = {
  getTableAvailability,
  createReservation,
  getReservations,
  updateReservation,
  cancelReservation
};
