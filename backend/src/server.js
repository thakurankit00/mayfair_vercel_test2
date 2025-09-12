require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const SocketHandler = require('./sockets/socketHandler');
const { setupSwagger } = require('./config/swagger');

// Import database connection
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const restaurantRoutes = require('./routes/restaurant');
const uploadRoutes =require ('./routes/upload')

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');


const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Initialize Socket.io handler
const socketHandler = new SocketHandler(io);

// Make socket handler available to routes
app.set('socketHandler', socketHandler);

// Setup Swagger documentation
setupSwagger(app);

// Trust proxy for rate limiting and security
// This is needed when behind a reverse proxy (nginx, load balancer, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes by default
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  // Skip rate limiting in development if no proxy headers
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      return !req.headers['x-forwarded-for'];
    }
    return false;
  },
  // Standard headers for rate limiting info
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.LOG_FORMAT || 'combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    }
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/restaurant', restaurantRoutes);
app.use('/api/v1/upload',uploadRoutes);
// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔌 Socket.io enabled with CORS: ${process.env.CORS_ORIGIN || 'http://localhost:3001'}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3001'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⏹️  SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⏹️  SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
