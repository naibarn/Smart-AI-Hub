/**
 * Custom AppError class for consistent error handling across the application
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Custom ValidationError class for validation-specific errors
 */
export class ValidationError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a new AppError with 400 status code (Bad Request)
 */
export const createBadRequestError = (message: string): AppError => {
  return new AppError(message, 400);
};

/**
 * Create a new AppError with 401 status code (Unauthorized)
 */
export const createUnauthorizedError = (message: string): AppError => {
  return new AppError(message, 401);
};

/**
 * Create a new AppError with 403 status code (Forbidden)
 */
export const createForbiddenError = (message: string): AppError => {
  return new AppError(message, 403);
};

/**
 * Create a new AppError with 404 status code (Not Found)
 */
export const createNotFoundError = (message: string): AppError => {
  return new AppError(message, 404);
};

/**
 * Create a new AppError with 409 status code (Conflict)
 */
export const createConflictError = (message: string): AppError => {
  return new AppError(message, 409);
};

/**
 * Create a new AppError with 500 status code (Internal Server Error)
 */
export const createInternalServerError = (message: string): AppError => {
  return new AppError(message, 500);
};
