const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const {
  createTicket,
  getTickets,
  getTicket,
  updateTicketStatus,
  assignTicket,
  addComment,
  getActivityLog,
  acceptAiSuggestion,
} = require('../controllers/ticketController');

const router = express.Router();

// All ticket routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management endpoints
 */

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Create a new support ticket
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [General, Technical, Billing, Sales, Other]
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Critical]
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Ticket created, includes aiSuggestion field
 */
router.post(
  '/',
  authorize('customer', 'agent', 'admin'),
  upload.single('attachment'),
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category')
      .optional()
      .isIn(['General', 'Technical', 'Billing', 'Sales', 'Other'])
      .withMessage('Invalid category'),
    body('priority')
      .optional()
      .isIn(['Low', 'Medium', 'High', 'Critical'])
      .withMessage('Invalid priority'),
  ],
  validate,
  createTicket
);

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: List tickets (visibility enforced by role)
 *     tags: [Tickets]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Open, "In Progress", Resolved, Closed]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High, Critical]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Keyword search in title/description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of tickets
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status')
      .optional()
      .isIn(['Open', 'In Progress', 'Resolved', 'Closed']),
    query('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  ],
  validate,
  getTickets
);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get a single ticket by ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket details (internal notes filtered by role)
 *       403:
 *         description: Not permitted to view this ticket
 *       404:
 *         description: Ticket not found
 */
router.get('/:id', getTicket);

/**
 * @swagger
 * /api/tickets/{id}/status:
 *   patch:
 *     summary: Update ticket status (strict workflow enforced)
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Open, "In Progress", Resolved, Closed]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status transition
 */
router.patch(
  '/:id/status',
  authorize('agent', 'admin'),
  [
    body('status')
      .isIn(['Open', 'In Progress', 'Resolved', 'Closed'])
      .withMessage('Invalid status'),
  ],
  validate,
  updateTicketStatus
);

/**
 * @swagger
 * /api/tickets/{id}/assign:
 *   patch:
 *     summary: Assign/reassign ticket to an agent (admin only)
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId:
 *                 type: string
 *                 description: Agent user ID, or null to unassign
 *     responses:
 *       200:
 *         description: Ticket assigned
 *       403:
 *         description: Admin only
 */
router.patch(
  '/:id/assign',
  authorize('admin'),
  [
    body('agentId')
      .optional({ nullable: true })
      .isMongoId()
      .withMessage('Invalid agent ID'),
  ],
  validate,
  assignTicket
);

/**
 * @swagger
 * /api/tickets/{id}/comments:
 *   post:
 *     summary: Add a comment or internal note to a ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body:
 *                 type: string
 *               isInternal:
 *                 type: boolean
 *                 description: If true, only agents/admins can see this note
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post(
  '/:id/comments',
  [
    body('body').trim().notEmpty().withMessage('Comment body is required'),
    body('isInternal').optional().isBoolean().toBoolean(),
  ],
  validate,
  addComment
);

/**
 * @swagger
 * /api/tickets/{id}/activity:
 *   get:
 *     summary: Get the activity log for a ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity log entries
 */
router.get('/:id/activity', getActivityLog);

/**
 * @swagger
 * /api/tickets/{id}/ai-suggestion/accept:
 *   post:
 *     summary: Agent accepts AI suggestion (updates ticket category/priority)
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI suggestion accepted and applied
 */
router.post(
  '/:id/ai-suggestion/accept',
  authorize('agent', 'admin'),
  [
    body('category')
      .optional()
      .isIn(['General', 'Technical', 'Billing', 'Sales', 'Other']),
    body('priority')
      .optional()
      .isIn(['Low', 'Medium', 'High', 'Critical']),
  ],
  validate,
  acceptAiSuggestion
);

module.exports = router;
