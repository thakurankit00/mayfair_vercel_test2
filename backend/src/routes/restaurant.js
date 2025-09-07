const express = require('express');
const router = express.Router();

// Import controllers
const {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  getMenuCategories,
  createMenuCategory,
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/restaurantController');

const {
  getTableAvailability,
  createReservation,
  getReservations,
  updateReservation,
  cancelReservation
} = require('../controllers/reservationController');

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderItemStatus,
  addOrderItems
} = require('../controllers/orderController');

const { authenticateToken, requireRole } = require('../middleware/auth');

// ============================================================================
// TABLE MANAGEMENT ROUTES
// ============================================================================

// Get all restaurant tables (Staff+)
router.get('/tables', authenticateToken, requireRole(['receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin']), getTables);

// Create new restaurant table (Admin/Manager)
router.post('/tables', authenticateToken, requireRole(['admin', 'manager']), createTable);

// Update restaurant table (Admin/Manager)
router.put('/tables/:id', authenticateToken, requireRole(['admin', 'manager']), updateTable);

// Delete restaurant table (Admin/Manager)
router.delete('/tables/:id', authenticateToken, requireRole(['admin', 'manager']), deleteTable);

// ============================================================================
// MENU MANAGEMENT ROUTES
// ============================================================================

// Get menu categories (Public)
router.get('/menu/categories', getMenuCategories);

// Create menu category (Admin/Manager)
router.post('/menu/categories', authenticateToken, requireRole(['admin', 'manager']), createMenuCategory);

// Get menu with items (Public)
router.get('/menu', getMenu);

// Create menu item (Admin/Manager)
router.post('/menu/items', authenticateToken, requireRole(['admin', 'manager']), createMenuItem);

// Update menu item (Admin/Manager)
router.put('/menu/items/:id', authenticateToken, requireRole(['admin', 'manager']), updateMenuItem);

// Delete menu item (Admin/Manager)
router.delete('/menu/items/:id', authenticateToken, requireRole(['admin', 'manager']), deleteMenuItem);

// ============================================================================
// TABLE RESERVATION ROUTES
// ============================================================================

// Check table availability (Public)
router.get('/availability', getTableAvailability);

// Create table reservation (Protected)
router.post('/reservations', authenticateToken, createReservation);

// Get reservations (Protected)
router.get('/reservations', authenticateToken, getReservations);

// Update reservation (Protected)
router.put('/reservations/:id', authenticateToken, updateReservation);

// Cancel reservation (Protected)
router.delete('/reservations/:id', authenticateToken, cancelReservation);

// ============================================================================
// ORDER MANAGEMENT ROUTES
// ============================================================================

// Create new order (Protected)
router.post('/orders', authenticateToken, createOrder);

// Get orders (Protected - role-based filtering)
router.get('/orders', authenticateToken, getOrders);

// Get order by ID (Protected)
router.get('/orders/:id', authenticateToken, getOrderById);

// Update order status (Staff+)
router.put('/orders/:id/status', authenticateToken, requireRole(['receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin']), updateOrderStatus);

// Update order item status (Chef/Bartender/Manager/Admin)
router.put('/orders/:orderId/items/:itemId/status', authenticateToken, requireRole(['chef', 'bartender', 'manager', 'admin']), updateOrderItemStatus);

// Add items to existing order (Protected)
router.post('/orders/:id/items', authenticateToken, addOrderItems);

module.exports = router;
