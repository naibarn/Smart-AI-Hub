import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
export declare const connectRBACRedis: () => Promise<void>;
/**
 * Permission-based authorization middleware
 * Checks if user has specific permission for a resource and action
 * Caches result in Redis for 1 hour TTL
 */
export declare const requirePermission: (
  resource: string,
  action: string
) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Role-based authorization middleware
 * Checks if user has one of the specified roles
 */
export declare const requireRoles: (
  roles: string[]
) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Self-access middleware
 * Allows users to access their own resources or admins to access any resource
 */
export declare const requireSelfOrRole: (
  roles: string[]
) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Clear permission cache for a user
 * Useful when roles or permissions are changed
 */
export declare const clearUserPermissionCache: (userId: string) => Promise<void>;
/**
 * Disconnect Redis client (call this when shutting down the application)
 */
export declare const disconnectRBACRedis: () => Promise<void>;
//# sourceMappingURL=rbac.middleware.d.ts.map
