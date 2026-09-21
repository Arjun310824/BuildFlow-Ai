/**
 * Middleware to handle requests to non-existent endpoints (404)
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle Mongoose CastError (e.g. malformed ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field "${err.path}": ${err.value}`;
  }

  // Handle Mongoose Schema Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => e.message);
  }

  // Handle JSON parsing syntax errors in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON syntax in request body';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
