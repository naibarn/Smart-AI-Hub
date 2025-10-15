import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { hasPermission } from '../services/permission.service';

/**
 * Middleware to check if user has specific permission
 */
export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource.',
      });
      return;
    }

    try {
      // Check if user has the required permission
      const userHasPermission = await hasPermission(req.user.id, resource, action);
      
      if (userHasPermission) {
        next();
        return;
      }

      res.status(403).json({
        error: 'Insufficient permissions',
        message: `You need ${resource}:${action} permission to access this resource.`,
      });
    } catch (error) {
      console.error('Error checking permission:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify permissions.',
      });
    }
  };
};

/**
 * Middleware to check if user has specific role
 */
export const requireRoles = (roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource.',
      });
      return;
    }

    try {
      // Get user's roles from the request or fetch from service
      const userRoles = req.user.roles || [];
      
      // Check if user has any of the required roles
      const hasRequiredRole = roles.some(role => userRoles.includes(role));
      
      if (hasRequiredRole) {
        next();
        return;
      }

      res.status(403).json({
        error: 'Insufficient permissions',
        message: `You need one of these roles: ${roles.join(', ')} to access this resource.`,
      });
    } catch (error) {
      console.error('Error checking roles:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify roles.',
      });
    }
  };
};

/**
 * Middleware to check if user is accessing their own resources or has specific role
 */
export const requireSelfOrRole = (roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource.',
      });
      return;
    }

    try {
      // Check if user is accessing their own resources
      const targetUserId = req.params.userId || req.params.id;
      if (targetUserId === req.user.id) {
        next();
        return;
      }

      // Get user's roles from the request or fetch from service
      const userRoles = req.user.roles || [];
      
      // Check if user has any of the required roles
      const hasRequiredRole = roles.some(role => userRoles.includes(role));
      
      if (hasRequiredRole) {
        next();
        return;
      }

      res.status(403).json({
        error: 'Insufficient permissions',
        message: `You can only access your own resources or need one of these roles: ${roles.join(', ')}`,
      });
    } catch (error) {
      console.error('Error checking self or role:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify permissions.',
      });
    }
  };
};
