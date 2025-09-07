const express = require('express');
const { register, login, logout, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/v1/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', register);

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST /api/v1/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, logout);

// @route   GET /api/v1/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, getProfile);

module.exports = router;
