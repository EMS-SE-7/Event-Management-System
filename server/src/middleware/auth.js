const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Please log in'));
  }

  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Session expired or invalid, please log in again'));
  }

  // Load from DB so deleted users and role changes take effect immediately
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Please log in'));
  }

  req.user = user;
  next();
};

// Roles compare case-insensitively: 'organizer' and 'Organizer' both match
const requireRole = (...roles) => {
  const allowed = roles.map((r) => r.toLowerCase());
  return (req, res, next) => {
    if (!req.user || !allowed.includes(String(req.user.role).toLowerCase())) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to do this'));
    }
    next();
  };
};

// protect and authorizeRoles stay as aliases: those names were promised to teammates
module.exports = { authenticate, requireRole, protect: authenticate, authorizeRoles: requireRole };
