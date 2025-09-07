const RoomTypeDAO = require('../dao/RoomTypeDAO');

/**
 * Check room availability based on date range and guest requirements
 * GET /api/v1/rooms/availability
 */
const checkAvailability = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, adults = 1, children = 0 } = req.query;

    // Validate required parameters
    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Check-in and check-out dates are required'
        }
      });
    }

    // Validate date format and logic
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format. Use YYYY-MM-DD format'
        }
      });
    }

    if (checkIn < today) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAST_DATE',
          message: 'Check-in date cannot be in the past'
        }
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'Check-out date must be after check-in date'
        }
      });
    }

    // Validate guest counts
    const adultCount = parseInt(adults);
    const childCount = parseInt(children);

    if (adultCount < 1 || adultCount > 10) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_GUEST_COUNT',
          message: 'Adults must be between 1 and 10'
        }
      });
    }

    if (childCount < 0 || childCount > 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_GUEST_COUNT',
          message: 'Children must be between 0 and 8'
        }
      });
    }

    const totalGuests = adultCount + childCount;

    // Use DAO to check availability
    const availableRooms = await RoomTypeDAO.checkAvailability(
      checkInDate,
      checkOutDate,
      totalGuests
    );

    return res.status(200).json({
      success: true,
      data: {
        availableRooms: availableRooms,
        searchCriteria: {
          checkInDate,
          checkOutDate,
          adults: adultCount,
          children: childCount,
          totalGuests,
          nights: Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
        },
        totalResults: availableRooms.length
      }
    });

  } catch (error) {
    console.error('Room availability check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to check room availability'
      }
    });
  }
};

/**
 * Get all room types with basic information
 * GET /api/v1/rooms/types
 */
const getRoomTypes = async (req, res) => {
  try {
    const roomTypes = await RoomTypeDAO.getAllActive();

    return res.status(200).json({
      success: true,
      data: {
        roomTypes: roomTypes
      }
    });

  } catch (error) {
    console.error('Get room types error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch room types'
      }
    });
  }
};

/**
 * Get room details by ID
 * GET /api/v1/rooms/types/:id
 */
const getRoomTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const roomType = await RoomTypeDAO.getById(id);

    return res.status(200).json({
      success: true,
      data: {
        roomType: roomType
      }
    });

  } catch (error) {
    console.error('Get room type by ID error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_TYPE_NOT_FOUND',
          message: error.message
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch room type details'
      }
    });
  }
};

/**
 * Create new room type (Admin/Manager only)
 * POST /api/v1/rooms/types
 */
const createRoomType = async (req, res) => {
  try {
    const roomTypeData = req.body;
    const newRoomType = await RoomTypeDAO.create(roomTypeData);

    return res.status(201).json({
      success: true,
      data: {
        roomType: newRoomType
      },
      message: 'Room type created successfully'
    });

  } catch (error) {
    console.error('Create room type error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ROOM_TYPE',
          message: error.message
        }
      });
    }

    if (error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create room type'
      }
    });
  }
};

/**
 * Update room type (Admin/Manager only)
 * PUT /api/v1/rooms/types/:id
 */
const updateRoomType = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedRoomType = await RoomTypeDAO.update(id, updateData);

    return res.status(200).json({
      success: true,
      data: {
        roomType: updatedRoomType
      },
      message: 'Room type updated successfully'
    });

  } catch (error) {
    console.error('Update room type error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_TYPE_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ROOM_TYPE',
          message: error.message
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update room type'
      }
    });
  }
};

/**
 * Delete room type (Admin/Manager only)
 * DELETE /api/v1/rooms/types/:id
 */
const deleteRoomType = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await RoomTypeDAO.delete(id);

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Delete room type error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_TYPE_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE',
          message: error.message
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete room type'
      }
    });
  }
};

/**
 * Bulk update room type prices (Admin/Manager only)
 * PATCH /api/v1/rooms/types/bulk-price-update
 */
const bulkUpdatePrices = async (req, res) => {
  try {
    const { percentage, roomTypeIds } = req.body;
    
    if (!percentage || isNaN(percentage)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Percentage is required and must be a number'
        }
      });
    }
    
    const result = await RoomTypeDAO.bulkUpdatePrices({ percentage, roomTypeIds });

    return res.status(200).json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Bulk update prices error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update prices'
      }
    });
  }
};

module.exports = {
  checkAvailability,
  getRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  bulkUpdatePrices
};
