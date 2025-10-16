import { Request, Response, NextFunction } from 'express';
export declare const connectAuthRedis: () => Promise<void>;
export interface JWTPayload {
    sub: string;
    email: string;
    roles: string[];
    permissions: string[];
    iat: number;
    exp: number;
    jti: string;
}
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        roles: Array<{
            name: string;
        }>;
        permissions?: string[];
    };
}
/**
 * JWT Authentication Middleware
 *
 * This middleware:
 * 1. Extracts token from Authorization header (Bearer token)
 * 2. Verifies token signature using jwt.verify
 * 3. Checks if token is not in blacklist (Redis)
 * 4. Attaches user object to req.user = { id, email, role }
 * 5. Calls next() if successful
 *
 * Error handling:
 * - 401 if no token provided
 * - 401 if token is invalid
 * - 401 if token is expired
 * - 401 if token is revoked (in blacklist)
 */
export declare const authenticateJWT: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional role-based authentication middleware
 * Usage: router.get('/admin', authenticateJWT, requireRole('admin'), adminHandler);
 */
export declare const requireRole: (requiredRole: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Service authentication middleware for internal service-to-service communication
 */
export declare const authenticateService: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Disconnect Redis client (call this when shutting down the application)
 */
export declare const disconnectAuthRedis: () => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map