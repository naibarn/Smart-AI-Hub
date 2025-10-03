import { Request, Response, NextFunction } from 'express';
/**
 * Custom AppError class for consistent error handling
 */
declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
/**
 * Global error handler middleware
 */
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
/**
 * Async error wrapper to catch errors in async routes
 */
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export { AppError };
//# sourceMappingURL=errorHandler.middleware.d.ts.map