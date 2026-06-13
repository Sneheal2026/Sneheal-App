const { fail } = require('../utils/response');

const errorHandler = (err, _req, res, _next) => {
  if (err.isOperational) {
    return fail(res, err.statusCode, err.message);
  }

  console.error('Unhandled error:', err);
  return fail(res, 500, 'Internal server error');
};

module.exports = errorHandler;
