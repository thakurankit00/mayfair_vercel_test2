const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const knex = require('../config/database');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const users = await knex('users')
      .select(
        'id',
        'first_name',
        'last_name', 
        'email',
        'phone',
        'role',
        'is_active',
        'created_at',
        'updated_at'
      )
      .orderBy('created_at', 'desc');

    res.status(200).json({
      success: true,
      data: {
        users,
        totalUsers: users.length
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch users'
      }
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await knex('users')
      .select(
        'id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'role',
        'is_active',
        'preferences',
        'created_at',
        'updated_at'
      )
      .where('id', id)
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
      data: { user }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch user'
      }
    });
  }
};

// @desc    Create new user
// @route   POST /api/v1/users
// @access  Private (Admin)
const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      password = 'password', // Default password
      isActive = true
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'First name, last name, email, and role are required'
        }
      });
    }

    // Validate role
    const validRoles = ['customer', 'receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: `Role must be one of: ${validRoles.join(', ')}`
        }
      });
    }

    // Check if user exists
    const existingUser = await knex('users').where('email', email).first();
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
    const saltRounds = 12;
    const hashedPassword = await bcryptjs.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const newUser = {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      phone: phone || null,
      password_hash: hashedPassword,
      role,
      is_active: isActive,
      preferences: JSON.stringify({}),
      created_at: new Date(),
      updated_at: new Date()
    };

    await knex('users').insert(newUser);

    // Return user without password
    const { password: _, ...userResponse } = newUser;
    
    res.status(201).json({
      success: true,
      data: { 
        user: userResponse,
        message: 'User created successfully'
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create user'
      }
    });
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      isActive,
      password
    } = req.body;

    // Check if user exists
    const existingUser = await knex('users').where('id', id).first();
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['customer', 'receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: `Role must be one of: ${validRoles.join(', ')}`
          }
        });
      }
    }

    // Check if email is taken by another user
    if (email && email.toLowerCase() !== existingUser.email) {
      const emailTaken = await knex('users')
        .where('email', email.toLowerCase())
        .where('id', '!=', id)
        .first();
      
      if (emailTaken) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_TAKEN',
            message: 'Email is already taken by another user'
          }
        });
      }
    }

    // Build update object
    const updateData = {
      updated_at: new Date()
    };

    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.is_active = isActive;

    // Hash password if provided
    if (password && password.trim() !== '') {
      const saltRounds = 12;
      updateData.password_hash = await bcryptjs.hash(password, saltRounds);
    }

    // Update user
    await knex('users').where('id', id).update(updateData);

    // Get updated user
    const updatedUser = await knex('users')
      .select(
        'id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'role',
        'is_active',
        'created_at',
        'updated_at'
      )
      .where('id', id)
      .first();

    res.status(200).json({
      success: true,
      data: { 
        user: updatedUser,
        message: 'User updated successfully'
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update user'
      }
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await knex('users').where('id', id).first();
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Prevent admin from deleting themselves
    if (req.user && req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'Cannot delete your own account'
        }
      });
    }

    // Soft delete - deactivate user instead of hard delete to maintain referential integrity
    await knex('users').where('id', id).update({
      is_active: false,
      email: `deleted_${Date.now()}_${existingUser.email}`, // Prevent email conflicts
      updated_at: new Date()
    });

    res.status(200).json({
      success: true,
      data: { message: 'User deactivated successfully' }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete user'
      }
    });
  }
};

// @desc    Update user profile (for logged-in user)
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      phone,
      currentPassword,
      newPassword
    } = req.body;

    // Get current user
    const currentUser = await knex('users').where('id', userId).first();
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Build update object
    const updateData = {
      updated_at: new Date()
    };

    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (phone !== undefined) updateData.phone = phone;

    // Handle password change
    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CURRENT_PASSWORD_REQUIRED',
            message: 'Current password is required to change password'
          }
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, currentUser.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CURRENT_PASSWORD',
            message: 'Current password is incorrect'
          }
        });
      }

      // Hash new password
      const saltRounds = 12;
      updateData.password_hash = await bcryptjs.hash(newPassword, saltRounds);
    }

    // Update user
    await knex('users').where('id', userId).update(updateData);

    // Get updated user without password
    const updatedUser = await knex('users')
      .select(
        'id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'role',
        'is_active',
        'created_at',
        'updated_at'
      )
      .where('id', userId)
      .first();

    res.status(200).json({
      success: true,
      data: { 
        user: updatedUser,
        message: 'Profile updated successfully'
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update profile'
      }
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateProfile
};
