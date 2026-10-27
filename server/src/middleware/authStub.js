const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// TEMPORARY stand-in for Shaurya's middleware/auth.js.
// It has the same two exports (authenticate, requireRole), so when his file is
// merged we only change the require path in routes/events.routes.js and delete this file.
//
// By default every request is an organizer with a fixed id.
// Tests can pretend to be someone else with these headers:
//   x-stub-role: organizer | student | none   ("none" = not logged in)
//   x-stub-user-id: <24 character ObjectId>
const DEFAULT_USER_ID = '000000000000000000000001';

function authenticate(req, res, next) {
  const role = req.get('x-stub-role') || 'organizer';
  if (role === 'none') {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Please log in'));
  }
  const id = req.get('x-stub-user-id') || DEFAULT_USER_ID;
  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Please log in'));
  }
  req.user = { id, role, name: `Stub ${role}` };
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to do this'));
    }
    next();
  };
}

module.exports = { authenticate, requireRole, DEFAULT_USER_ID };
