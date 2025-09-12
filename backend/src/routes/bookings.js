const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Validation middleware for booking creation
const validateBooking = (req, res, next) => {
  const { 
    room_type_id, 
    check_in_date, 
    check_out_date, 
    adults 
  } = req.body;

  // Basic validation
  if (!room_type_id || !check_in_date || !check_out_date || !adults) {
    return res.status(400).json({
      success: false,
      error: { message: 'Missing required booking information' }
    });
  }

  if (parseInt(adults) < 1 || parseInt(adults) > 10) {
    return res.status(400).json({
      success: false,
      error: { message: 'Adults count must be between 1 and 10' }
    });
  }

  // Validate date formats
  const checkIn = new Date(check_in_date);
  const checkOut = new Date(check_out_date);
  
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid date format' }
    });
  }

  next();
};

// All routes require authentication
router.use(authenticateToken);

// Create a new booking
router.post('/', validateBooking, bookingController.createBooking);

// Get current user's bookings
router.get('/my-bookings', bookingController.getUserBookings);

// Get all bookings (staff only)
router.get('/', requireRole(['manager', 'admin', 'receptionist']), bookingController.getAllBookings);

// Get booking by ID
router.get('/:id', bookingController.getBookingById);

// Update booking status (staff only)
router.patch('/:id/status', 
  requireRole(['manager', 'admin', 'receptionist']), 
  bookingController.updateBookingStatus
);

// Cancel booking
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
