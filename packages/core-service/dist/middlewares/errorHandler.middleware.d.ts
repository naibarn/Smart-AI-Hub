import { Request, Response, NextFunction } from 'express';
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
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
/**
 * Async error wrapper to catch errors in async routes
 */
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.middleware.d.ts.map