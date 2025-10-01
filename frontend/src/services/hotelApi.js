import { api } from './api';

// Room API
export const roomApi = {
  // Get all rooms
  getRooms: async (filters = {}) => {
    try {
      console.log('🏨 [HOTEL API] Fetching all rooms...');
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const url = `/api/v1/rooms/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🏨 [HOTEL API] Calling URL:', url);
      const response = await api.get(url);
      console.log('🏨 [HOTEL API] Rooms response:', response);
      return response;
    } catch (error) {
      console.error('❌ [HOTEL API] Failed to fetch rooms:', error);
      // Fallback: if the new endpoint doesn't work, return empty array
      return { success: false, rooms: [], message: error.message };
    }
  },

  // Get single room
  getRoom: async (roomId) => {
    const response = await api.get(`/api/v1/rooms/${roomId}`);
    return response.data;
  },

  // Create new room
  createRoom: async (roomData) => {
    const response = await api.post('/api/v1/hotel/rooms', roomData);
    return response.data;
  },

  // Update room
  updateRoom: async (roomId, roomData) => {
    const response = await api.put(`/api/v1/hotel/rooms/${roomId}`, roomData);
    return response.data;
  },

  // Delete room
  deleteRoom: async (roomId) => {
    const response = await api.delete(`/api/v1/hotel/rooms/${roomId}`);
    return response.data;
  },

  // Update room status
  updateRoomStatus: async (roomId, status) => {
    const response = await api.patch(`/api/v1/hotel/rooms/${roomId}/status`, { status });
    return response.data;
  },

  // Get room availability
  checkAvailability: async (checkIn, checkOut, roomTypeId = null) => {
    const queryParams = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut
    });
    
    if (roomTypeId) {
      queryParams.append('room_type_id', roomTypeId);
    }
    
    const response = await api.get(`/api/v1/rooms/availability?${queryParams.toString()}`);
    return response.data;
  },

  // Get room types
  getRoomTypes: async () => {
    try {
      console.log('🏨 [HOTEL API] Fetching room types...');
      const response = await api.get('/api/v1/rooms/types');
      console.log('🏨 [HOTEL API] Room types response:', response);
      return response;
    } catch (error) {
      console.error('❌ [HOTEL API] Failed to fetch room types:', error);
      return [];
    }
  }
};

// Room Type API
export const roomTypeApi = {
  // Get all room types
  getRoomTypes: async () => {
    const response = await api.get('/api/v1/hotel/room-types');
    return response.data;
  },

  // Get single room type
  getRoomType: async (roomTypeId) => {
    const response = await api.get(`/api/v1/hotel/room-types/${roomTypeId}`);
    return response.data;
  },

  // Create new room type
  createRoomType: async (roomTypeData) => {
    const response = await api.post('/api/v1/hotel/room-types', roomTypeData);
    return response.data;
  },

  // Update room type
  updateRoomType: async (roomTypeId, roomTypeData) => {
    const response = await api.put(`/api/v1/hotel/room-types/${roomTypeId}`, roomTypeData);
    return response.data;
  },

  // Delete room type
  deleteRoomType: async (roomTypeId) => {
    const response = await api.delete(`/api/v1/hotel/room-types/${roomTypeId}`);
    return response.data;
  }
};

// Booking API
export const bookingApi = {
  // Get all bookings
  getBookings: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const url = `/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  // Get single booking
  getBooking: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  // Create new booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Update booking
  updateBooking: async (bookingId, bookingData) => {
    const response = await api.put(`/bookings/${bookingId}`, bookingData);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId, reason = '') => {
    const response = await api.patch(`/bookings/${bookingId}/cancel`, { reason });
    return response.data;
  },

  // Check-in booking
  checkIn: async (bookingId, checkInData = {}) => {
    const response = await api.patch(`/bookings/${bookingId}/check-in`, checkInData);
    return response.data;
  },

  // Check-out booking
  checkOut: async (bookingId, checkOutData = {}) => {
    const response = await api.patch(`/bookings/${bookingId}/check-out`, checkOutData);
    return response.data;
  },

  // Get calendar data
  getCalendarData: async (startDate, endDate, roomTypeId = null) => {
    const queryParams = new URLSearchParams();
    
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (roomTypeId) queryParams.append('room_type_id', roomTypeId);
    
    const url = `/bookings/calendar${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  }
};

// Hotel Information API
export const hotelApi = {
  // Get hotel information
  getHotelInfo: async () => {
    const response = await api.get('/api/v1/hotel/info');
    return response.data;
  },

  // Update hotel information
  updateHotelInfo: async (hotelData) => {
    const response = await api.put('/api/v1/hotel/info', hotelData);
    return response.data;
  },

  // Get hotel statistics
  getStatistics: async (period = 'month') => {
    const response = await api.get(`/api/v1/hotel/statistics?period=${period}`);
    return response.data;
  },

  // Get occupancy report
  getOccupancyReport: async (startDate, endDate) => {
    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    
    const response = await api.get(`/api/v1/hotel/reports/occupancy?${queryParams.toString()}`);
    return response.data;
  },

  // Get revenue report
  getRevenueReport: async (startDate, endDate) => {
    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    
    const response = await api.get(`/api/v1/hotel/reports/revenue?${queryParams.toString()}`);
    return response.data;
  }
};

// Export everything
const hotelApiServices = {
  roomApi,
  roomTypeApi,
  bookingApi,
  hotelApi
};

export default hotelApiServices;
