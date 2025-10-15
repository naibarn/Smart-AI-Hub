import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import { AuthenticatedRequest } from './auth.middleware';

// Redis client for caching permission checks
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis (this should be called when the application starts)
export const connectRBACRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis for RBAC middleware:', error);
  }
};

/**
 * Permission-based authorization middleware
 * Checks if user has specific permission for a resource and action
 * Caches result in Redis for 1 hour TTL
 */
export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to access this resource.',
        });
        return;
      }

      const userId = req.user.id;
      const permissionKey = `${resource}:${action}`;
      const cacheKey = `permission:${userId}:${permissionKey}`;

      // Check cache first
      try {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult !== null) {
          const hasPermission = cachedResult === 'true';
          if (!hasPermission) {
            res.status(403).json({
              error: 'Insufficient permissions',
              message: `You do not have permission to ${action} ${resource}.`,
            });
            return;
          }
          next();
          return;
        }
      } catch (redisError) {
        console.error('Redis cache read error:', redisError);
        // Continue with database check if Redis is down
      }

      // If not in cache, check database (this would be implemented in the permission service)
      // For now, we'll make a call to the permission service
      const hasPermission = await checkUserPermission(userId, resource, action);

      // Cache the result for 1 hour (3600 seconds)
      try {
        await redisClient.setEx(cacheKey, 3600, hasPermission.toString());
      } catch (redisError) {
        console.error('Redis cache write error:', redisError);
        // Continue even if caching fails
      }

      if (!hasPermission) {
        res.status(403).json({
          error: 'Insufficient permissions',
          message: `You do not have permission to ${action} ${resource}.`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred while checking permissions.',
      });
    }
  };
};

/**
 * Role-based authorization middleware
 * Checks if user has one of the specified roles
 */
export const requireRoles = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to access this resource.',
        });
        return;
      }

      // Check if user has one of the required roles
      const userRole = req.user.role;
      const hasRequiredRole = roles.includes(userRole);

      if (!hasRequiredRole) {
        res.status(403).json({
          error: 'Insufficient permissions',
          message: `You need one of these roles to access this resource: ${roles.join(', ')}.`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred while checking roles.',
      });
    }
  };
};

/**
 * Self-access middleware
 * Allows users to access their own resources or admins to access any resource
 */
export const requireSelfOrRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to access this resource.',
        });
        return;
      }

      const userId = req.user.id;
      const targetUserId = req.params.id || req.params.userId;
      const userRole = req.user.role;

      // Allow access if user is accessing their own resource or has required role
      const isSelfAccess = userId === targetUserId;
      const hasRequiredRole = roles.includes(userRole);

      if (!isSelfAccess && !hasRequiredRole) {
        res.status(403).json({
          error: 'Insufficient permissions',
          message: 'You can only access your own resources or need elevated permissions.',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Self or role middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred while checking access permissions.',
      });
    }
  };
};

/**
 * Helper function to check user permission
 * This would typically call the permission service
 * For now, we'll implement a basic version that can be extended
 */
async function checkUserPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    // This should be replaced with an actual call to the permission service
    // For now, we'll make a simple HTTP call to the core-service
    const response = await fetch(
      `${process.env.CORE_SERVICE_URL || 'http://localhost:3001'}/api/permissions/check`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          resource,
          action,
        }),
      }
    );

    if (!response.ok) {
      console.error('Permission check failed:', response.statusText);
      return false;
    }

    const result = (await response.json()) as { hasPermission?: boolean };
    return result.hasPermission || false;
  } catch (error) {
    console.error('Error checking user permission:', error);
    // Fail closed - deny permission if check fails
    return false;
  }
}

/**
 * Clear permission cache for a user
 * Useful when roles or permissions are changed
 */
export const clearUserPermissionCache = async (userId: string): Promise<void> => {
  try {
    const pattern = `permission:${userId}:*`;
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error clearing user permission cache:', error);
  }
};

/**
 * Disconnect Redis client (call this when shutting down the application)
 */
export const disconnectRBACRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
  } catch (error) {
    console.error('Error disconnecting Redis from RBAC middleware:', error);
  }
};
