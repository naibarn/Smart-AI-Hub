import { Request, Response, NextFunction } from 'express';
import { AppError } from '@smart-ai-hub/shared';
import { Prisma } from '@prisma/client';

/**
 * Handle Prisma errors and convert them to AppError
 */
export const handlePrismaError = (error: any): AppError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = (error.meta?.target as string[]) || [];
        const field = target.join(', ');
        return new AppError(`Duplicate entry: ${field} already exists`, 409);
      }

      case 'P2025':
        // Record not found
        return new AppError('Record not found', 404);

      case 'P2003':
        // Foreign key constraint violation
        return new AppError('Referenced record does not exist', 400);

      case 'P2014':
        // Relation violation
        return new AppError('Cannot delete or update a referenced record', 400);

      case 'P2000':
        // Value too long
        return new AppError('Provided value is too long', 400);

      case 'P2001':
        // Record does not exist
        return new AppError('Record does not exist', 404);

      case 'P2012':
        // Missing a required value
        return new AppError('Missing a required value', 400);

      case 'P2013':
        // Missing a required argument
        return new AppError('Missing a required argument', 400);

      default:
        return new AppError('Database operation failed', 500);
    }
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return new AppError('Unknown database error', 500);
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new AppError('Database engine panic', 500);
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError('Database connection failed', 500);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError('Invalid database query', 400);
  }

  return new AppError('An unexpected error occurred', 500);
};

/**
 * Handle validation errors and format them consistently
 */
export const handleValidationError = (errors: any[]): AppError => {
  const formattedErrors = errors.map((error) => ({
    field: error.field || 'unknown',
    message: error.message || 'Validation error',
    code: error.code || 'VALIDATION_ERROR',
  }));

  const error = new AppError('Validation failed', 400);
  return error;
};

/**
 * Handle JWT errors
 */
export const handleJWTError = (error: any): AppError => {
  if (error.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401);
  } else if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401);
  } else if (error.name === 'NotBeforeError') {
    return new AppError('Token not active', 401);
  }

  return new AppError('Authentication error', 401);
};

/**
 * Handle Redis errors
 */
export const handleRedisError = (error: any): AppError => {
  console.error('Redis error:', error);
  // Return a generic error since Redis failures shouldn't crash the application
  return new AppError('Cache service unavailable', 500);
};

/**
 * Handle file upload errors
 */
export const handleFileUploadError = (error: any): AppError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File size too large', 400);
  } else if (error.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files', 400);
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field', 400);
  }

  return new AppError('File upload failed', 400);
};

/**
 * Handle rate limiting errors
 */
export const handleRateLimitError = (error: any): AppError => {
  return new AppError('Too many requests, please try again later', 429);
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let err = error;

  // Convert non-AppError to AppError
  if (!(error instanceof AppError)) {
    // Handle specific error types
    if (
      error.name === 'PrismaClientKnownRequestError' ||
      error.name === 'PrismaClientUnknownRequestError' ||
      error.name === 'PrismaClientRustPanicError' ||
      error.name === 'PrismaClientInitializationError' ||
      error.name === 'PrismaClientValidationError'
    ) {
      err = handlePrismaError(error);
    } else if (error.name && error.name.includes('JsonWebToken')) {
      err = handleJWTError(error);
    } else if (error.code && error.code.toString().startsWith('LIMIT_')) {
      err = handleFileUploadError(error);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      err = new AppError('Service unavailable', 503);
    } else if (error.type === 'entity.too.large') {
      err = new AppError('Request entity too large', 413);
    } else if (error.type === 'entity.parse.failed') {
      err = new AppError('Invalid JSON', 400);
    } else {
      // Generic error
      const statusCode = error.statusCode || error.status || 500;
      const message = error.message || 'Internal server error';
      err = new AppError(message, statusCode);
    }
  }

  // Log error
  console.error('Error:', {
    message: err.message,
    statusCode: err.statusCode,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Send error response
  const response: any = {
    success: false,
    error: err.message,
    statusCode: err.statusCode,
  };

  // Include validation errors if available
  if (err.statusCode === 400 && error.validationErrors) {
    response.validationErrors = error.validationErrors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(err.statusCode).json(response);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create a standardized error response
 */
export const createErrorResponse = (
  error: string,
  statusCode: number = 500,
  validationErrors?: any[]
) => {
  return {
    success: false,
    error,
    statusCode,
    validationErrors,
  };
};

/**
 * Create a standardized success response
 */
export const createSuccessResponse = (data: any, message?: string) => {
  return {
    success: true,
    data,
    message,
  };
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejections = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't crash the server, just log the error
  });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtExceptions = (): void => {
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    // Graceful shutdown
    process.exit(1);
  });
};
