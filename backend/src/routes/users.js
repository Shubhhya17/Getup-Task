const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getAgents, getUsers } = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users/agents:
 *   get:
 *     summary: Get list of agents (admin only, used for assignment)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of agents
 *       403:
 *         description: Admin only
 */
router.get('/agents', authorize('admin'), getAgents);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Admin only
 */
router.get('/', authorize('admin'), getUsers);

module.exports = router;
