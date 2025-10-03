"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.asyncHandler = exports.errorHandler = void 0;
/**
 * Custom AppError class for consistent error handling
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Global error handler middleware
 */
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    // If it's our custom AppError, use the status code and message
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = error.message;
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    // Log error for debugging
    console.error('Error:', error);
    // Send error response
    res.status(statusCode).json({
        data: null,
        meta: null,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
/**
 * Async error wrapper to catch errors in async routes
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.middleware.js.map