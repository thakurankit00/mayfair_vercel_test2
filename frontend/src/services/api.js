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
    console.error('API Error:', error.response?.data || error.message);
    
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
      console.warn('Logout API call failed:', error.message);
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
        console.error('Error parsing stored user data:', error);
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
  }
};

// Room API
export const roomApi = {
  async getRoomTypes() {
    const response = await api.get('/rooms/types');
    return response.data.roomTypes;
  },

  async getRoomTypeById(id) {
    const response = await api.get(`/rooms/types/${id}`);
    return response.data.roomType;
  },

  async createRoomType(roomTypeData) {
    const response = await api.post('/rooms/types', roomTypeData);
    return response.data.roomType;
  },

  async updateRoomType(id, roomTypeData) {
    const response = await api.put(`/rooms/types/${id}`, roomTypeData);
    return response.data.roomType;
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
    
    const response = await api.get('/rooms/availability', { params });
    return response.data.availableRooms;
  },

  // Booking management
  async createBooking(bookingData) {
    const response = await api.post('/bookings', bookingData);
    return response.data;
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

// Export all APIs
const apiServices = {
  auth: authApi,
  dashboard: dashboardApi,
  users: userApi,
  rooms: roomApi,
  restaurant: restaurantApiService,
  offers: offersApi
};

export default apiServices;
