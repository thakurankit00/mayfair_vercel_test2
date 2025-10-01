// Mock API services for testing purposes
import {
  mockUsers,
  mockRoomTypes,
  mockRooms,
  mockBookings,
  mockTables,
  mockMenuCategories,
  mockMenuItems,
  mockReservations,
  mockOrders,
  mockOffers,
  mockDashboardMetrics,
  USER_ROLES
} from '../data/mockData';

// Helper function to simulate API delay
const delay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Mock authentication state
let currentUser = null;

// Authentication API
export const authApi = {
  async login(email, password) {
    await delay(800);
    
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // For mock purposes, accept any password
    currentUser = user;
    
    // Mock JWT token
    const token = `mock_token_${user.id}`;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token };
  },

  async register(userData) {
    await delay(1000);
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    const newUser = {
      id: String(Date.now()),
      ...userData,
      role: USER_ROLES.CUSTOMER,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    currentUser = newUser;
    
    const token = `mock_token_${newUser.id}`;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    return { user: newUser, token };
  },

  async logout() {
    await delay(300);
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  },

  getCurrentUser() {
    if (currentUser) return currentUser;
    
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userStr && token) {
      currentUser = JSON.parse(userStr);
      return currentUser;
    }
    
    return null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};

// Room API
export const roomApi = {
  async getRoomTypes() {
    await delay(600);
    return mockRoomTypes.filter(rt => rt.isActive);
  },

  async getRooms() {
    await delay(600);
    return mockRooms.map(room => {
      const roomType = mockRoomTypes.find(rt => rt.id === room.roomTypeId);
      return { ...room, roomType };
    });
  },

  async checkAvailability(checkIn, checkOut, adults, children) {
    await delay(800);
    
    // Mock availability logic
    const availableRooms = mockRooms
      .filter(room => room.status === 'available')
      .map(room => {
        const roomType = mockRoomTypes.find(rt => rt.id === room.roomTypeId);
        return { ...room, roomType };
      })
      .filter(room => room.roomType.maxOccupancy >= adults + children);
    
    return availableRooms;
  },

  async createBooking(bookingData) {
    await delay(1200);
    
    const newBooking = {
      id: String(Date.now()),
      bookingReference: `MH${Date.now().toString().slice(-5)}`,
      userId: currentUser?.id,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      ...bookingData
    };
    
    mockBookings.push(newBooking);
    return newBooking;
  },

  async getBookings(userId = null) {
    await delay(600);
    
    if (userId) {
      return mockBookings.filter(b => b.userId === userId);
    }
    
    // Return all bookings with user details for staff
    return mockBookings.map(booking => {
      const user = mockUsers.find(u => u.id === booking.userId);
      const room = mockRooms.find(r => r.id === booking.roomId);
      const roomType = mockRoomTypes.find(rt => rt.id === room?.roomTypeId);
      
      return {
        ...booking,
        user,
        room: { ...room, roomType }
      };
    });
  }
};

