const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token required'
        }
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure user still exists and is active
    const user = await db('users')
      .select('id', 'first_name', 'last_name', 'email', 'role', 'is_active')
      .where({ id: decoded.id })
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found'
        }
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Account is deactivated'
        }
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token expired'
        }
      });
    }

    next(error);
  }
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const userRole = req.user.role;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
};

// Check if user is staff (not customer)
const requireStaff = requireRole(['receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin']);

// Check if user is manager or admin
const requireManager = requireRole(['manager', 'admin']);

// Check if user is admin
const requireAdmin = requireRole('admin');

module.exports = {
  authenticateToken,
  requireRole,
  requireStaff,
  requireManager,
  requireAdmin
};
