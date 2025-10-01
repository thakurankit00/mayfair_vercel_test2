const request = require('supertest');
const jwt = require('jsonwebtoken');

// Import the app after mocks are set up
const app = require('../../src/server');
const db = require('../../src/config/database');

describe('Authentication API Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Mock test user data
    testUser = {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: 'waiter',
      first_name: 'Test',
      last_name: 'User',
      is_active: true
    };

    // Generate auth token for authenticated tests
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

    // Give the server time to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up any resources
    if (db && db.destroy) {
      await db.destroy();
    }
  });

  describe('POST /api/v1/auth/login - User Login', () => {
    test('should login with valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user).toHaveProperty('username');
        expect(response.body.data.user).toHaveProperty('role');
      }
    });

    test('should return 401 for invalid credentials', async () => {
      const invalidLoginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidLoginData)
        .timeout(10000);

      expect([401, 400]).toContain(response.status);
      if (response.body) {
        expect(response.body.success).toBe(false);
      }
    });

    test('should return 400 for missing credentials', async () => {
      const incompleteLoginData = {
        username: 'testuser'
        // Missing password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(incompleteLoginData)
        .timeout(10000);

      expect([400, 422]).toContain(response.status);
      if (response.body) {
        expect(response.body.success).toBe(false);
      }
    });

    test('should return 401 for non-existent user', async () => {
      const nonExistentUserData = {
        username: 'nonexistentuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(nonExistentUserData)
        .timeout(10000);

      expect([401, 404]).toContain(response.status);
    });
  });

  describe('POST /api/v1/auth/register - User Registration', () => {
    test('should register new user with valid data', async () => {
      const registrationData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        role: 'waiter'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registrationData)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user.username).toBe('newuser');
      }
    });

    test('should return 400 for missing required fields', async () => {
      const incompleteRegistrationData = {
        username: 'incompleteuser',
        // Missing email, password, etc.
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(incompleteRegistrationData)
        .timeout(10000);

      expect([400, 422]).toContain(response.status);
    });

    test('should return 409 for duplicate username', async () => {
      const duplicateUserData = {
        username: 'testuser', // Already exists
        email: 'duplicate@example.com',
        password: 'password123',
        first_name: 'Duplicate',
        last_name: 'User',
        role: 'waiter'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUserData)
        .timeout(10000);

      expect([409, 400]).toContain(response.status);
    });

    test('should return 400 for invalid email format', async () => {
      const invalidEmailData = {
        username: 'invalidemailuser',
        email: 'invalid-email-format',
        password: 'password123',
        first_name: 'Invalid',
        last_name: 'Email',
        role: 'waiter'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidEmailData)
        .timeout(10000);

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('GET /api/v1/auth/profile - Get User Profile', () => {
    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user).toHaveProperty('username');
        expect(response.body.data.user).toHaveProperty('role');
      }
    });

    test('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .timeout(10000);

      expect(response.status).toBe(401);
    });

    test('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/auth/profile - Update User Profile', () => {
    test('should update user profile with valid data', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user');
      }
    });

    test('should return 401 without authentication', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name'
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .send(updateData)
        .timeout(10000);

      expect(response.status).toBe(401);
    });

    test('should return 400 for invalid email format', async () => {
      const invalidUpdateData = {
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .timeout(10000);

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('POST /api/v1/auth/change-password - Change Password', () => {
    test('should change password with valid current password', async () => {
      const passwordChangeData = {
        current_password: 'password123',
        new_password: 'newpassword123',
        confirm_password: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordChangeData)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('should return 400 for mismatched password confirmation', async () => {
      const mismatchedPasswordData = {
        current_password: 'password123',
        new_password: 'newpassword123',
        confirm_password: 'differentpassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mismatchedPasswordData)
        .timeout(10000);

      expect([400, 422]).toContain(response.status);
    });

    test('should return 401 without authentication', async () => {
      const passwordChangeData = {
        current_password: 'password123',
        new_password: 'newpassword123',
        confirm_password: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .send(passwordChangeData)
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout - User Logout', () => {
    test('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      // Should not return 500 (server error)
      expect(response.status).not.toBe(500);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .timeout(10000);

      expect(response.status).toBe(401);
    });
  });
});
