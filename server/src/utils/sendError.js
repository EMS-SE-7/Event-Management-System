// Sends an error in the shared format { error: { code, message } } (team agreement section 8),
// for controllers that answer with res.status() instead of throwing an AppError.
function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

module.exports = sendError;
