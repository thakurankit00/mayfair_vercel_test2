const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    }
  );
};

// Register new user
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'First name, last name, email, and password are required'
        }
      });
    }

    // Check if user already exists
    const existingUser = await db('users')
      .select('id')
      .where('email', email.toLowerCase())
      .first();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const userData = {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      phone: phone || null,
      password_hash: passwordHash,
      role: 'customer', // Default role
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db('users').insert(userData);

    // Get created user (without password)
    const newUser = await db('users')
      .select('id', 'first_name', 'last_name', 'email', 'phone', 'role', 'created_at')
      .where('id', userId)
      .first();

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          createdAt: newUser.created_at
        },
        token
      },
      message: 'User registered successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    // Find user by email
    const user = await db('users')
      .select('id', 'first_name', 'last_name', 'email', 'phone', 'role', 'password_hash', 'is_active')
      .where('email', email.toLowerCase())
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated'
        }
      });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    console.log(passwordHash);
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      },
      message: 'Login successful'
    });

  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await db('users')
      .select(
        'id', 'first_name', 'last_name', 'email', 'phone', 'role', 
        'profile_image_url', 'address', 'city', 'state', 'country', 
        'preferences', 'created_at', 'updated_at'
      )
      .where('id', req.user.id)
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profile_image_url,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        preferences: user.preferences || {},
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    next(error);
  }
};

// Logout (client-side token invalidation)
const logout = async (req, res, next) => {
  try {
    // In a more complex setup, you might want to blacklist the token
    // For now, we'll just send a success response
    // The client should remove the token from storage
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile
};
