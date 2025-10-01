const express = require('express');
const { getMetrics, getRevenueChart } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticateToken);

// @route   GET /api/v1/dashboard/metrics
// @desc    Get dashboard metrics (role-based)
// @access  Private
router.get('/metrics', getMetrics);

// @route   GET /api/v1/dashboard/revenue-chart
// @desc    Get revenue chart data
// @access  Private (Staff only)
router.get('/revenue-chart', getRevenueChart);

module.exports = router;
