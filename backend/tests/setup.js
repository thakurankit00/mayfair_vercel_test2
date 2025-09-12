require('dotenv').config({ path: '.env.test' });

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

// Mock Socket.io for tests
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn()
    }))
  }))
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'mayfair_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
