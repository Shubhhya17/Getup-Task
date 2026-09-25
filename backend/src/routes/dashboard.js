const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

const router = express.Router();

router.use(authenticate, authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin analytics dashboard
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (admin only)
 *     tags: [Dashboard]
 *     description: |
 *       Returns aggregated stats via MongoDB pipelines:
 *       - Ticket counts by status and priority
 *       - Average time-to-resolution
 *       - Tickets open > 48 hours with no resolution
 *     responses:
 *       200:
 *         description: Dashboard stats object
 *       403:
 *         description: Admin only
 */
router.get('/stats', getDashboardStats);

module.exports = router;
