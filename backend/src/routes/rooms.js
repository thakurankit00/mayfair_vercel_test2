const express = require('express');
const router = express.Router();
const {
  checkAvailability,
  searchRooms,
  getRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  bulkUpdatePrices,
  getOccupiedRooms,
  getRoomById
} = require('../controllers/roomController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public routes - no authentication required for checking availability
router.get('/availability', checkAvailability);
router.get('/search', checkAvailability);
router.get('/types', getRoomTypes);
router.get('/types/:id', getRoomTypeById);

// Room service routes - authentication required
router.get('/occupied', authenticateToken, getOccupiedRooms);
router.get('/:id', authenticateToken, getRoomById);

// Protected routes - Admin/Manager only
router.post('/types', authenticateToken, requireRole(['admin', 'manager']), createRoomType);
router.put('/types/:id', authenticateToken, requireRole(['admin', 'manager']), updateRoomType);
router.delete('/types/:id', authenticateToken, requireRole(['admin', 'manager']), deleteRoomType);
router.patch('/types/bulk-price-update', authenticateToken, requireRole(['admin', 'manager']), bulkUpdatePrices);

module.exports = router;
