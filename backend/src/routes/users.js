const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateProfile
} = require('../controllers/userController');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// @route   GET /api/v1/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', requireAdmin, getUsers);

// @route   GET /api/v1/users/:id
// @desc    Get user by ID (admin only)
// @access  Private (Admin)
router.get('/:id', requireAdmin, getUserById);

// @route   POST /api/v1/users
// @desc    Create new user (admin only)
// @access  Private (Admin)
router.post('/', requireAdmin, createUser);

// @route   PUT /api/v1/users/:id
// @desc    Update user (admin only)
// @access  Private (Admin)
router.put('/:id', requireAdmin, updateUser);

// @route   DELETE /api/v1/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete('/:id', requireAdmin, deleteUser);

// @route   PUT /api/v1/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', updateProfile);

module.exports = router;
