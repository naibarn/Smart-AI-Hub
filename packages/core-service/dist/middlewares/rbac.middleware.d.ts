import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
/**
 * Middleware to check if user has specific permission
 */
export declare const requirePermission: (resource: string, action: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if user has specific role
 */
export declare const requireRoles: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if user is accessing their own resources or has specific role
 */
export declare const requireSelfOrRole: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rbac.middleware.d.ts.map