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
// RESTAURANT MANAGEMENT API
// ============================================================================

export const restaurantApi = {
  // Get all restaurants
  getRestaurants: async (type = null) => {
    const params = type ? { type } : {};
    const response = await api.get('/restaurant/restaurants', { params });
    return response.data.data;
  },

  // Get restaurant by ID
  getRestaurantById: async (id) => {
    const response = await api.get(`/restaurant/restaurants/${id}`);
    return response.data.data;
  },

  // Create new restaurant
  createRestaurant: async (restaurantData) => {
    const response = await api.post('/restaurant/restaurants', restaurantData);
    return response.data.data;
  },

  // Update restaurant
  updateRestaurant: async (restaurantId, restaurantData) => {
    const response = await api.put(`/restaurant/restaurants/${restaurantId}`, restaurantData);
    return response.data.data;
  },

  // Delete restaurant
  deleteRestaurant: async (restaurantId) => {
    const response = await api.delete(`/restaurant/restaurants/${restaurantId}`);
    return response.data;
  }
};

// ============================================================================
// KITCHEN MANAGEMENT API
// ============================================================================

export const kitchenApi = {
  // Get all kitchens
  getKitchens: async () => {
    const response = await api.get('/restaurant/kitchens');
    return response.data.data;
  },

  // Get kitchen dashboard
  getKitchenDashboard: async (kitchenId) => {
    const response = await api.get(`/restaurant/kitchens/${kitchenId}/dashboard`);
    return response.data.data;
  },

  // Get kitchen orders
  getKitchenOrders: async (kitchenId, status = null) => {
    const params = status ? { status } : {};
    const response = await api.get(`/restaurant/kitchen/${kitchenId}/orders`, { params });
    return response.data.data;
  },

  // Accept kitchen order
  acceptKitchenOrder: async (kitchenId, orderId, estimatedTime = null, notes = null) => {
    const data = {};
    if (estimatedTime) data.estimated_time = estimatedTime;
    if (notes) data.notes = notes;
    const response = await api.post(`/restaurant/kitchen/${kitchenId}/orders/${orderId}/accept`, data);
    return response.data.data;
  },

  // Reject kitchen order
  rejectKitchenOrder: async (kitchenId, orderId, reason) => {
    const response = await api.post(`/restaurant/kitchen/${kitchenId}/orders/${orderId}/reject`, { reason });
    return response.data.data;
  },

  // Transfer order to different kitchen
  transferOrderToKitchen: async (orderId, targetKitchenId, reason) => {
    const response = await api.post(`/restaurant/orders/${orderId}/transfer`, {
      target_kitchen_id: targetKitchenId,
      reason
    });
    return response.data.data;
  },

  // Get kitchen staff
  getKitchenStaff: async (kitchenId) => {
    const response = await api.get(`/restaurant/kitchens/${kitchenId}/staff`);
    return response.data.data;
  },

  // Get order kitchen logs
  getOrderKitchenLogs: async (orderId) => {
    const response = await api.get(`/restaurant/orders/${orderId}/kitchen-logs`);
    return response.data.data;
  },

  // Create new kitchen
  createKitchen: async (kitchenData) => {
    const response = await api.post('/restaurant/kitchens', kitchenData);
    return response.data.data;
  },

  // Update kitchen
  updateKitchen: async (kitchenId, kitchenData) => {
    const response = await api.put(`/restaurant/kitchens/${kitchenId}`, kitchenData);
    return response.data.data;
  },

  // Delete kitchen
  deleteKitchen: async (kitchenId) => {
    const response = await api.delete(`/restaurant/kitchens/${kitchenId}`);
    return response.data;
  }
};

// ============================================================================
// TABLE MANAGEMENT API
// ============================================================================

export const restaurantTableApi = {
  // Get all tables
  getTables: async (restaurantId = null, location = null) => {
    const params = {};
    if (location) params.location = location;
    
    const endpoint = restaurantId && restaurantId !== 'all' 
      ? `/restaurant/restaurants/${restaurantId}/tables`
      : '/restaurant/tables';
      
    const response = await api.get(endpoint, { params });
    return response.data.data;
  },

  // Create new table
  createTable: async (restaurantId, tableData) => {
    const response = await api.post(`/restaurant/restaurants/${restaurantId}/tables`, tableData);
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

export const uploadApi = {
  uploadImage: async (base64Image) => {
    try {
      // Ensure we're working with a base64 string
      if (typeof base64Image !== 'string' || !base64Image.startsWith('data:image/')) {
        throw new Error("Expected a base64 image string");
      }

      const formData = new FormData();
      formData.append("file", base64Image);
      formData.append("upload_preset", "Mayfair images"); // Make sure this preset exists and is unsigned
      
      console.log("Uploading base64 to Cloudinary");
      
      const response = await fetch("https://api.cloudinary.com/v1_1/dbgojkhlx/image/upload", {
        method: "POST",
        body: formData,
      });
      
      console.log("Cloudinary response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudinary error response:", errorText);
        throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Cloudinary success response:", result);
      
      // Return custom format that matches your expectation
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  },
};


export const restaurantMenuApi = {
  // Get menu categories
  getCategories: async (restaurantId = null, type = null) => {
    const params = {};
    if (type) params.type = type;
    
    const endpoint = restaurantId && restaurantId !== 'all'
      ? `/restaurant/restaurants/${restaurantId}/menu/categories`
      : '/restaurant/menu/categories';
      
    const response = await api.get(endpoint, { params });
    return response.data.data.categories;
  },

  // Create menu category
  createCategory: async (categoryData) => {
    const response = await api.post('/restaurant/menu/categories', categoryData);
    return response.data.data;
  },

  // Get full menu
  getMenu: async (restaurantId = null, type = null) => {
    const params = {};
    if (type) params.type = type;
    
    const endpoint = restaurantId && restaurantId !== 'all'
      ? `/restaurant/restaurants/${restaurantId}/menu`
      : '/restaurant/menu';
      
    const response = await api.get(endpoint, { params });
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

  // Get single reservation
  getReservation: async (id) => {
    const response = await api.get(`/restaurant/reservations/${id}`);
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
  updateOrderItemStatus: async (orderId, itemId, statusData) => {
    const response = await api.put(`/restaurant/orders/${orderId}/items/${itemId}/status`, statusData);
    return response.data.data;
  },

  // Get kitchen dashboard data
  getKitchenDashboard: async (restaurantId = null) => {
    const params = {};
    if (restaurantId) params.restaurant_id = restaurantId;
    const response = await api.get('/restaurant/kitchen/dashboard', { params });
    return response.data.data;
  },

  // Add items to order
  addOrderItems: async (id, items) => {
    const response = await api.put(`/restaurant/orders/${id}/items`, { items });
    return response.data.data;
  },

  // Generate bill for order
  generateBill: async (orderId) => {
    const response = await api.post(`/restaurant/orders/${orderId}/bill`);
    return response.data.data;
  }
};

// Export order API with alias for easier imports
export const orderApi = restaurantOrderApi;
