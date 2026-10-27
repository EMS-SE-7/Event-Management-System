const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// Shared error format for every module (team agreement section 8).
// Mount it last in index.js, after all routers.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { code: err.code, message: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json({ error: body });
  }

  // Mongoose schema rules failed: 400 with one message per field
  if (err instanceof mongoose.Error.ValidationError) {
    const details = {};
    for (const [field, fieldError] of Object.entries(err.errors)) {
      details[field] = fieldError.kind === 'CastError' ? `${field} has an invalid value` : fieldError.message;
    }
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Some fields are missing or invalid', details },
    });
  }

  // An id that is not a valid ObjectId is treated as "not found"
  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  }

  // Body that is not valid JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON' } });
  }

  console.error(err);
  return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong' } });
}

module.exports = errorHandler;