// Restaurant API
export const restaurantApi = {
  async getTables() {
    await delay(500);
    return mockTables.filter(t => t.isActive);
  },

  async getMenuCategories(type = null) {
    await delay(400);
    if (type) {
      return mockMenuCategories.filter(c => c.type === type);
    }
    return mockMenuCategories;
  },

  async getMenuItems(categoryId = null) {
    await delay(500);
    let items = mockMenuItems.filter(item => item.isAvailable);
    
    if (categoryId) {
      items = items.filter(item => item.categoryId === categoryId);
    }
    
    return items.map(item => {
      const category = mockMenuCategories.find(c => c.id === item.categoryId);
      return { ...item, category };
    });
  },

  async createReservation(reservationData) {
    await delay(800);
    
    const newReservation = {
      id: String(Date.now()),
      reservationReference: `RT${Date.now().toString().slice(-5)}`,
      userId: currentUser?.id,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      ...reservationData
    };
    
    mockReservations.push(newReservation);
    return newReservation;
  },

  async getReservations(userId = null) {
    await delay(600);
    
    if (userId) {
      return mockReservations.filter(r => r.userId === userId);
    }
    
    return mockReservations.map(reservation => {
      const user = mockUsers.find(u => u.id === reservation.userId);
      const table = mockTables.find(t => t.id === reservation.tableId);
      
      return {
        ...reservation,
        user,
        table
      };
    });
  },

  async createOrder(orderData) {
    await delay(1000);
    
    const newOrder = {
      id: String(Date.now()),
      orderNumber: `ORD${Date.now().toString().slice(-5)}`,
      userId: currentUser?.id,
      status: 'pending',
      placedAt: new Date().toISOString(),
      ...orderData
    };
    
    mockOrders.push(newOrder);
    return newOrder;
  },

  async getOrders(filters = {}) {
    await delay(600);
    
    let orders = [...mockOrders];
    
    if (filters.userId) {
      orders = orders.filter(o => o.userId === filters.userId);
    }
    
    if (filters.orderType) {
      orders = orders.filter(o => o.orderType === filters.orderType);
    }
    
    if (filters.status) {
      orders = orders.filter(o => o.status === filters.status);
    }
    
    return orders.map(order => {
      const user = mockUsers.find(u => u.id === order.userId);
      const table = mockTables.find(t => t.id === order.tableId);
      const itemsWithDetails = order.items.map(item => {
        const menuItem = mockMenuItems.find(mi => mi.id === item.menuItemId);
        return { ...item, menuItem };
      });
      
      return {
        ...order,
        user,
        table,
        items: itemsWithDetails
      };
    });
  },

  async updateOrderStatus(orderId, status) {
    await delay(500);
    
    const order = mockOrders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (status === 'ready') {
        order.readyAt = new Date().toISOString();
      } else if (status === 'served') {
        order.servedAt = new Date().toISOString();
      }
    }
    
    return order;
  }
};

// Dashboard API
export const dashboardApi = {
  async getMetrics(dateRange = 'today') {
    await delay(800);
    
    // Simulate different metrics based on date range
    const metrics = { ...mockDashboardMetrics };
    
    if (dateRange === 'week') {
      metrics.revenue.total = metrics.revenue.thisWeek;
      metrics.bookings.total = metrics.bookings.thisWeek;
    } else if (dateRange === 'month') {
      metrics.revenue.total = metrics.revenue.thisMonth;
      metrics.bookings.total = metrics.bookings.thisMonth;
    } else {
      metrics.revenue.total = metrics.revenue.today;
      metrics.bookings.total = metrics.bookings.today;
    }
    
    return metrics;
  },

  async getRevenueChart(period = '7days') {
    await delay(600);
    
    // Mock chart data
    const chartData = [];
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 365;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      chartData.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 50000) + 10000,
        bookings: Math.floor(Math.random() * 15) + 2,
        orders: Math.floor(Math.random() * 40) + 10
      });
    }
    
    return chartData;
  }
};

// User API
export const userApi = {
  async getProfile() {
    await delay(400);
    return currentUser;
  },

  async updateProfile(userData) {
    await delay(600);
    
    if (currentUser) {
      Object.assign(currentUser, userData);
      localStorage.setItem('user', JSON.stringify(currentUser));
    }
    
    return currentUser;
  },

  async getUsers(role = null) {
    await delay(600);
    
    if (role) {
      return mockUsers.filter(u => u.role === role && u.isActive);
    }
    
    return mockUsers.filter(u => u.isActive);
  }
};

// Offers API
export const offersApi = {
  async getOffers(applicableTo = null) {
    await delay(500);
    
    let offers = mockOffers.filter(o => o.isActive);
    
    if (applicableTo) {
      offers = offers.filter(o => o.applicableTo === applicableTo || o.applicableTo === 'all');
    }
    
    return offers;
  },

  async createOffer(offerData) {
    await delay(800);
    
    const newOffer = {
      id: String(Date.now()),
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      ...offerData
    };
    
    mockOffers.push(newOffer);
    return newOffer;
  }
};

// Export all APIs
const api = {
  auth: authApi,
  rooms: roomApi,
  restaurant: restaurantApi,
  dashboard: dashboardApi,
  users: userApi,
  offers: offersApi
};

export default api;
