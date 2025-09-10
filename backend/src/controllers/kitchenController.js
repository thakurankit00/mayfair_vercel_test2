const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const OrderKitchenLog = require('../models/OrderKitchenLog');

/**
 * Kitchen Management Controller
 */

/**
 * Get available kitchens
 * GET /api/v1/kitchens
 */
const getKitchens = async (req, res) => {
  try {
    const kitchens = await Restaurant.getWithKitchens();
    
    return res.status(200).json({
      success: true,
      data: {
        kitchens,
        totalKitchens: kitchens.length
      }
    });
  } catch (error) {
    console.error('Get kitchens error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch kitchens'
      }
    });
  }
};

/**
 * Get kitchen dashboard data
 * GET /api/v1/kitchens/:kitchenId/dashboard
 */
const getKitchenDashboard = async (req, res) => {
  try {
    const { kitchenId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Verify user has access to this kitchen
    if (!['admin', 'manager'].includes(userRole)) {
      const restaurant = await Restaurant.query().findById(kitchenId);
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'KITCHEN_NOT_FOUND',
            message: 'Kitchen not found'
          }
        });
      }
      
      const hasAccess = await restaurant.hasUserAccess(userId, userRole === 'chef' ? 'chef' : 'bartender');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You do not have access to this kitchen'
          }
        });
      }
    }
    
    // Get kitchen stats
    const restaurant = await Restaurant.query().findById(kitchenId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'KITCHEN_NOT_FOUND',
          message: 'Kitchen not found'
        }
      });
    }
    
    const stats = await restaurant.getStatistics();
    
    // Get recent orders
    const recentOrders = await Order.getByKitchen(kitchenId)
      .limit(10);
    
    // Get pending orders count by status
    const ordersCounts = await Order.query()
      .where('target_kitchen_id', kitchenId)
      .groupBy('kitchen_status')
      .select('kitchen_status')
      .count('* as count');
    
    const statusCounts = {};
    ordersCounts.forEach(item => {
      statusCounts[item.kitchen_status] = parseInt(item.count);
    });
    
    // Get recent kitchen activity
    const recentActivity = await OrderKitchenLog.getRecentActivity(kitchenId, 12);
    
    return res.status(200).json({
      success: true,
      data: {
        restaurant,
        stats,
        recentOrders,
        statusCounts,
        recentActivity
      }
    });
    
  } catch (error) {
    console.error('Get kitchen dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch kitchen dashboard'
      }
    });
  }
};

/**
 * Assign staff to kitchen
 * POST /api/v1/kitchens/:kitchenId/staff
 */
const assignStaffToKitchen = async (req, res) => {
  try {
    const { kitchenId } = req.params;
    const { user_id, role } = req.body;
    const userRole = req.user.role;
    
    // Only managers and admins can assign staff
    if (!['manager', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only managers and admins can assign staff to kitchens'
        }
      });
    }
    
    if (!user_id || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User ID and role are required'
        }
      });
    }
    
    if (!['chef', 'bartender', 'waiter'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must be chef, bartender, or waiter'
        }
      });
    }
    
    const restaurant = await Restaurant.query().findById(kitchenId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'KITCHEN_NOT_FOUND',
          message: 'Kitchen not found'
        }
      });
    }
    
    const assignment = await restaurant.assignStaff(user_id, role);
    
    return res.status(200).json({
      success: true,
      data: { assignment },
      message: 'Staff assigned to kitchen successfully'
    });
    
  } catch (error) {
    console.error('Assign staff to kitchen error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to assign staff to kitchen'
      }
    });
  }
};

/**
 * Remove staff from kitchen
 * DELETE /api/v1/kitchens/:kitchenId/staff/:userId/:role
 */
const removeStaffFromKitchen = async (req, res) => {
  try {
    const { kitchenId, userId, role } = req.params;
    const userRole = req.user.role;
    
    // Only managers and admins can remove staff
    if (!['manager', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only managers and admins can remove staff from kitchens'
        }
      });
    }
    
    const restaurant = await Restaurant.query().findById(kitchenId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'KITCHEN_NOT_FOUND',
          message: 'Kitchen not found'
        }
      });
    }
    
    await restaurant.removeStaff(userId, role);
    
    return res.status(200).json({
      success: true,
      message: 'Staff removed from kitchen successfully'
    });
    
  } catch (error) {
    console.error('Remove staff from kitchen error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to remove staff from kitchen'
      }
    });
  }
};

/**
 * Get kitchen staff
 * GET /api/v1/kitchens/:kitchenId/staff
 */
const getKitchenStaff = async (req, res) => {
  try {
    const { kitchenId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Verify access
    if (!['admin', 'manager'].includes(userRole)) {
      const restaurant = await Restaurant.query().findById(kitchenId);
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'KITCHEN_NOT_FOUND',
            message: 'Kitchen not found'
          }
        });
      }
      
      const hasAccess = await restaurant.hasUserAccess(userId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You do not have access to this kitchen'
          }
        });
      }
    }
    
    const restaurantWithStaff = await Restaurant.getWithStaff(kitchenId);
    
    if (!restaurantWithStaff) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'KITCHEN_NOT_FOUND',
          message: 'Kitchen not found'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        restaurant: restaurantWithStaff.name,
        staff: restaurantWithStaff.staff,
        totalStaff: restaurantWithStaff.staff.length
      }
    });
    
  } catch (error) {
    console.error('Get kitchen staff error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch kitchen staff'
      }
    });
  }
};

module.exports = {
  getKitchens,
  getKitchenDashboard,
  assignStaffToKitchen,
  removeStaffFromKitchen,
  getKitchenStaff
};
