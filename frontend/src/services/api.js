// Real API services for Mayfair Hotel Management System
import axios from 'axios';

// Import restaurant API functions
import { 
  restaurantApi,
  kitchenApi,
  restaurantTableApi,
  restaurantMenuApi,
  restaurantReservationApi,
  restaurantOrderApi 
} from './restaurantApi';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data; // Return just the data part
  },
  (error) => {
    console.error('API Error: - api.js:42', error.response?.data || error.message);
    
    // Handle 401 errors by clearing auth data
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Return a consistent error format
    const errorMessage = error.response?.data?.error?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Authentication API
export const authApi = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    
    // Store token and user data
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    
    // Store token and user data
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed: - api.js:88', error.message);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    return { success: true };
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userStr && token) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing stored user data: - api.js:111', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
      }
    }
    
    return null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};

// Dashboard API
export const dashboardApi = {
  async getMetrics(dateRange = 'today') {
    const response = await api.get(`/dashboard/metrics?range=${dateRange}`);
    return response.data;
  },

  async getRevenueChart(period = '7days') {
    const response = await api.get(`/dashboard/revenue-chart?period=${period}`);
    return response.data;
  }
};

// User API
export const userApi = {
  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async updateProfile(userData) {
    const response = await api.put('/users/profile', userData);
    
    // Update stored user data
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return response.data;
  },

  async getUsers(role = null) {
    const params = role ? { role } : {};
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Admin user management functions
  async createUser(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  async updateUser(userId, userData) {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  async deactivateUser(userId) {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  async activateUser(userId) {
    const response = await api.patch(`/users/${userId}/activate`);
    return response.data;
  }
};

// Room API
export const roomApi = {
  async getRoomTypes() {
    const response = await api.get('/rooms/types');
    console.log('🏨 [API] Room types response:', response);
    // Backend returns array directly, map to include totalRooms for frontend compatibility
    return response.map(roomType => ({
      ...roomType,
      totalRooms: parseInt(roomType.total_rooms) || 0
    }));
  },

  async getRoomTypeById(id) {
    const response = await api.get(`/rooms/types/${id}`);
    console.log('🏨 [API] Room type by ID response:', response);
    // Map the response to include totalRooms property for frontend compatibility
    return {
      ...response,
      totalRooms: parseInt(response.total_rooms) || 0
    };
  },

  async createRoomType(roomTypeData) {
    const response = await api.post('/rooms/types', roomTypeData);
    return response;
  },

  async updateRoomType(id, roomTypeData) {
    const response = await api.put(`/rooms/types/${id}`, roomTypeData);
    return response;
  },

  async deleteRoomType(id) {
    const response = await api.delete(`/rooms/types/${id}`);
    return response;
  },

  async bulkUpdatePrices(percentage, roomTypeIds = null) {
    const response = await api.patch('/rooms/types/bulk-price-update', {
      percentage,
      roomTypeIds
    });
    return response.data;
  },

  async checkAvailability(checkInDate, checkOutDate, adults = 1, children = 0) {
    const params = {
      checkInDate,
      checkOutDate,
      adults: parseInt(adults),
      children: parseInt(children)
    };

    console.log('🏨 [API] Checking room availability with params:', params);
    const response = await api.get('/rooms/availability', { params });
    console.log('🏨 [API] Room availability response:', response);
    // Since api interceptor returns response.data, the response is already the data
    return response.availableRooms || [];
  },

  // Booking management
  async createBooking(bookingData) {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Image management methods
  async uploadRoomImages(formData) {
    try {
      console.log('🖼️ [API] Uploading room images...');
      console.log('🖼️ [API] FormData contents:', Array.from(formData.entries()));

      // Don't set Content-Type header - let axios set it automatically with boundary
      const response = await api.post('/rooms/images', formData);
      console.log('🖼️ [API] Room images uploaded successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ [API] Failed to upload room images:', error);
      console.error('❌ [API] Error details:', error.response?.data);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to upload room images');
    }
  },

  async getRoomImages(roomTypeId = null, roomId = null) {
    try {
      console.log('🖼️ [API] Fetching room images...');
      const params = {};
      if (roomTypeId) params.room_type_id = roomTypeId;
      if (roomId) params.room_id = roomId;

      const response = await api.get('/rooms/images', { params });
      console.log('🖼️ [API] Room images fetched successfully:', response);

      // Return the data structure expected by the frontend
      // Since api interceptor returns response.data, check both structures
      return {
        images: response.images || response.data?.images || [],
        total_count: response.total_count || response.data?.total_count || 0
      };
    } catch (error) {
      console.error('❌ [API] Failed to fetch room images:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch room images');
    }
  },

  async updateRoomImage(imageId, updateData) {
    try {
      console.log('🖼️ [API] Updating room image...');
      const response = await api.put(`/rooms/images/${imageId}`, updateData);
      console.log('🖼️ [API] Room image updated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ [API] Failed to update room image:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to update room image');
    }
  },

  async deleteRoomImage(imageId) {
    try {
      console.log('🖼️ [API] Deleting room image...');
      const response = await api.delete(`/rooms/images/${imageId}`);
      console.log('🖼️ [API] Room image deleted successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ [API] Failed to delete room image:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to delete room image');
    }
  },

  async getBookings(params = {}) {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  async getMyBookings(params = {}) {
    const response = await api.get('/bookings/my-bookings', { params });
    return response.data;
  },

  async getBookingById(id) {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  async updateBookingStatus(id, status, notes = null) {
    const response = await api.patch(`/bookings/${id}/status`, { status, notes });
    return response.data;
  },

  async cancelBooking(id, reason = null) {
    const response = await api.patch(`/bookings/${id}/cancel`, { reason });
    return response.data;
  }
};

// Payment API
export const paymentApi = {
  // Create payment intent
  createPaymentIntent: async (paymentData) => {
    try {
      const response = await api.post('/payments/create-intent', paymentData);
      return response;
    } catch (error) {
      console.error('Create payment intent error: - api.js:272', error);
      throw error;
    }
  },

  // Get payment status
  getPaymentStatus: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/status`);
      return response;
    } catch (error) {
      console.error('Get payment status error: - api.js:283', error);
      throw error;
    }
  },

  // Get payment history
  getPaymentHistory: async (params = {}) => {
    try {
      const response = await api.get('/payments/history', { params });
      return response;
    } catch (error) {
      console.error('Get payment history error: - api.js:294', error);
      throw error;
    }
  },

  // Verify payment
  verifyPayment: async (paymentId) => {
    try {
      const response = await api.post(`/payments/${paymentId}/verify`);
      return response;
    } catch (error) {
      console.error('Verify payment error: - api.js:305', error);
      throw error;
    }
  },

  // Get payment form URL
  getPaymentForm: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/form`);
      return response;
    } catch (error) {
      console.error('Get payment form error: - api.js:316', error);
      throw error;
    }
  }
};



// Restaurant API - now properly implemented
export const restaurantApiService = {
  // Restaurant management
  ...restaurantApi,
  
  // Kitchen management
  ...kitchenApi,
  
  // Table management
  ...restaurantTableApi,
  
  // Menu management  
  ...restaurantMenuApi,
  
  // Reservation management
  ...restaurantReservationApi,
  
  // Order management
  ...restaurantOrderApi
};

// Offers API (placeholder for future implementation)
export const offersApi = {
  async getOffers(applicableTo = null) {
    throw new Error('Offers API not yet implemented in backend');
  },

  async createOffer(offerData) {
    throw new Error('Offers API not yet implemented in backend');
  }
};

// Export the api instance for other services to use
export { api };

// Export all APIs
const apiServices = {
  auth: authApi,
  dashboard: dashboardApi,
  users: userApi,
  rooms: roomApi,
  restaurant: restaurantApiService,
  payments: paymentApi,
  offers: offersApi
};

export default apiServices;
