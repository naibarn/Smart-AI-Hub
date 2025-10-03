import { Request, Response, NextFunction } from 'express';
export interface JWTPayload {
    sub: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
    jti: string;
}
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
/**
 * JWT Authentication Middleware
 *
 * This middleware:
 * 1. Extracts token from Authorization header (Bearer token)
 * 2. Verifies token signature using jwt.verify
 * 3. Attaches user object to req.user = { id, email, role }
 * 4. Calls next() if successful
 *
 * Error handling:
 * - 401 if no token provided
 * - 401 if token is invalid
 * - 401 if token is expired
 */
export declare const authenticateJWT: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional role-based authentication middleware
 * Usage: router.get('/admin', authenticateJWT, requireRole('admin'), adminHandler);
 */
export declare const requireRole: (requiredRole: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map