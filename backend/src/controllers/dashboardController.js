const Ticket = require('../models/Ticket');
const { generateQueueSummary } = require('../services/aiService');

/**
 * GET /api/dashboard/stats
 * All aggregations run in MongoDB — no client-side loops.
 */
exports.getDashboardStats = async (req, res) => {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [
    byStatus,
    byPriority,
    resolutionTime,
    stalledTickets,
  ] = await Promise.all([
    // 1. Ticket counts grouped by status
    Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]),

    // 2. Ticket counts grouped by priority
    Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $project: { priority: '$_id', count: 1, _id: 0 } },
    ]),

    // 3. Average time-to-resolution (ms) for Resolved + Closed tickets
    Ticket.aggregate([
      {
        $match: {
          status: { $in: ['Resolved', 'Closed'] },
          resolvedAt: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          resolutionMs: { $subtract: ['$resolvedAt', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgResolutionMs: { $avg: '$resolutionMs' },
          minResolutionMs: { $min: '$resolutionMs' },
          maxResolutionMs: { $max: '$resolutionMs' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          avgResolutionHours: { $divide: ['$avgResolutionMs', 3600000] },
          minResolutionHours: { $divide: ['$minResolutionMs', 3600000] },
          maxResolutionHours: { $divide: ['$maxResolutionMs', 3600000] },
          resolvedTicketCount: '$count',
        },
      },
    ]),

    // 4. Tickets open > 48 hrs with no resolution
    Ticket.aggregate([
      {
        $match: {
          status: { $in: ['Open', 'In Progress'] },
          createdAt: { $lte: fortyEightHoursAgo },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'agent',
        },
      },
      {
        $project: {
          title: 1,
          status: 1,
          priority: 1,
          createdAt: 1,
          ageHours: {
            $divide: [{ $subtract: [new Date(), '$createdAt'] }, 3600000],
          },
          creatorName: { $arrayElemAt: ['$creator.name', 0] },
          agentName: { $arrayElemAt: ['$agent.name', 0] },
        },
      },
      { $sort: { createdAt: 1 } },
    ]),
  ]);

  const statsData = {
    byStatus,
    byPriority,
    resolutionTime: resolutionTime[0] || {
      avgResolutionHours: null,
      minResolutionHours: null,
      maxResolutionHours: null,
      resolvedTicketCount: 0,
    },
    stalledTickets: {
      count: stalledTickets.length,
      tickets: stalledTickets,
    },
  };

  const { summary: aiSummary } = await generateQueueSummary(statsData);
  statsData.aiSummary = aiSummary;

  res.json({
    success: true,
    data: statsData,
  });
};
