import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Middleware to check if user has specific permission
 */
export const requirePermission = (resource: string, action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource.',
      });
      return;
    }

    // For now, we'll implement a simple check
    // In a real implementation, you would check against a database or cache
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      next();
      return;
    }

    res.status(403).json({
      error: 'Insufficient permissions',
      message: `You need ${resource}:${action} permission to access this resource.`,
    });
  };
};

/**
 * Middleware to check if user has specific role
 */
export const requireRoles = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `You need one of these roles: ${roles.join(', ')} to access this resource.`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is accessing their own resources or has specific role
 */
export const requireSelfOrRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource.',
      });
      return;
    }

    // Check if user is accessing their own resources
    const targetUserId = req.params.userId || req.params.id;
    if (targetUserId === req.user.id) {
      next();
      return;
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `You can only access your own resources or need one of these roles: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
