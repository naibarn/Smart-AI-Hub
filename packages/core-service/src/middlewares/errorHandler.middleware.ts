import { Request, Response, NextFunction } from 'express';
import { AppError } from '@smart-ai-hub/shared';
import { AuthenticatedRequest } from './auth.middleware';
import { errorResponse } from '../utils/response';

/**
 * Extend Express Request interface to include requestId
 */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Global error handler middleware
 * Follows FR-6 API Standards specification
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal Server Error';
  let details = null;

  // If it's our custom AppError, use the status code and message
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.name || 'APP_ERROR';
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = error.message;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID_FORMAT';
    message = 'Invalid ID format';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expired';
  }

  // Handle Prisma errors
  if ((error as any).code === 'P2025') {
    statusCode = 404;
    code = 'RECORD_NOT_FOUND';
    message = 'Record not found';
  }

  if ((error as any).code === 'P2002') {
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
  errorResponse(code, message, res, statusCode, details, req.requestId);
};

/**
 * Async error wrapper to catch errors in async routes
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// AppError is now imported from shared package
