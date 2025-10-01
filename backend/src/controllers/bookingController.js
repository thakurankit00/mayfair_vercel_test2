const RoomBooking = require('../models/RoomBooking');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const User = require('../models/User');
const { transaction } = require('objection');
const { v4: uuidv4 } = require('uuid');

// Create a new room booking
const createBooking = async (req, res, next) => {
  const trx = await transaction.start(RoomBooking.knex());

  try {
    const {
      room_type_id,
      check_in_date,
      check_out_date,
      adults: adultsRaw,
      children: childrenRaw = 0,
      special_requests,
      guest_info
    } = req.body;

    const user_id = req.user.id;

    // Convert adults and children to numbers to prevent string concatenation issues
    const adults = parseInt(adultsRaw, 10);
    const children = parseInt(childrenRaw, 10);

    // Validate numeric conversion
    if (isNaN(adults) || adults < 1) {
      return res.status(400).json({
        success: false,
        error: { message: 'Adults count must be a valid number greater than 0' }
      });
    }

    if (isNaN(children) || children < 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Children count must be a valid number greater than or equal to 0' }
      });
    }

    // Validate dates
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return res.status(400).json({
        success: false,
        error: { message: 'Check-in date cannot be in the past' }
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        error: { message: 'Check-out date must be after check-in date' }
      });
    }

    // Get room type details
    const roomType = await RoomType.query(trx).findById(room_type_id);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        error: { message: 'Room type not found' }
      });
    }

    if (!roomType.is_active) {
      return res.status(400).json({
        success: false,
        error: { message: 'Room type is not available for booking' }
      });
    }

    // Check capacity
    if (adults + children > roomType.max_occupancy) {
      return res.status(400).json({
        success: false,
        error: { message: `Room capacity exceeded. Maximum occupancy: ${roomType.max_occupancy}` }
      });
    }

    // Find available room of this type using raw SQL for better performance
    const availableRooms = await trx.raw(`
      SELECT r.id, r.room_number, r.floor, r.status
      FROM rooms r
      WHERE r.room_type_id = ?
        AND r.status = 'available'
        AND NOT EXISTS (
          SELECT 1 FROM room_bookings rb
          WHERE rb.room_id = r.id
            AND rb.status NOT IN ('cancelled', 'checked_out')
            AND (
              (rb.check_in_date <= ? AND rb.check_out_date > ?)
              OR (rb.check_in_date < ? AND rb.check_out_date >= ?)
              OR (rb.check_in_date >= ? AND rb.check_out_date <= ?)
            )
        )
      ORDER BY r.room_number
      LIMIT 1
    `, [room_type_id, check_in_date, check_in_date, check_out_date, check_out_date, check_in_date, check_out_date]);

    if (availableRooms.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No rooms available for the selected dates' }
      });
    }

    const selectedRoom = availableRooms.rows[0];

    // Calculate total amount
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const total_amount = nights * roomType.base_price;

    // Generate booking reference
    const bookingReference = `BK${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    // Create booking
    const bookingData = {
      id: uuidv4(),
      booking_reference: bookingReference,
      room_id: selectedRoom.id,
      user_id: user_id,
      check_in_date,
      check_out_date,
      adults,
      children,
      total_amount,
      status: 'pending',
      platform: null, // NULL for direct bookings
      special_requests: special_requests || null,
      guest_info: guest_info ? JSON.stringify(guest_info) : null
    };

    const booking = await RoomBooking.query(trx).insert(bookingData);

    // Update room status to occupied when booking is confirmed
    await trx('rooms')
      .update({
        status: 'occupied',
        updated_at: new Date().toISOString()
      })
      .where('id', selectedRoom.id);

    await trx.commit();

    // Fetch complete booking details for response
    const completeBooking = await RoomBooking.query()
      .findById(booking.id)
      .withGraphFetched('[room.[roomType], customer]');

    res.status(201).json({
      success: true,
      data: {
        booking: completeBooking
      },
      message: 'Booking created successfully'
    });

  } catch (error) {
    await trx.rollback();
    console.error('❌ [BOOKING] Booking creation error: - bookingController.js:183', error);
    console.error('❌ [BOOKING] Error details: - bookingController.js:184', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    // Return a more specific error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOOKING_CREATION_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create booking'
      }
    });
  }
};

// Get user's bookings
const getUserBookings = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let query = RoomBooking.query()
      .where('user_id', user_id)
      .withGraphFetched('[room.[roomType], customer]')
      .orderBy('created_at', 'desc');

    if (status) {
      query = query.where('status', status);
    }

    const bookings = await query
      .page(parseInt(page) - 1, parseInt(limit));

    res.json({
      success: true,
      data: {
        bookings: bookings.results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: bookings.total,
          pages: Math.ceil(bookings.total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get all bookings (staff only)
const getAllBookings = async (req, res, next) => {
  try {
    const { status, date, room_type_id, page = 1, limit = 10 } = req.query;

    let query = RoomBooking.query()
      .withGraphFetched('[room.[roomType], customer]')
      .orderBy('check_in_date', 'desc');

    if (status) {
      query = query.where('status', status);
    }

    if (date) {
      query = query.where('check_in_date', '<=', date)
        .where('check_out_date', '>', date);
    }

    if (room_type_id) {
      query = query.joinRelated('room')
        .where('room.room_type_id', room_type_id);
    }

    const bookings = await query
      .page(parseInt(page) - 1, parseInt(limit));

    res.json({
      success: true,
      data: {
        bookings: bookings.results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: bookings.total,
          pages: Math.ceil(bookings.total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get booking by ID
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role;

    let query = RoomBooking.query()
      .findById(id)
      .withGraphFetched('[room.[roomType], customer]');

    // Customers can only see their own bookings
    if (user_role === 'customer') {
      query = query.where('user_id', user_id);
    }

    const booking = await query;

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: 'Booking not found' }
      });
    }

    res.json({
      success: true,
      data: { booking }
    });

  } catch (error) {
    next(error);
  }
};

// Update booking (general update)
const updateBooking = async (req, res, next) => {
  const trx = await transaction.start(RoomBooking.knex());

  try {
    const { id } = req.params;
    const updateData = req.body;
    const user_id = req.user.id;
    const user_role = req.user.role;

    const booking = await RoomBooking.query(trx).findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: 'Booking not found' }
      });
    }

    // Customers can only update their own bookings
    if (user_role === 'customer' && booking.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only update your own bookings' }
      });
    }

    // Prepare update data
    const allowedFields = [
      'room_id', 'check_in_date', 'check_out_date', 'adults', 'children',
      'status', 'special_requests', 'guest_info'
    ];

    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'guest_info' && typeof updateData[field] === 'object') {
          filteredData[field] = JSON.stringify(updateData[field]);
        } else {
          filteredData[field] = updateData[field];
        }
      }
    });

    // Add updated_at timestamp
    filteredData.updated_at = new Date().toISOString();

    // Update booking
    await RoomBooking.query(trx)
      .patch(filteredData)
      .where('id', id);

    // If room_id changed, update room statuses
    if (filteredData.room_id && filteredData.room_id !== booking.room_id) {
      // Free up the old room
      await trx('rooms')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .where('id', booking.room_id);

      // Occupy the new room
      await trx('rooms')
        .update({ status: 'occupied', updated_at: new Date().toISOString() })
        .where('id', filteredData.room_id);
    }

    await trx.commit();

    // Fetch updated booking
    const updatedBooking = await RoomBooking.query()
      .findById(id)
      .withGraphFetched('[room.[roomType], customer]');

    res.json({
      success: true,
      data: { booking: updatedBooking },
      message: 'Booking updated successfully'
    });

  } catch (error) {
    await trx.rollback();
    console.error('❌ [BOOKING] Booking update error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOOKING_UPDATE_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update booking'
      }
    });
  }
};

// Update booking status (staff only)
const updateBookingStatus = async (req, res, next) => {
  const trx = await transaction.start(RoomBooking.knex());

  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await RoomBooking.query(trx).findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: 'Booking not found' }
      });
    }

    const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid status' }
      });
    }

    // Update booking (only update status and updated_at, notes are not stored in this table)
    await RoomBooking.query(trx)
      .patch({
        status,
        updated_at: new Date().toISOString()
      })
      .where('id', id);

    // Update room status based on booking status
    let roomStatus = 'available';
    if (status === 'confirmed' || status === 'pending') {
      roomStatus = 'occupied'; // Use occupied instead of reserved (not in enum)
    } else if (status === 'checked_in') {
      roomStatus = 'occupied';
    } else if (status === 'checked_out' || status === 'cancelled') {
      roomStatus = 'available';
    }

    await trx('rooms')
      .update({ status: roomStatus, updated_at: new Date().toISOString() })
      .where('id', booking.room_id);

    await trx.commit();

    // Fetch updated booking
    const updatedBooking = await RoomBooking.query()
      .findById(id)
      .withGraphFetched('[room.[roomType], customer]');

    res.json({
      success: true,
      data: { booking: updatedBooking },
      message: `Booking ${status} successfully`
    });

  } catch (error) {
    await trx.rollback();
    console.error('❌ [BOOKING] Booking status update error: - bookingController.js:378', error);
    console.error('❌ [BOOKING] Error details: - bookingController.js:379', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    return res.status(500).json({
      success: false,
      error: {
        code: 'BOOKING_UPDATE_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update booking status'
      }
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res, next) => {
  const trx = await transaction.start(RoomBooking.knex());
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user_id = req.user.id;
    const user_role = req.user.role;

    let query = RoomBooking.query(trx).findById(id);

    // Customers can only cancel their own bookings
    if (user_role === 'customer') {
      query = query.where('user_id', user_id);
    }

    const booking = await query;

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: 'Booking not found' }
      });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Booking cannot be cancelled' }
      });
    }

    // Check cancellation policy (24 hours before check-in)
    const checkInDate = new Date(booking.check_in_date);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

    if (user_role === 'customer' && hoursUntilCheckIn < 24) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cancellations must be made at least 24 hours before check-in' }
      });
    }

    // Cancel booking
    await RoomBooking.query(trx)
      .patch({ 
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date(),
        updated_at: new Date()
      })
      .where('id', id);

    // Make room available again
    await trx('rooms')
      .update({ status: 'available', updated_at: new Date() })
      .where('id', booking.room_id);

    await trx.commit();

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    await trx.rollback();
    next(error);
  }
};

// Get bookings for calendar view
const getBookingCalendar = async (req, res, next) => {
  try {
    const { start_date, end_date, room_type_id } = req.query;
    
    // Default to current month if no dates provided
    const startDate = start_date ? new Date(start_date) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = end_date ? new Date(end_date) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid date format' }
      });
    }
    
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'End date must be after start date' }
      });
    }

    // Build query for bookings in date range
    let bookingsQuery = RoomBooking.query()
      .withGraphFetched('[room.[roomType], customer]')
      .leftJoin('rooms', 'room_bookings.room_id', 'rooms.id')
      .where(builder => {
        builder
          .where('room_bookings.check_in_date', '<=', endDate.toISOString().split('T')[0])
          .where('room_bookings.check_out_date', '>', startDate.toISOString().split('T')[0]);
      })
      .whereNot('room_bookings.status', 'cancelled')
      .orderBy(['rooms.room_number', 'room_bookings.check_in_date'])
      .select('room_bookings.*');

    // Filter by room type if specified
    if (room_type_id) {
      bookingsQuery = bookingsQuery.where('rooms.room_type_id', room_type_id);
    }

    const bookings = await bookingsQuery;

    // Get all rooms for the calendar grid
    let roomsQuery = Room.query()
      .withGraphFetched('roomType')
      .where('status', '!=', 'maintenance')
      .orderBy(['room_number']);

    if (room_type_id) {
      roomsQuery = roomsQuery.where('room_type_id', room_type_id);
    }

    const rooms = await roomsQuery;

    // Get room types for filtering
    const roomTypes = await RoomType.query()
      .where('is_active', true)
      .orderBy('name');

    // Transform bookings for calendar display
    const calendarBookings = bookings.map(booking => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      
      return {
        id: booking.id,
        room_id: booking.room_id,
        room_number: booking.room.room_number,
        room_type: booking.room.roomType.name,
        customer_name: `${booking.customer.first_name} ${booking.customer.last_name}`,
        customer_phone: booking.customer.phone,
        total_guests: booking.adults + booking.children,
        adults: booking.adults,
        children: booking.children,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        nights: Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)),
        status: booking.status,
        total_amount: booking.total_amount,
        platform: booking.platform,
        special_requests: booking.special_requests,
        created_at: booking.created_at
      };
    });

    // Transform rooms for calendar grid
    const calendarRooms = rooms.map(room => ({
      id: room.id,
      room_number: room.room_number,
      room_type: room.roomType.name,
      room_type_id: room.room_type_id,
      floor: room.floor,
      status: room.status,
      max_occupancy: room.roomType.max_occupancy,
      base_price: room.roomType.base_price
    }));

    res.json({
      success: true,
      data: {
        bookings: calendarBookings,
        rooms: calendarRooms,
        room_types: roomTypes,
        date_range: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        },
        summary: {
          total_bookings: calendarBookings.length,
          total_rooms: calendarRooms.length,
          occupancy_rate: Math.round((calendarBookings.length / (calendarRooms.length * Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))) * 100) || 0
        }
      }
    });

  } catch (error) {
    console.error('Calendar booking fetch error: - bookingController.js:586', error);
    next(error);
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getAllBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingCalendar
};
