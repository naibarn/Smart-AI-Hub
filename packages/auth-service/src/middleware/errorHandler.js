// src/middleware/errorHandler.js

const { errorResponse } = require('../utils/response');

/**
 * Global Error Handler Middleware
 * Follows FR-6 API Standards specification
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal Server Error';
  let details = null;

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expired';
  }

  // Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
    // Extract validation details if available
    if (err.details) {
      details = err.details;
    }
  }

  // Database Errors
  if (err.code === '23505') { // Unique violation
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'Resource already exists';
  }

  if (err.code === '23503') { // Foreign key violation
    statusCode = 400;
    code = 'FOREIGN_KEY_VIOLATION';
    message = 'Referenced resource does not exist';
  }

  // Prisma Errors
  if (err.code === 'P2023') { // Invalid UUID
    statusCode = 400;
    code = 'INVALID_UUID';
    message = 'Invalid user ID format';
  }

  // Create error response using standard format
  const errorData = {
    code,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  return errorResponse(code, message, res, statusCode, details, req.requestId);
};

/**
 * 404 Not Found Handler
 * Follows FR-6 API Standards specification
 */
const notFoundHandler = (req, res) => {
  return errorResponse(
    'NOT_FOUND',
    'Route not found',
    res,
    404,
    {
      path: req.path,
      method: req.method
    },
    req.requestId
  );
};

module.exports = {
  errorHandler,
  notFoundHandler
};