"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = void 0;
const shared_1 = require("@smart-ai-hub/shared");
const response_1 = require("../utils/response");
/**
 * Global error handler middleware
 * Follows FR-6 API Standards specification
 */
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal Server Error';
    let details = null;
    // If it's our custom AppError, use the status code and message
    if (error instanceof shared_1.AppError) {
        statusCode = error.statusCode;
        code = error.name || 'APP_ERROR';
        message = error.message;
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = error.message;
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        code = 'INVALID_ID_FORMAT';
        message = 'Invalid ID format';
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid token';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Token expired';
    }
    // Handle Prisma errors
    if (error.code === 'P2025') {
        statusCode = 404;
        code = 'RECORD_NOT_FOUND';
        message = 'Record not found';
    }
    if (error.code === 'P2002') {
        statusCode = 409;
        code = 'DUPLICATE_RECORD';
        message = 'Record already exists';
    }
    // Log error for debugging
    console.error('Error:', {
        code,
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
    });
    // Create error details if in development
    if (process.env.NODE_ENV === 'development') {
        details = {
            stack: error.stack,
            originalError: error.name,
        };
    }
    // Send standardized error response
    (0, response_1.errorResponse)(code, message, res, statusCode, details, req.requestId);
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
// AppError is now imported from shared package
//# sourceMappingURL=errorHandler.middleware.js.map