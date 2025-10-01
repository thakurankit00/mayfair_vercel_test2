const express = require('express');
const { body } = require('express-validator');
const NotificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation rules
const createNotificationValidation = [
  body('user_id')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  body('type')
    .isIn([
      'new-order',
      'order-update', 
      'order-ready',
      'order-cancelled',
      'order-rejected',
      'items-added',
      'order-transfer',
      'kitchen-assignment',
      'payment-received',
      'booking-confirmed',
      'booking-cancelled',
      'system-alert'
    ])
    .withMessage('Invalid notification type'),
  body('title')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('message')
    .isLength({ min: 1 })
    .withMessage('Message is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be a valid JSON object'),
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid ISO 8601 date')
];

// Routes

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of notifications to skip
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return only unread notifications
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *       - in: query
 *         name: include_expired
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include expired notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', NotificationController.getUserNotifications);

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Create a new notification (admin/system use)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - type
 *               - title
 *               - message
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [new-order, order-update, order-ready, order-cancelled, order-rejected, items-added, order-transfer, kitchen-assignment, payment-received, booking-confirmed, booking-cancelled, system-alert]
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', createNotificationValidation, NotificationController.createNotification);

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/unread-count', NotificationController.getUnreadCount);

/**
 * @swagger
 * /api/v1/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/mark-all-read', NotificationController.markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id/read', NotificationController.markAsRead);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', NotificationController.deleteNotification);

/**
 * @swagger
 * /api/v1/notifications:
 *   delete:
 *     summary: Clear all notifications for user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications cleared
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/', NotificationController.clearAllNotifications);

module.exports = router;
