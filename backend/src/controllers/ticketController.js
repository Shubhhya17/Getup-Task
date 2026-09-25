const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { triageTicket, generateEmbedding, cosineSimilarity, generateAgentReply } = require('../services/aiService');
const { buildAttachmentMeta } = require('../middleware/upload');

// ── Visibility helpers ────────────────────────────────────────────────────────

/**
 * Build a MongoDB query filter that enforces visibility rules at the DB layer.
 * Customer  → only their own tickets
 * Agent     → only tickets assigned to them
 * Admin     → all tickets
 */
const visibilityFilter = (user) => {
  switch (user.role) {
    case 'customer':
      return { createdBy: user._id };
    case 'agent':
      return { assignedTo: user._id };
    case 'admin':
      return {};
    default:
      return { _id: null }; // deny everything for unknown roles
  }
};

/**
 * Strip internal comments from a ticket document for non-agent/admin viewers.
 */
const stripInternalComments = (ticket, role) => {
  if (role === 'agent' || role === 'admin') return ticket;
  ticket.comments = ticket.comments.filter((c) => !c.isInternal);
  return ticket;
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/tickets
 */
exports.createTicket = async (req, res, next) => {
  const { title, description, category, priority } = req.body;

  // Build ticket
  const ticketData = {
    title,
    description,
    category: category || 'General',
    priority: priority || 'Medium',
    createdBy: req.user._id,
    activityLog: [
      {
        action: 'TICKET_CREATED',
        performedBy: req.user._id,
        details: `Ticket created by ${req.user.name}`,
      },
    ],
  };

  // File attachment
  if (req.file) {
    ticketData.attachment = buildAttachmentMeta(req.file);
  }

  const ticket = await Ticket.create(ticketData);

  // Generate embedding for the new ticket
  const embedding = await generateEmbedding(`${title} ${description}`);
  ticket.embedding = embedding;

  // Find similar open tickets
  let similarTickets = [];
  if (embedding.length > 0) {
    const openTickets = await Ticket.find({ status: 'Open', _id: { $ne: ticket._id } }).select('title embedding').lean();
    const scored = openTickets
      .map(t => ({ ticketId: t._id, title: t.title, score: cosineSimilarity(embedding, t.embedding || []) }))
      .filter(t => !isNaN(t.score) && t.score > 0.75) // basic threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    similarTickets = scored;
  }

  // AI Triage — runs after ticket is saved so creation never blocks on AI
  const aiResult = await triageTicket(title, description);
  ticket.aiSuggestion = { ...aiResult, similarTickets, generatedAt: new Date() };
  await ticket.save();

  await ticket.populate('createdBy', 'name email role');

  res.status(201).json({
    success: true,
    data: ticket,
  });
};

/**
 * GET /api/tickets
 */
exports.getTickets = async (req, res, next) => {
  const { status, priority, category, search, page = 1, limit = 20 } = req.query;

  const filter = visibilityFilter(req.user);

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  const skip = (page - 1) * limit;
  let tickets = [];
  let total = 0;

  // Semantic search vs Literal search
  if (search) {
    try {
      const searchEmbedding = await generateEmbedding(search);
      if (searchEmbedding && searchEmbedding.length > 0) {
        // Semantic search
        const allFiltered = await Ticket.find(filter).select('-comments -activityLog +embedding').lean();
        const scored = allFiltered
          .map(t => ({ ...t, _score: cosineSimilarity(searchEmbedding, t.embedding || []) }))
          .sort((a, b) => b._score - a._score);
        
        // Literal search fallback in case no good matches
        if (scored.length > 0 && scored[0]._score < 0.6) {
          throw new Error('No good semantic matches, fallback to literal');
        }

        total = scored.length;
        tickets = scored.slice(skip, skip + Number(limit));
        
        // Remove embeddings from response
        tickets.forEach(t => delete t.embedding);
      } else {
        throw new Error('Empty embedding');
      }
    } catch (err) {
      // Literal search fallback
      filter.$text = { $search: search };
      [tickets, total] = await Promise.all([
        Ticket.find(filter)
          .populate('createdBy', 'name email')
          .populate('assignedTo', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .select('-comments -activityLog'),
        Ticket.countDocuments(filter),
      ]);
    }
  } else {
    // Normal query
    [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-comments -activityLog'),
      Ticket.countDocuments(filter),
    ]);
  }

  // Ensure population for semantic search results if needed
  if (search && tickets.length > 0 && !tickets[0].createdBy?.name) {
    await Ticket.populate(tickets, { path: 'createdBy assignedTo', select: 'name email' });
  }

  res.json({
    success: true,
    data: tickets,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * GET /api/tickets/:id
 */
exports.getTicket = async (req, res, next) => {
  const filter = {
    _id: req.params.id,
    ...visibilityFilter(req.user),
  };

  const ticket = await Ticket.findOne(filter)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('comments.author', 'name email role')
    .populate('activityLog.performedBy', 'name email role');

  if (!ticket) {
    return next(new AppError('Ticket not found or access denied', 404));
  }

  // Strip internal notes for customers — enforced here, not in UI
  const ticketObj = ticket.toObject();
  stripInternalComments(ticketObj, req.user.role);

  res.json({ success: true, data: ticketObj });
};

/**
 * PATCH /api/tickets/:id/status
 */
exports.updateTicketStatus = async (req, res, next) => {
  const { status } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return next(new AppError('Ticket not found', 404));

  // Enforce visibility: agents can only update assigned tickets
  if (
    req.user.role === 'agent' &&
    String(ticket.assignedTo) !== String(req.user._id)
  ) {
    return next(new AppError('You can only update tickets assigned to you', 403));
  }

  // Validate state machine transition
  if (!ticket.canTransitionTo(status)) {
    return next(
      new AppError(
        `Cannot transition from "${ticket.status}" to "${status}". Valid next states: ${
          Ticket.VALID_TRANSITIONS[ticket.status].join(', ') || 'none (terminal)'
        }`,
        400
      )
    );
  }

  const prevStatus = ticket.status;
  ticket.status = status;

  if (status === 'Resolved') {
    ticket.resolvedAt = new Date();
  }

  ticket.activityLog.push({
    action: 'STATUS_CHANGED',
    performedBy: req.user._id,
    details: `Status changed from "${prevStatus}" to "${status}"`,
  });

  await ticket.save();
  await ticket.populate('createdBy assignedTo', 'name email');

  res.json({ success: true, data: ticket });
};

/**
 * PATCH /api/tickets/:id/assign  (admin only — enforced on router)
 */
exports.assignTicket = async (req, res, next) => {
  const { agentId } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return next(new AppError('Ticket not found', 404));

  let agentName = 'Unassigned';
  if (agentId) {
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'agent') {
      return next(new AppError('Invalid agent ID or user is not an agent', 400));
    }
    agentName = agent.name;
  }

  const prevAgent = ticket.assignedTo;
  ticket.assignedTo = agentId || null;

  ticket.activityLog.push({
    action: 'ASSIGNED',
    performedBy: req.user._id,
    details: agentId
      ? `Assigned to ${agentName}`
      : `Unassigned (previously ${prevAgent || 'unassigned'})`,
  });

  await ticket.save();
  await ticket.populate('createdBy assignedTo', 'name email');

  res.json({ success: true, data: ticket });
};

/**
 * POST /api/tickets/:id/comments
 */
exports.addComment = async (req, res, next) => {
  const { body: commentBody, isInternal = false } = req.body;

  // Only agents/admins can post internal notes
  if (isInternal && req.user.role === 'customer') {
    return next(new AppError('Customers cannot post internal notes', 403));
  }

  const filter = {
    _id: req.params.id,
    ...visibilityFilter(req.user),
  };

  const ticket = await Ticket.findOne(filter);
  if (!ticket) return next(new AppError('Ticket not found or access denied', 404));

  const comment = {
    author: req.user._id,
    body: commentBody,
    isInternal,
  };

  ticket.comments.push(comment);
  ticket.activityLog.push({
    action: isInternal ? 'INTERNAL_NOTE_ADDED' : 'COMMENT_ADDED',
    performedBy: req.user._id,
    details: isInternal ? 'Internal note added' : 'Public comment added',
  });

  await ticket.save();
  await ticket.populate('comments.author', 'name email role');

  // Return only the comments visible to this user
  const ticketObj = ticket.toObject();
  stripInternalComments(ticketObj, req.user.role);

  res.status(201).json({ success: true, data: ticketObj.comments });
};

/**
 * GET /api/tickets/:id/activity
 */
exports.getActivityLog = async (req, res, next) => {
  const filter = {
    _id: req.params.id,
    ...visibilityFilter(req.user),
  };

  const ticket = await Ticket.findOne(filter)
    .select('activityLog')
    .populate('activityLog.performedBy', 'name email role');

  if (!ticket) return next(new AppError('Ticket not found or access denied', 404));

  res.json({ success: true, data: ticket.activityLog });
};

/**
 * POST /api/tickets/:id/ai-suggestion/accept
 * Agent explicitly applies AI-suggested values to the ticket's official fields.
 */
exports.acceptAiSuggestion = async (req, res, next) => {
  const { category, priority } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return next(new AppError('Ticket not found', 404));

  if (!ticket.aiSuggestion) {
    return next(new AppError('No AI suggestion available for this ticket', 400));
  }

  // Apply only the fields the agent chose to accept
  if (category) ticket.category = category;
  if (priority) ticket.priority = priority;

  ticket.activityLog.push({
    action: 'AI_SUGGESTION_ACCEPTED',
    performedBy: req.user._id,
    details: `AI suggestion accepted: category="${category || 'unchanged'}", priority="${priority || 'unchanged'}"`,
  });

  await ticket.save();

  res.json({ success: true, data: ticket });
};

/**
 * POST /api/tickets/:id/ai-reply
 * Generates an agent reply based on tone
 */
exports.generateAgentReplyAssist = async (req, res, next) => {
  const { tone } = req.body; // e.g., 'concise', 'empathetic', 'professional'

  const ticket = await Ticket.findById(req.params.id)
    .populate('comments.author', 'name email role');
  if (!ticket) return next(new AppError('Ticket not found', 404));

  const { reply } = await generateAgentReply(ticket, ticket.comments, tone);

  res.json({ success: true, data: { draftReply: reply } });
};
