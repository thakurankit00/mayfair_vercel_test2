const errorHandler = (err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error'
    }
  };

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map(e => e.message);
    error = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    };
    return res.status(400).json(error);
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: `${field} already exists`
      }
    };
    return res.status(409).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    };
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token expired'
      }
    };
    return res.status(401).json(error);
  }

  // Custom application errors
  if (err.statusCode) {
    error = {
      success: false,
      error: {
        code: err.code || 'APPLICATION_ERROR',
        message: err.message
      }
    };
    return res.status(err.statusCode).json(error);
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
    error = {
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Database connection failed'
      }
    };
    return res.status(503).json(error);
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique violation
    error = {
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists'
      }
    };
    return res.status(409).json(error);
  }

  if (err.code === '23503') { // Foreign key violation
    error = {
      success: false,
      error: {
        code: 'REFERENCE_ERROR',
        message: 'Referenced resource does not exist'
      }
    };
    return res.status(400).json(error);
  }

  if (err.code === '23502') { // Not null violation
    error = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Required field missing'
      }
    };
    return res.status(400).json(error);
  }

  // Return default error
  res.status(500).json(error);
};

module.exports = errorHandler;
