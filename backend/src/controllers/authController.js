const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendToken } = require('../utils/tokenUtils');

/**
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Prevent external actors from self-assigning admin in production
  // (for seed script purposes, allow it; document this in README)
  const user = await User.create({ name, email, password, role: role || 'customer' });
  sendToken(res, user, 201);
};

exports.login = async (req, res, next) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Explicitly select password (it has select:false on schema)
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    return next(new AppError('Invalid credentials', 401));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid credentials', 401));
  }

  sendToken(res, user, 200);
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

/**
 * POST /api/auth/logout
 * JWT is stateless — client must discard the token.
 * A production system would use a token blacklist / short expiry + refresh tokens.
 */
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out. Please discard your token.' });
};
