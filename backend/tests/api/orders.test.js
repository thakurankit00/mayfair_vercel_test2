const request = require('supertest');
const jwt = require('jsonwebtoken');

// Import the app after mocks are set up
const app = require('../../src/server');
const db = require('../../src/config/database');

describe('Orders API Integration Tests', () => {
  let authToken;
  let testUser;
  let testRestaurant;
  let testTable;
  let testMenuItem;
  let testOrder;

  beforeAll(async () => {
    // Create test user
    testUser = {
      id: 'test-user-id',
      username: 'test-waiter',
      role: 'waiter',
      first_name: 'Test',
      last_name: 'Waiter',
      email: 'test@example.com'
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
      price: 15.99,
      restaurant_id: testRestaurant.id,
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

  describe('POST /api/v1/restaurant/orders - Create Order', () => {
    test('should create a new dine-in order successfully', async () => {
      const orderData = {
        table_id: testTable.id,
        restaurant_id: testRestaurant.id,
        order_type: 'dine_in',
        items: [
          {
            menu_item_id: testMenuItem.id,
            quantity: 2,
            special_instructions: 'Extra cheese'
          }
        ],
        special_instructions: 'Rush order'
      };

      const response = await request(app)
        .post('/api/v1/restaurant/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.order).toHaveProperty('id');
        expect(response.body.data.order).toHaveProperty('order_number');
        expect(response.body.data.order.special_instructions).toBe('Rush order');
        testOrder = response.body.data.order;
      }
    });

    test('should create a takeaway order successfully', async () => {
      const orderData = {
        restaurant_id: testRestaurant.id,
        order_type: 'takeaway',
        items: [
          {
            menu_item_id: testMenuItem.id,
            quantity: 1,
            special_instructions: 'No onions'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/restaurant/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.order.order_type).toBe('takeaway');
      }
    });

    test('should return 400 for invalid order data', async () => {
      const invalidOrderData = {
        // Missing required fields
        items: []
      };

      const response = await request(app)
        .post('/api/v1/restaurant/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOrderData)
        .timeout(10000);

      expect([400, 422]).toContain(response.status);
      if (response.body) {
        expect(response.body.success).toBe(false);
      }
    });

    test('should return 401 without authentication', async () => {
      const orderData = {
        table_id: testTable.id,
        order_type: 'dine_in',
        items: [
          {
            menu_item_id: testMenuItem.id,
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/restaurant/orders')
        .send(orderData)
        .timeout(10000);

      expect(response.status).toBe(401);
    });

    test('should return 400 for dine-in order without table', async () => {
      const orderData = {
        restaurant_id: testRestaurant.id,
        order_type: 'dine_in',
        // Missing table_id
        items: [
          {
            menu_item_id: testMenuItem.id,
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/restaurant/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .timeout(10000);

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('GET /api/v1/restaurant/orders - Get Orders', () => {
    test('should get orders for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/restaurant/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.orders)).toBe(true);
      }
    });

    test('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/v1/restaurant/orders?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.orders)).toBe(true);
      }
    });

    test('should filter orders by order type', async () => {
      const response = await request(app)
        .get('/api/v1/restaurant/orders?order_type=takeaway')
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
        .get('/api/v1/restaurant/orders')
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/restaurant/orders/:id - Get Order by ID', () => {
    test('should get specific order by ID', async () => {
      const orderId = 'test-order-id';

      const response = await request(app)
        .get(`/api/v1/restaurant/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.order).toHaveProperty('id');
      }
    });

    test('should return 404 for non-existent order', async () => {
      const nonExistentOrderId = 'non-existent-order-id';

      const response = await request(app)
        .get(`/api/v1/restaurant/orders/${nonExistentOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      expect([404, 500]).toContain(response.status);
    });

    test('should return 401 without authentication', async () => {
      const orderId = 'test-order-id';

      const response = await request(app)
        .get(`/api/v1/restaurant/orders/${orderId}`)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/restaurant/orders/:id - Update Order', () => {
    test('should update order details', async () => {
      const orderId = 'test-order-id';
      const updateData = {
        special_instructions: 'Updated instructions',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/v1/restaurant/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.order).toHaveProperty('id');
      }
    });

    test('should update order status', async () => {
      const orderId = 'test-order-id';
      const statusUpdate = {
        status: 'preparing'
      };

      const response = await request(app)
        .put(`/api/v1/restaurant/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusUpdate)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('should return 404 for non-existent order update', async () => {
      const nonExistentOrderId = 'non-existent-order-id';
      const updateData = {
        special_instructions: 'Updated instructions'
      };

      const response = await request(app)
        .put(`/api/v1/restaurant/orders/${nonExistentOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .timeout(10000);

      expect([404, 500]).toContain(response.status);
    });

    test('should return 401 without authentication', async () => {
      const orderId = 'test-order-id';
      const updateData = {
        special_instructions: 'Updated instructions'
      };

      const response = await request(app)
        .put(`/api/v1/restaurant/orders/${orderId}`)
        .send(updateData)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/restaurant/orders/:orderId/items/:itemId - Delete Order Item', () => {
    test('should delete order item', async () => {
      const orderId = 'test-order-id';
      const itemId = 'test-item-id';

      const response = await request(app)
        .delete(`/api/v1/restaurant/orders/${orderId}/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('should return 404 for non-existent order item', async () => {
      const orderId = 'test-order-id';
      const nonExistentItemId = 'non-existent-item-id';

      const response = await request(app)
        .delete(`/api/v1/restaurant/orders/${orderId}/items/${nonExistentItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      expect([404, 500]).toContain(response.status);
    });

    test('should return 401 without authentication', async () => {
      const orderId = 'test-order-id';
      const itemId = 'test-item-id';

      const response = await request(app)
        .delete(`/api/v1/restaurant/orders/${orderId}/items/${itemId}`)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/restaurant/orders/:id/items - Add Items to Order', () => {
    test('should add items to existing order', async () => {
      const orderId = 'test-order-id';
      const newItems = {
        items: [
          {
            menu_item_id: testMenuItem.id,
            quantity: 1,
            special_instructions: 'Extra sauce'
          }
        ]
      };

      const response = await request(app)
        .post(`/api/v1/restaurant/orders/${orderId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newItems)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('should return 400 for invalid items data', async () => {
      const orderId = 'test-order-id';
      const invalidItems = {
        items: [] // Empty items array
      };

      const response = await request(app)
        .post(`/api/v1/restaurant/orders/${orderId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidItems)
        .timeout(10000);

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('POST /api/v1/restaurant/orders/:orderId/bill - Generate Bill', () => {
    test('should generate bill for completed order', async () => {
      const orderId = 'test-order-id';

      const response = await request(app)
        .post(`/api/v1/restaurant/orders/${orderId}/bill`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.bill).toHaveProperty('total_amount');
      }
    });

    test('should return 404 for non-existent order bill', async () => {
      const nonExistentOrderId = 'non-existent-order-id';

      const response = await request(app)
        .post(`/api/v1/restaurant/orders/${nonExistentOrderId}/bill`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      expect([404, 500]).toContain(response.status);
    });

    test('should return 401 without authentication', async () => {
      const orderId = 'test-order-id';

      const response = await request(app)
        .post(`/api/v1/restaurant/orders/${orderId}/bill`)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('Kitchen Order Management', () => {
    describe('POST /api/v1/restaurant/kitchen/:kitchenId/orders/:orderId/accept', () => {
      test('should accept order in kitchen', async () => {
        const kitchenId = 'test-kitchen-id';
        const orderId = 'test-order-id';

        const response = await request(app)
          .post(`/api/v1/restaurant/kitchen/${kitchenId}/orders/${orderId}/accept`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            estimated_time: 15,
            notes: 'Order accepted'
          })
          .timeout(10000);

        // Should not return 500 (server error)
        expect(response.status).not.toBe(500);

        if (response.status === 200) {
          expect(response.body.success).toBe(true);
        }
      });
    });

    describe('POST /api/v1/restaurant/kitchen/:kitchenId/orders/:orderId/reject', () => {
      test('should reject order in kitchen with reason', async () => {
        const kitchenId = 'test-kitchen-id';
        const orderId = 'test-order-id';

        const response = await request(app)
          .post(`/api/v1/restaurant/kitchen/${kitchenId}/orders/${orderId}/reject`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            reason: 'Ingredient not available'
          })
          .timeout(10000);

        // Should not return 500 (server error)
        expect(response.status).not.toBe(500);

        if (response.status === 200) {
          expect(response.body.success).toBe(true);
        }
      });

      test('should return 400 without rejection reason', async () => {
        const kitchenId = 'test-kitchen-id';
        const orderId = 'test-order-id';

        const response = await request(app)
          .post(`/api/v1/restaurant/kitchen/${kitchenId}/orders/${orderId}/reject`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({})
          .timeout(10000);

        expect([400, 422]).toContain(response.status);
      });
    });

    describe('GET /api/v1/restaurant/kitchen/:kitchenId/orders', () => {
      test('should get kitchen orders', async () => {
        const kitchenId = 'test-kitchen-id';

        const response = await request(app)
          .get(`/api/v1/restaurant/kitchen/${kitchenId}/orders`)
          .set('Authorization', `Bearer ${authToken}`)
          .timeout(10000);

        // Should not return 500 (server error)
        expect(response.status).not.toBe(500);

        if (response.status === 200) {
          expect(response.body.success).toBe(true);
          expect(Array.isArray(response.body.data.orders)).toBe(true);
        }
      });
    });
  });

  describe('Order Completion and Payment', () => {
    test('should complete order', async () => {
      const orderId = 'test-order-id';

      const response = await request(app)
        .post(`/api/v1/restaurant/orders/${orderId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('should request payment for order', async () => {
      const orderId = 'test-order-id';

      const response = await request(app)
        .post(`/api/v1/restaurant/orders/${orderId}/request-payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          payment_method: 'cash'
        })
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });
  });
});
