class AppError extends Error {
  constructor(statusCode, message) {
    let code = statusCode;
    let msg = message;
    if (typeof statusCode === 'string' && typeof message === 'number') {
      code = message;
      msg = statusCode;
    }
    super(msg);
    this.statusCode = code;
    this.isOperational = true;
  }
}

module.exports = AppError;
