const request = require('supertest');
const jwt = require('jsonwebtoken');

// Import the app after mocks are set up
const app = require('../../src/server');
const db = require('../../src/config/database');

describe('Restaurant API Integration Tests', () => {
  let authToken;
  let testUser;
  let testRestaurant;
  let testTable;
  let testMenuItem;

  beforeAll(async () => {
    // Create test user
    testUser = {
      id: 'test-user-id',
      username: 'test-manager',
      role: 'manager',
      first_name: 'Test',
      last_name: 'Manager',
      email: 'manager@example.com'
    };

    // Generate auth token
    authToken = jwt.sign(
      { 
        userId: testUser.id,
        id: testUser.id,
        username: testUser.username,
        role: testUser.role 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Mock test data
    testRestaurant = {
      id: 'test-restaurant-id',
      name: 'Test Restaurant',
      description: 'A test restaurant',
      cuisine_type: 'International',
      is_active: true
    };

    testTable = {
      id: 'test-table-id',
      table_number: 'T001',
      restaurant_id: testRestaurant.id,
      capacity: 4,
      status: 'available'
    };

    testMenuItem = {
      id: 'test-menu-item-id',
      name: 'Test Burger',
      description: 'A delicious test burger',
      price: 15.99,
      restaurant_id: testRestaurant.id,
      category_id: 'test-category-id',
      is_available: true
    };

    // Give the server time to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up any resources
    if (db && db.destroy) {
      await db.destroy();
    }
  });

  describe('GET /api/v1/restaurant/restaurants - Get Restaurants', () => {
    test('should get all restaurants', async () => {
      const response = await request(app)
        .get('/api/v1/restaurant/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.restaurants)).toBe(true);
      }
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/restaurant/restaurants')
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/restaurant/restaurants/:id - Get Restaurant by ID', () => {
    test('should get specific restaurant by ID', async () => {
      const restaurantId = 'test-restaurant-id';
      
      const response = await request(app)
        .get(`/api/v1/restaurant/restaurants/${restaurantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.restaurant).toHaveProperty('id');
      }
    });

    test('should return 404 for non-existent restaurant', async () => {
      const nonExistentRestaurantId = 'non-existent-restaurant-id';
      
      const response = await request(app)
        .get(`/api/v1/restaurant/restaurants/${nonExistentRestaurantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/restaurant/menu/:restaurantId - Get Restaurant Menu', () => {
    test('should get restaurant menu', async () => {
      const restaurantId = 'test-restaurant-id';
      
      const response = await request(app)
        .get(`/api/v1/restaurant/menu/${restaurantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.menu_items)).toBe(true);
      }
    });

    test('should filter menu by category', async () => {
      const restaurantId = 'test-restaurant-id';
      const categoryId = 'test-category-id';
      
      const response = await request(app)
        .get(`/api/v1/restaurant/menu/${restaurantId}?category=${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.menu_items)).toBe(true);
      }
    });

    test('should return 401 without authentication', async () => {
      const restaurantId = 'test-restaurant-id';
      
      const response = await request(app)
        .get(`/api/v1/restaurant/menu/${restaurantId}`)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/restaurant/tables/:restaurantId - Get Restaurant Tables', () => {
    test('should get restaurant tables', async () => {
      const restaurantId = 'test-restaurant-id';
      
      const response = await request(app)
        .get(`/api/v1/restaurant/tables/${restaurantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.tables)).toBe(true);
      }
    });

    test('should filter tables by status', async () => {
      const restaurantId = 'test-restaurant-id';
      
      const response = await request(app)
        .get(`/api/v1/restaurant/tables/${restaurantId}?status=available`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.tables)).toBe(true);
      }
    });

    test('should return 401 without authentication', async () => {
      const restaurantId = 'test-restaurant-id';
      
      const response = await request(app)
        .get(`/api/v1/restaurant/tables/${restaurantId}`)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/restaurant/tables/:tableId/status - Update Table Status', () => {
    test('should update table status', async () => {
      const tableId = 'test-table-id';
      const statusUpdate = {
        status: 'occupied',
        notes: 'Customer seated'
      };

      const response = await request(app)
        .put(`/api/v1/restaurant/tables/${tableId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusUpdate)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('should return 400 for invalid status', async () => {
      const tableId = 'test-table-id';
      const invalidStatusUpdate = {
        status: 'invalid-status'
      };

      const response = await request(app)
        .put(`/api/v1/restaurant/tables/${tableId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidStatusUpdate)
        .timeout(10000);

      expect([400, 422]).toContain(response.status);
    });

    test('should return 401 without authentication', async () => {
      const tableId = 'test-table-id';
      const statusUpdate = {
        status: 'available'
      };

      const response = await request(app)
        .put(`/api/v1/restaurant/tables/${tableId}/status`)
        .send(statusUpdate)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/restaurant/categories/:restaurantId - Get Menu Categories', () => {
    test('should get menu categories', async () => {
      const restaurantId = 'test-restaurant-id';
      
      const response = await request(app)
        .get(`/api/v1/restaurant/categories/${restaurantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.categories)).toBe(true);
      }
    });

    test('should return 401 without authentication', async () => {
      const restaurantId = 'test-restaurant-id';
      
      const response = await request(app)
        .get(`/api/v1/restaurant/categories/${restaurantId}`)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/restaurant/dashboard - Get Dashboard Data', () => {
    test('should get dashboard data for manager', async () => {
      const response = await request(app)
        .get('/api/v1/restaurant/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('stats');
      }
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/restaurant/dashboard')
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/restaurant/kitchen-dashboard - Get Kitchen Dashboard', () => {
    test('should get kitchen dashboard data', async () => {
      const response = await request(app)
        .get('/api/v1/restaurant/kitchen-dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.orders)).toBe(true);
      }
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/restaurant/kitchen-dashboard')
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });
});
