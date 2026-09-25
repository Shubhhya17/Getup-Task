const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Verify JWT and attach req.user.
 * Expects: Authorization: Bearer <token>
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return next(new AppError('User not found or deactivated', 401));
    }
    req.user = user;
    next();
  } catch (err) {
    next(err); // JsonWebTokenError / TokenExpiredError handled by errorHandler
  }
};

/**
 * Role-based authorization middleware factory.
 * Usage: authorize('admin', 'agent')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not permitted to access this resource`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { authenticate, authorize };
