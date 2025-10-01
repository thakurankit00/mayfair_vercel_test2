const express = require('express');
const { 
  getReservationReports,
  getFrontOfficeReports,
  getBackOfficeReports,
  getAuditReports,
  getStatisticalReports,
  getChartsReports
} = require('../controllers/reportsController');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// All reports routes require authentication and manager/admin role
router.use(authenticateToken);
router.use(requireManager);

/**
 * @swagger
 * /api/v1/reports/reservation:
 *   get:
 *     summary: Get reservation reports data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subSection
 *         schema:
 *           type: string
 *           enum: [new-reservations, cancelled-reservations, modified-reservations, no-show-reports, confirmed-reservations]
 *         description: Sub-section of reservation reports
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: Date range filter
 *       - in: query
 *         name: roomType
 *         schema:
 *           type: string
 *         description: Room type filter
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Company filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Status filter
 *     responses:
 *       200:
 *         description: Reservation reports data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager/Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/reservation', getReservationReports);

/**
 * @swagger
 * /api/v1/reports/front-office:
 *   get:
 *     summary: Get front office reports data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subSection
 *         schema:
 *           type: string
 *           enum: [check-in-reports, check-out-reports, occupancy-reports, guest-folio, room-status-reports]
 *         description: Sub-section of front office reports
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: Date range filter
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department filter
 *       - in: query
 *         name: shift
 *         schema:
 *           type: string
 *         description: Shift filter
 *       - in: query
 *         name: employee
 *         schema:
 *           type: string
 *         description: Employee filter
 *     responses:
 *       200:
 *         description: Front office reports data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager/Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/front-office', getFrontOfficeReports);

/**
 * @swagger
 * /api/v1/reports/back-office:
 *   get:
 *     summary: Get back office reports data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subSection
 *         schema:
 *           type: string
 *           enum: [housekeeping-reports, maintenance-reports, laundry-reports, security-reports, inventory-reports]
 *         description: Sub-section of back office reports
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: Date range filter
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category filter
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Status filter
 *     responses:
 *       200:
 *         description: Back office reports data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager/Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/back-office', getBackOfficeReports);

/**
 * @swagger
 * /api/v1/reports/audit:
 *   get:
 *     summary: Get audit reports data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subSection
 *         schema:
 *           type: string
 *           enum: [financial-audits, operational-audits, safety-audits, quality-audits, compliance-audits]
 *         description: Sub-section of audit reports
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: Date range filter
 *       - in: query
 *         name: auditType
 *         schema:
 *           type: string
 *         description: Audit type filter
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department filter
 *       - in: query
 *         name: auditor
 *         schema:
 *           type: string
 *         description: Auditor filter
 *     responses:
 *       200:
 *         description: Audit reports data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager/Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/audit', getAuditReports);

/**
 * @swagger
 * /api/v1/reports/statistical:
 *   get:
 *     summary: Get statistical reports data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subSection
 *         schema:
 *           type: string
 *           enum: [revenue-analytics, occupancy-statistics, guest-satisfaction, operational-efficiency, cost-analysis]
 *         description: Sub-section of statistical reports
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: Date range filter
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *         description: Metric filter
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period filter
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category filter
 *     responses:
 *       200:
 *         description: Statistical reports data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager/Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/statistical', getStatisticalReports);

/**
 * @swagger
 * /api/v1/reports/charts:
 *   get:
 *     summary: Get graphs and charts reports data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subSection
 *         schema:
 *           type: string
 *           enum: [revenue-charts, occupancy-graphs, performance-dashboards, trend-analysis, comparative-reports]
 *         description: Sub-section of charts reports
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: Date range filter
 *       - in: query
 *         name: chartType
 *         schema:
 *           type: string
 *         description: Chart type filter
 *       - in: query
 *         name: dataSource
 *         schema:
 *           type: string
 *         description: Data source filter
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *         description: Timeframe filter
 *     responses:
 *       200:
 *         description: Charts reports data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager/Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/charts', getChartsReports);

module.exports = router;
