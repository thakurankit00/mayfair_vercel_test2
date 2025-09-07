const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// @route   GET /api/v1/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', requireAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'User management endpoint - Coming Soon'
  });
});

// @route   PUT /api/v1/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Profile update endpoint - Coming Soon'
  });
});

module.exports = router;
