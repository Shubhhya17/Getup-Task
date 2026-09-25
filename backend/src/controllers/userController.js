const User = require('../models/User');

/**
 * GET /api/users/agents
 * Returns all users with role=agent for the assignment dropdown.
 */
exports.getAgents = async (req, res) => {
  const agents = await User.find({ role: 'agent', isActive: true }).select('name email role');
  res.json({ success: true, data: agents });
};

/**
 * GET /api/users
 * Returns all users (admin management view).
 */
exports.getUsers = async (req, res) => {
  const users = await User.find().select('name email role isActive createdAt');
  res.json({ success: true, data: users });
};
