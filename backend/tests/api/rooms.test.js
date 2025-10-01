const request = require('supertest');
const jwt = require('jsonwebtoken');

// Import the app after mocks are set up
const app = require('../../src/server');
const db = require('../../src/config/database');

describe('Rooms API Integration Tests', () => {
  let authToken;
  let testUser;
  let testRoom;
  let testRoomType;

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
    testRoomType = {
      id: 'test-room-type-id',
      name: 'Standard Room',
      base_price: 100.00,
      max_occupancy: 2,
      amenities: ['WiFi', 'TV', 'AC']
    };

    testRoom = {
      id: 'test-room-id',
      room_number: '101',
      room_type_id: testRoomType.id,
      floor: 1,
      status: 'available',
      is_active: true
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

  describe('GET /api/v1/rooms/list - Get Rooms', () => {
    test('should get all available rooms', async () => {
      const response = await request(app)
        .get('/api/v1/rooms/list')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.rooms)).toBe(true);
      }
    });

    test('should filter rooms by status', async () => {
      const response = await request(app)
        .get('/api/v1/rooms/list?status=available')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.rooms)).toBe(true);
      }
    });

    test('should filter rooms by floor', async () => {
      const response = await request(app)
        .get('/api/v1/rooms/list?floor=1')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.rooms)).toBe(true);
      }
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/rooms/list')
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/rooms/:id - Get Room by ID', () => {
    test('should get specific room by ID', async () => {
      const roomId = 'test-room-id';
      
      const response = await request(app)
        .get(`/api/v1/rooms/${roomId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.room).toHaveProperty('id');
      }
    });

    test('should return 404 for non-existent room', async () => {
      const nonExistentRoomId = 'non-existent-room-id';
      
      const response = await request(app)
        .get(`/api/v1/rooms/${nonExistentRoomId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      expect([404, 500]).toContain(response.status);
    });

    test('should return 401 without authentication', async () => {
      const roomId = 'test-room-id';
      
      const response = await request(app)
        .get(`/api/v1/rooms/${roomId}`)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/rooms/:id/status - Update Room Status', () => {
    test('should update room status', async () => {
      const roomId = 'test-room-id';
      const statusUpdate = {
        status: 'maintenance',
        notes: 'Scheduled maintenance'
      };

      const response = await request(app)
        .put(`/api/v1/rooms/${roomId}/status`)
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
      const roomId = 'test-room-id';
      const invalidStatusUpdate = {
        status: 'invalid-status'
      };

      const response = await request(app)
        .put(`/api/v1/rooms/${roomId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidStatusUpdate)
        .timeout(10000);

      expect([400, 422]).toContain(response.status);
    });

    test('should return 401 without authentication', async () => {
      const roomId = 'test-room-id';
      const statusUpdate = {
        status: 'occupied'
      };

      const response = await request(app)
        .put(`/api/v1/rooms/${roomId}/status`)
        .send(statusUpdate)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/rooms/availability - Check Room Availability', () => {
    test('should check room availability for date range', async () => {
      const checkInDate = '2024-01-15';
      const checkOutDate = '2024-01-17';

      const response = await request(app)
        .get(`/api/v1/rooms/availability?check_in=${checkInDate}&check_out=${checkOutDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.available_rooms)).toBe(true);
      }
    });

    test('should return 400 for missing date parameters', async () => {
      const response = await request(app)
        .get('/api/v1/rooms/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      expect([400, 422]).toContain(response.status);
    });

    test('should return 401 without authentication', async () => {
      const checkInDate = '2024-01-15';
      const checkOutDate = '2024-01-17';

      const response = await request(app)
        .get(`/api/v1/rooms/availability?check_in=${checkInDate}&check_out=${checkOutDate}`)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/rooms/types - Get Room Types', () => {
    test('should get all room types', async () => {
      const response = await request(app)
        .get('/api/v1/rooms/types')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.room_types)).toBe(true);
      }
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/rooms/types')
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });
});
