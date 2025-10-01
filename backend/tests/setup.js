// Load test environment variables first
require('dotenv').config({ path: '.env.test' });

// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_NAME = process.env.DB_NAME || 'mayfair_test';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';

// Mock knexfile before any database imports
jest.mock('../knexfile', () => ({
  test: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'mayfair_test',
      user: 'test_user',
      password: 'test_password',
      ssl: false
    },
    pool: { min: 1, max: 5 },
    migrations: {
      tableName: 'knex_migrations',
      directory: './database/migrations'
    }
  },
  development: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'mayfair_test',
      user: 'test_user',
      password: 'test_password',
      ssl: false
    }
  }
}));

// Mock database for tests
jest.mock('../src/config/database', () => {
  const mockDb = {
    // Mock Knex query builder methods
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),

    // Mock raw queries (used by SocketHandler for health checks)
    raw: jest.fn().mockResolvedValue({
      rows: [{ result: 2 }],
      rowCount: 1
    }),

    transaction: jest.fn((callback) => callback(mockDb)),
    destroy: jest.fn().mockResolvedValue(),

    // Mock table methods
    table: jest.fn().mockReturnThis(),

    // Mock query execution
    then: jest.fn().mockResolvedValue([]),
    catch: jest.fn().mockReturnThis(),
    finally: jest.fn().mockReturnThis(),

    // Mock specific table calls
    users: jest.fn().mockReturnThis(),
    orders: jest.fn().mockReturnThis(),
    order_items: jest.fn().mockReturnThis(),
    restaurants: jest.fn().mockReturnThis(),
    restaurant_tables: jest.fn().mockReturnThis(),
    menu_items: jest.fn().mockReturnThis(),
    rooms: jest.fn().mockReturnThis(),
    room_types: jest.fn().mockReturnThis(),
    room_bookings: jest.fn().mockReturnThis(),

    // Mock function calls
    count: jest.fn().mockResolvedValue([{ count: '0' }]),
    first: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      userId: 'test-user-id',
      username: 'test-user',
      first_name: 'Test',
      last_name: 'User',
      role: 'waiter',
      is_active: true,
      email: 'test@example.com'
    }),

    // Make it callable as a function
    __call: jest.fn().mockReturnThis()
  };

  // Make the mock callable
  const callableMock = jest.fn().mockReturnValue(mockDb);
  Object.assign(callableMock, mockDb);

  return callableMock;
});

// Mock Redis for tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn()
  }));
});

// Mock AWS SDK for tests
jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Location: 'test-url' })
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    })
  })),
  config: {
    update: jest.fn()
  }
}));

// Mock nodemailer for tests
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
  }))
}));

// Mock Twilio for tests
jest.mock('twilio', () => jest.fn(() => ({
  messages: {
    create: jest.fn().mockResolvedValue({ sid: 'test-sid' })
  }
})));

// Mock JWT for tests (used by SocketHandler)
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'test-jwt-token'),
  verify: jest.fn(() => ({
    userId: 'test-user-id',
    id: 'test-user-id',
    username: 'test-user',
    role: 'waiter',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })),
  decode: jest.fn(() => ({
    userId: 'test-user-id',
    username: 'test-user',
    role: 'waiter'
  }))
}));

// Mock Socket.io for tests
jest.mock('socket.io', () => ({
  Server: jest.fn(() => {
    const mockSocket = {
      id: 'test-socket-id',
      handshake: {
        auth: { token: 'test-token' }
      },
      user: {
        id: 'test-user-id',
        userId: 'test-user-id',
        username: 'test-user',
        first_name: 'Test',
        last_name: 'User',
        role: 'waiter',
        is_active: true
      },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn()
    };

    const mockIo = {
      // Core Socket.IO methods used by SocketHandler
      use: jest.fn((middleware) => {
        // Simulate middleware execution
        if (typeof middleware === 'function') {
          // Mock the next function to simulate successful authentication
          const next = jest.fn();
          try {
            // Set user on socket before calling middleware
            if (!mockSocket.user) {
              mockSocket.user = {
                id: 'test-user-id',
                userId: 'test-user-id',
                username: 'test-user',
                first_name: 'Test',
                last_name: 'User',
                role: 'waiter',
                is_active: true
              };
            }
            middleware(mockSocket, next);
          } catch (error) {
            // Ignore authentication errors in tests
            next();
          }
        }
      }),
      on: jest.fn((event, handler) => {
        // Simulate connection event
        if (event === 'connection' && typeof handler === 'function') {
          handler(mockSocket);
        }
      }),
      emit: jest.fn(),

      // Room-based methods
      to: jest.fn(() => ({
        emit: jest.fn()
      })),
      in: jest.fn(() => ({
        emit: jest.fn()
      })),

      // Additional methods that might be used
      sockets: {
        emit: jest.fn(),
        to: jest.fn(() => ({
          emit: jest.fn()
        }))
      },

      // Engine.io methods
      engine: {
        on: jest.fn(),
        generateId: jest.fn(() => 'test-socket-id')
      }
    };

    return mockIo;
  })
}));

// Additional test environment variables (already set above)
// These are kept for backward compatibility

// Mock additional modules that might cause issues
jest.mock('helmet', () => jest.fn(() => (req, res, next) => next()));
jest.mock('morgan', () => jest.fn(() => (req, res, next) => next()));
jest.mock('compression', () => jest.fn(() => (req, res, next) => next()));
jest.mock('express-rate-limit', () => jest.fn(() => (req, res, next) => next()));

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        public_id: 'test-id',
        secure_url: 'https://test.cloudinary.com/test.jpg'
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    }
  }
}));

// Global test timeout
jest.setTimeout(30000);

// Reduce console noise in tests but keep error logging for debugging
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn, // Keep warnings for debugging
  error: console.error // Keep errors for debugging
};
