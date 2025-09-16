const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware
const { authenticateToken, requireRole } = require('../middleware/auth');

// Controllers
const {
  createPaymentIntent,
  getPaymentForm,
  handleSuccessCallback,
  handleFailureCallback,
  getPaymentStatus,
  getPaymentHistory,
  verifyPayment
} = require('../controllers/paymentController');

// ============================================================================
// PAYMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /api/v1/payments/create-intent:
 *   post:
 *     summary: Create payment intent for order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *               - customerName
 *               - customerEmail
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               customerName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *                 format: email
 *               customerPhone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Order not found
 */
router.post('/create-intent', authenticateToken, createPaymentIntent);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/form:
 *   get:
 *     summary: Get PayU payment form HTML
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment form HTML
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Payment not found
 */
router.get('/:paymentId/form', authenticateToken, getPaymentForm);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/status:
 *   get:
 *     summary: Get payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       404:
 *         description: Payment not found
 */
router.get('/:paymentId/status', authenticateToken, getPaymentStatus);

/**
 * @swagger
 * /api/v1/payments/history:
 *   get:
 *     summary: Get payment history for user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 */
router.get('/history', authenticateToken, getPaymentHistory);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/verify:
 *   post:
 *     summary: Verify payment with PayU
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment verification result
 *       404:
 *         description: Payment not found
 */
router.post('/:paymentId/verify', authenticateToken, verifyPayment);

// ============================================================================
// PAYU CALLBACK ROUTES (No authentication required)
// ============================================================================

/**
 * @swagger
 * /api/v1/payments/callback/success:
 *   post:
 *     summary: Handle PayU success callback
 *     tags: [Payments]
 *     description: This endpoint is called by PayU after successful payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *     responses:
 *       302:
 *         description: Redirect to success page
 */
router.post('/callback/success', handleSuccessCallback);

/**
 * @swagger
 * /api/v1/payments/callback/failure:
 *   post:
 *     summary: Handle PayU failure callback
 *     tags: [Payments]
 *     description: This endpoint is called by PayU after failed payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *     responses:
 *       302:
 *         description: Redirect to failure page
 */
router.post('/callback/failure', handleFailureCallback);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * @swagger
 * /api/v1/payments/admin/all:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Payments, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: All payments retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/admin/all', 
  authenticateToken, 
  requireRole(['admin', 'manager']), 
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;

      let query = db('payments')
        .select(
          'payments.*',
          'orders.order_number',
          'orders.status as order_status',
          'users.first_name',
          'users.last_name',
          'users.email'
        )
        .join('orders', 'payments.order_id', 'orders.id')
        .join('users', 'payments.user_id', 'users.id')
        .orderBy('payments.created_at', 'desc');

      if (status) query = query.where('payments.status', status);
      if (dateFrom) query = query.where('payments.created_at', '>=', dateFrom);
      if (dateTo) query = query.where('payments.created_at', '<=', dateTo + ' 23:59:59');

      const offset = (page - 1) * limit;
      const payments = await query.limit(limit).offset(offset);

      const totalCount = await db('payments')
        .modify((builder) => {
          if (status) builder.where('status', status);
          if (dateFrom) builder.where('created_at', '>=', dateFrom);
          if (dateTo) builder.where('created_at', '<=', dateTo + ' 23:59:59');
        })
        .count('* as count')
        .first();

      return res.status(200).json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(totalCount.count),
            pages: Math.ceil(totalCount.count / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ [PAYMENT] Admin get all error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get payments'
        }
      });
    }
  }
);

module.exports = router;
