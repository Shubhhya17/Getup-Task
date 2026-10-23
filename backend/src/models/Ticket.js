const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     AiSuggestion:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High, Critical]
 *         summary:
 *           type: string
 *         draftReply:
 *           type: string
 *         fallback:
 *           type: boolean
 *           description: true if AI call failed and a mock response was used
 *         generatedAt:
 *           type: string
 *           format: date-time
 *
 *     Attachment:
 *       type: object
 *       properties:
 *         originalName:
 *           type: string
 *         storedName:
 *           type: string
 *         path:
 *           type: string
 *         mimeType:
 *           type: string
 *         size:
 *           type: number
 *
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         author:
 *           type: string
 *         body:
 *           type: string
 *         isInternal:
 *           type: boolean
 *           description: Internal notes visible only to agents/admins
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ActivityLog:
 *       type: object
 *       properties:
 *         action:
 *           type: string
 *         performedBy:
 *           type: string
 *         details:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *
 *     Ticket:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [General, Technical, Billing, Sales, Other]
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High, Critical]
 *         status:
 *           type: string
 *           enum: [Open, In Progress, Resolved, Closed]
 *         createdBy:
 *           type: string
 *         assignedTo:
 *           type: string
 *           nullable: true
 *         attachment:
 *           $ref: '#/components/schemas/Attachment'
 *         aiSuggestion:
 *           $ref: '#/components/schemas/AiSuggestion'
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Status transition rules — no skipping or reversing
const VALID_TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed'],
  Closed: [], // terminal state
};

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    // path is the relative path from UPLOAD_DIR — swapping to S3 key later is trivial
    path: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number }, // bytes
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      maxlength: [5000, 'Comment too long'],
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const activitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g. "STATUS_CHANGED", "ASSIGNED", "COMMENT_ADDED"
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    details: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const aiSuggestionSchema = new mongoose.Schema(
  {
    category: { type: String },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
    summary: { type: String },
    draftReply: { type: String },
    fallback: { type: Boolean, default: false },
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [10000, 'Description too long'],
    },
    category: {
      type: String,
      enum: ['General', 'Technical', 'Billing', 'Sales', 'Other'],
      default: 'General',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    attachment: {
      type: attachmentSchema,
      default: null,
    },
    // AI-suggested values — NEVER silently overwrites customer fields
    aiSuggestion: {
      type: aiSuggestionSchema,
      default: null,
    },
    comments: [commentSchema],
    activityLog: [activitySchema],
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ title: 'text', description: 'text' });

// Validate status transitions
ticketSchema.methods.canTransitionTo = function (newStatus) {
  const allowed = VALID_TRANSITIONS[this.status] || [];
  return allowed.includes(newStatus);
};

// Export valid transitions for use elsewhere
ticketSchema.statics.VALID_TRANSITIONS = VALID_TRANSITIONS;

module.exports = mongoose.model('Ticket', ticketSchema);
