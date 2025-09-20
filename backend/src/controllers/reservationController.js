const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getTableBookingStatus, getComprehensiveTableStatus } = require('../utils/tableStatus');

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
    const reservationTime = time.includes(':') ? time + ':00' : time + ':00:00'; // Ensure proper time format
    
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
    // Simplified time conflict checking
    // Use EXTRACT(HOUR FROM reservation_time) for Postgres
    const requestHour = parseInt(time.split(':')[0]);
    const startHour = Math.max(0, requestHour - 2);
    const endHour = Math.min(23, requestHour + 2);
    const existingReservations = await db('table_reservations')
      .select('table_id')
      .where('reservation_date', date)
      .whereIn('status', ['confirmed', 'pending', 'seated'])
      .whereRaw('EXTRACT(HOUR FROM reservation_time) BETWEEN ? AND ?', [startHour, endHour]);
    
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
    console.error('Get table availability error: - reservationController.js:92', error);
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
    
    const userId = req.user?.id; // Added optional chaining
    
    // Enhanced validation
    if (!table_id || !reservation_date || !reservation_time || !party_size) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Table, date, time, and party size are required'
        }
      });
    }

    // Validate party size is a positive number
    const partySizeNum = parseInt(party_size);
    if (isNaN(partySizeNum) || partySizeNum <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Party size must be a positive number'
        }
      });
    }

    // Validate date format and not in past
    const reservationDate = new Date(reservation_date);
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
    if (table.capacity < partySizeNum) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_CAPACITY',
          message: `Table can only accommodate ${table.capacity} guests`
        }
      });
    }
    
    // Enhanced time conflict checking with duration using OVERLAPS (Postgres)
    const requestTime = reservation_time.includes(':') ? reservation_time + ':00' : reservation_time + ':00:00';
    // Ensure time is always HH:mm:ss
    const requestStartStr = `${reservation_date} ${requestTime}`;
    // Default duration 120 minutes
    const durationMinutes = 120;
    
    // Calculate end time properly handling day overflow
    const [h, m, s] = requestTime.split(':').map(Number);
    let totalMinutes = h * 60 + m + durationMinutes;
    let endDate = new Date(`${reservation_date}T00:00:00`);
    endDate.setMinutes(totalMinutes);
    
    const requestEndStr = endDate.toISOString().slice(0, 19).replace('T', ' ');

    // Use raw SQL for OVERLAPS with proper timestamp casting
    const conflictQuery = `
      SELECT 1 FROM table_reservations 
      WHERE table_id = ? 
      AND reservation_date = ? 
      AND status IN ('confirmed', 'pending', 'seated') 
      AND (
        (reservation_date + reservation_time, 
         reservation_date + reservation_time + COALESCE(duration_minutes, 120) * interval '1 minute') 
        OVERLAPS 
        (?::timestamp, ?::timestamp)
      ) 
      LIMIT 1`;
    const conflictParams = [table_id, reservation_date, requestStartStr, requestEndStr];
    const conflictResult = await db.raw(conflictQuery, conflictParams);
    if (conflictResult.rows && conflictResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'TABLE_UNAVAILABLE',
          message: 'Table is already reserved for this time slot'
        }
      });
    }
    
    // Generate reservation reference
    const reservationReference = 'RES' + Date.now().toString().slice(-6);
    
    const reservationId = uuidv4();
    
    // Prepare reservation data (only fields that exist in table_reservations table)
    const reservationData = {
      id: reservationId,
      reservation_reference: reservationReference,
      user_id: userId,
      table_id,
      reservation_date,
      reservation_time: requestTime, // always HH:mm:ss
      party_size: partySizeNum,
      duration_minutes: 120, // Default 2 hours
      special_requests: special_requests || null,
      status: status || 'pending', // Default to pending
      // created_by: req.user?.id, // Will add after migration
      created_at: new Date(),
      updated_at: new Date()
    };

    // Note: Customer info (first_name, last_name, email, phone) is stored in users table
    // For walk-ins or phone reservations without user accounts, we'll need to handle differently
    
    await db('table_reservations').insert(reservationData);
    
    // Get complete reservation details with table info and user info
    const reservationDetails = await db('table_reservations as tr')
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
      .leftJoin('users as u', 'tr.user_id', 'u.id')
      .where('tr.id', reservationId)
      .first();
    
    // Emit socket event for table status update with comprehensive info
    const io = req.app.get('io');
    if (io) {
      const comprehensiveStatus = await getComprehensiveTableStatus(table_id);
      io.emit('table_status_updated', {
        table_id,
        ...comprehensiveStatus
      });
    }
    
    return res.status(201).json({
      success: true,
      data: { reservation: reservationDetails },
      message: 'Table reservation created successfully'
    });
    
  } catch (error) {
    console.error('Create reservation error: - reservationController.js:262', error);
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
    const userId = req.user?.id;
    const userRole = req.user?.role || 'customer';
    const { status, date_from, date_to, page = 1, limit = 20 } = req.query;
    
    let query = db('table_reservations as tr')
      .select(
        'tr.*',
        'rt.table_number',
        'rt.location',
        'rt.capacity',
        'u.first_name as user_first_name',
        'u.last_name as user_last_name',
        'u.email as user_email',
        'u.phone as user_phone'
      )
      .join('restaurant_tables as rt', 'tr.table_id', 'rt.id')
      .leftJoin('users as u', 'tr.user_id', 'u.id') // Left join in case of walk-in reservations
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
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).offset(offset);
    
    const reservations = await query;
    
    // Get total count for pagination
    let countQuery = db('table_reservations as tr')
      .join('restaurant_tables as rt', 'tr.table_id', 'rt.id')
      .leftJoin('users as u', 'tr.user_id', 'u.id');
    
    if (['customer'].includes(userRole)) {
      countQuery = countQuery.where('tr.user_id', userId);
    }
    
    if (status) {
      countQuery = countQuery.where('tr.status', status);
    }
    
    if (date_from) {
      countQuery = countQuery.where('tr.reservation_date', '>=', date_from);
    }
    
    if (date_to) {
      countQuery = countQuery.where('tr.reservation_date', '<=', date_to);
    }
    
    const totalCount = await countQuery.count('tr.id as count').first();
    
    return res.status(200).json({
      success: true,
      data: {
        reservations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount.count / parseInt(limit)),
          totalReservations: totalCount.count,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get reservations error: - reservationController.js:361', error);
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
    const userId = req.user?.id;
    const userRole = req.user?.role || 'customer';
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
    
    // Validate and process date if provided
    if (updateData.reservation_date) {
      const newDate = new Date(updateData.reservation_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (newDate < today) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PAST_DATE',
            message: 'Reservation date cannot be in the past'
          }
        });
      }
      processedData.reservation_date = updateData.reservation_date;
    }
    
    if (updateData.reservation_time) {
      processedData.reservation_time = updateData.reservation_time.includes(':') ? 
        updateData.reservation_time + ':00' : updateData.reservation_time + ':00:00';
    }
    
    if (updateData.party_size) {
      const partySize = parseInt(updateData.party_size);
      if (isNaN(partySize) || partySize <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Party size must be a positive number'
          }
        });
      }
      processedData.party_size = partySize;
    }
    
    if (updateData.special_requests !== undefined) processedData.special_requests = updateData.special_requests;
    if (updateData.duration_minutes) processedData.duration_minutes = parseInt(updateData.duration_minutes);
    
    // Status updates with proper role checking
    if (updateData.status && ['receptionist', 'waiter', 'manager', 'admin'].includes(userRole)) {
      processedData.status = updateData.status;
    }
    
    // Note: Customer info (first_name, last_name, email, phone) is stored in users table
    // These fields don't exist in table_reservations table
    
    const updatedReservation = await db('table_reservations')
      .where('id', id)
      .update(processedData)
      .returning('*');
    
    // Emit socket event for table status update with comprehensive info
    const io = req.app.get('io');
    if (io) {
      const comprehensiveStatus = await getComprehensiveTableStatus(existingReservation.table_id);
      io.emit('table_status_updated', {
        table_id: existingReservation.table_id,
        ...comprehensiveStatus
      });
    }
    
    return res.status(200).json({
      success: true,
      data: { reservation: updatedReservation[0] || updatedReservation },
      message: 'Reservation updated successfully'
    });
    
  } catch (error) {
    console.error('Update reservation error: - reservationController.js:486', error);
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
    const userId = req.user?.id;
    const userRole = req.user?.role || 'customer';
    const { reason } = req.body; // Optional cancellation reason
    
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
    
    // Check if reservation can be cancelled
    if (existingReservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: 'Cannot cancel a completed reservation'
        }
      });
    }
    
    // Update status to cancelled
    const updateData = {
      status: 'cancelled',
      updated_at: new Date()
    };
    
    if (reason) {
      updateData.cancellation_reason = reason;
    }
    
    await db('table_reservations')
      .where('id', id)
      .update(updateData);
    
    // Emit socket event for table status update with comprehensive info
    const io = req.app.get('io');
    if (io) {
      const comprehensiveStatus = await getComprehensiveTableStatus(existingReservation.table_id);
      io.emit('table_status_updated', {
        table_id: existingReservation.table_id,
        ...comprehensiveStatus
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
    
  } catch (error) {
    console.error('Cancel reservation error: - reservationController.js:565', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to cancel reservation'
      }
    });
  }
};

/**
 * Get single reservation
 * GET /api/v1/restaurant/reservations/:id
 */
const getReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role || 'customer';
    
    let query = db('table_reservations as tr')
      .select(
        'tr.*',
        'rt.table_number',
        'rt.location',
        'rt.capacity',
        'u.first_name as user_first_name',
        'u.last_name as user_last_name',
        'u.email as user_email',
        'u.phone as user_phone'
      )
      .join('restaurant_tables as rt', 'tr.table_id', 'rt.id')
      .leftJoin('users as u', 'tr.user_id', 'u.id')
      .where('tr.id', id);
    
    // Filter by user role
    if (['customer'].includes(userRole)) {
      query = query.where('tr.user_id', userId);
    }
    
    const reservation = await query.first();
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reservation not found'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: { reservation }
    });
    
  } catch (error) {
    console.error('Get reservation error: - reservationController.js:624', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch reservation'
      }
    });
  }
};

module.exports = {
  getTableAvailability,
  createReservation,
  getReservations,
  getReservation,
  updateReservation,
  cancelReservation
};