// Errors that controllers throw on purpose. errorHandler turns them into
// { error: { code, message, details } } (team agreement section 8).
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

module.exports = AppError;
