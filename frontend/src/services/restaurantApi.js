// Create axios instance for restaurant API
import axios from 'axios';

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
    return response; // Return the full response for restaurant API
  },
  (error) => {
    console.error('Restaurant API Error: - restaurantApi.js:31', error.response?.data || error.message);
    
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

// ============================================================================
// TABLE MANAGEMENT API
// ============================================================================

export const restaurantTableApi = {
  // Get all tables
  getTables: async (location = null) => {
    const params = location ? { location } : {};
    const response = await api.get('/restaurant/tables', { params });
    return response.data.data;
  },

  // Create new table
  createTable: async (tableData) => {
    const response = await api.post('/restaurant/tables', tableData);
    return response.data.data;
  },

  // Update table
  updateTable: async (id, tableData) => {
    const response = await api.put(`/restaurant/tables/${id}`, tableData);
    return response.data.data;
  },

  // Delete table
  deleteTable: async (id) => {
    const response = await api.delete(`/restaurant/tables/${id}`);
    return response.data;
  }
};

// ============================================================================
// MENU MANAGEMENT API
// ============================================================================

export const restaurantMenuApi = {
  // Get menu categories
  getCategories: async (type = null) => {
    const params = type ? { type } : {};
    const response = await api.get('/restaurant/menu/categories', { params });
    return response.data.data.categories;
  },

  // Create menu category
  createCategory: async (categoryData) => {
    const response = await api.post('/restaurant/menu/categories', categoryData);
    return response.data.data;
  },

  // Get full menu
  getMenu: async (type = null) => {
    const params = type ? { type } : {};
    const response = await api.get('/restaurant/menu', { params });
    return response.data.data;
  },

  // Create menu item
  createItem: async (itemData) => {
    const response = await api.post('/restaurant/menu/items', itemData);
    return response.data.data;
  },

  // Update menu item
  updateItem: async (id, itemData) => {
    const response = await api.put(`/restaurant/menu/items/${id}`, itemData);
    return response.data.data;
  },

  // Delete menu item
  deleteItem: async (id) => {
    const response = await api.delete(`/restaurant/menu/items/${id}`);
    return response.data;
  },
  updateCategory: async (id, categoryData) => {
  const response = await api.put(`/restaurant/menu/categories/${id}`, categoryData);
  return response.data.data;
},

  // Delete menu category
  deleteCategory: async (id) => {
    const response = await api.delete(`/restaurant/menu/categories/${id}`);
    return response.data;
  }
};

// ============================================================================
// TABLE RESERVATION API
// ============================================================================

export const restaurantReservationApi = {
  // Check table availability
  checkAvailability: async (date, time, party_size, location = null) => {
    const params = { date, time, party_size };
    if (location) params.location = location;
    const response = await api.get('/restaurant/availability', { params });
    return response.data.data;
  },

  // Create reservation
  createReservation: async (reservationData) => {
    const response = await api.post('/restaurant/reservations', reservationData);
    return response.data.data;
  },

  // Get reservations
  getReservations: async (filters = {}) => {
    const response = await api.get('/restaurant/reservations', { params: filters });
    return response.data.data;
  },

  // Update reservation
  updateReservation: async (id, updateData) => {
    const response = await api.put(`/restaurant/reservations/${id}`, updateData);
    return response.data.data;
  },

  // Cancel reservation
  cancelReservation: async (id) => {
    const response = await api.delete(`/restaurant/reservations/${id}`);
    return response.data;
  }
};

// ============================================================================
// ORDER MANAGEMENT API
// ============================================================================

export const restaurantOrderApi = {
  // Create order
  createOrder: async (orderData) => {
    const response = await api.post('/restaurant/orders', orderData);
    return response.data.data;
  },

  // Get orders
  getOrders: async (filters = {}) => {
    const response = await api.get('/restaurant/orders', { params: filters });
    return response.data.data;
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await api.get(`/restaurant/orders/${id}`);
    return response.data.data;
  },

  // Update order status
  updateOrderStatus: async (id, status, estimated_time = null) => {
    const data = { status };
    if (estimated_time) data.estimated_time = estimated_time;
    const response = await api.put(`/restaurant/orders/${id}/status`, data);
    return response.data.data;
  },

  // Update order item status
  updateOrderItemStatus: async (orderId, itemId, status) => {
    const response = await api.put(`/restaurant/orders/${orderId}/items/${itemId}/status`, { status });
    return response.data.data;
  },

  // Add items to order
  addOrderItems: async (id, items) => {
    const response = await api.put(`/restaurant/orders/${id}/items`, { items });
    return response.data.data;
  }
};
