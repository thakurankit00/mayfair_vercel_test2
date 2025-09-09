const express = require('express');
const router = express.Router();

// Import controllers
const {
  getRestaurants,
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
  addOrderItems,
  getKitchenOrders,
  acceptKitchenOrder,
  rejectKitchenOrder,
  transferOrderToKitchen,
  getOrderKitchenLogs
} = require('../controllers/orderController');

const {
  getKitchens,
  getKitchenDashboard,
  assignStaffToKitchen,
  removeStaffFromKitchen,
  getKitchenStaff
} = require('../controllers/kitchenController');

const { authenticateToken, requireRole } = require('../middleware/auth');

// ============================================================================
// RESTAURANT MANAGEMENT ROUTES
// ============================================================================

// Get all restaurants (Staff+)
router.get('/restaurants', authenticateToken, getRestaurants);

// ============================================================================
// TABLE MANAGEMENT ROUTES
// ============================================================================

// Get all restaurant tables (Staff+)
router.get('/tables', authenticateToken, requireRole(['receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin']), getTables);

// Get restaurant-specific tables
router.get('/restaurants/:restaurantId/tables', authenticateToken, requireRole(['receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin']), getTables);

// Create new restaurant table (Admin/Manager) - restaurant-specific
router.post('/restaurants/:restaurantId/tables', authenticateToken, requireRole(['admin', 'manager']), createTable);

// Update restaurant table (Admin/Manager)
router.put('/tables/:id', authenticateToken, requireRole(['admin', 'manager']), updateTable);

// Delete restaurant table (Admin/Manager)
router.delete('/tables/:id', authenticateToken, requireRole(['admin', 'manager']), deleteTable);

// ============================================================================
// MENU MANAGEMENT ROUTES
// ============================================================================

// Get menu categories (Public) - legacy and restaurant-specific
router.get('/menu/categories', getMenuCategories);
router.get('/restaurants/:restaurantId/menu/categories', getMenuCategories);

// Create menu category (Admin/Manager) - restaurant-specific
router.post('/restaurants/:restaurantId/menu/categories', authenticateToken, requireRole(['admin', 'manager']), createMenuCategory);

// Get menu with items (Public) - legacy and restaurant-specific
router.get('/menu', getMenu);
router.get('/restaurants/:restaurantId/menu', getMenu);

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

// ============================================================================
// KITCHEN MANAGEMENT ROUTES
// ============================================================================

// Get available kitchens (Staff+)
router.get('/kitchens', authenticateToken, requireRole(['receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin']), getKitchens);

// Get kitchen dashboard (Kitchen Staff+)
router.get('/kitchens/:kitchenId/dashboard', authenticateToken, getKitchenDashboard);

// Get kitchen staff (Kitchen Staff+)
router.get('/kitchens/:kitchenId/staff', authenticateToken, getKitchenStaff);

// Assign staff to kitchen (Manager/Admin)
router.post('/kitchens/:kitchenId/staff', authenticateToken, requireRole(['manager', 'admin']), assignStaffToKitchen);

// Remove staff from kitchen (Manager/Admin)
router.delete('/kitchens/:kitchenId/staff/:userId/:role', authenticateToken, requireRole(['manager', 'admin']), removeStaffFromKitchen);

// Get kitchen orders (Kitchen Staff+)
router.get('/kitchen/:kitchenId/orders', authenticateToken, getKitchenOrders);

// Accept kitchen order (Chef/Bartender+)
router.post('/kitchen/:kitchenId/orders/:orderId/accept', authenticateToken, requireRole(['chef', 'bartender', 'manager', 'admin']), acceptKitchenOrder);

// Reject kitchen order (Chef/Bartender+)
router.post('/kitchen/:kitchenId/orders/:orderId/reject', authenticateToken, requireRole(['chef', 'bartender', 'manager', 'admin']), rejectKitchenOrder);

// Transfer order to different kitchen (Waiter+)
router.post('/orders/:orderId/transfer', authenticateToken, requireRole(['waiter', 'manager', 'admin']), transferOrderToKitchen);

// Get kitchen logs for order (Protected)
router.get('/orders/:orderId/kitchen-logs', authenticateToken, getOrderKitchenLogs);

module.exports = router;
