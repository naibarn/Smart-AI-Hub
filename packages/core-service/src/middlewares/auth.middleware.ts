import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';

// Redis client for blacklist checking
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis (this should be called when the application starts)
export const connectAuthRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis for auth middleware:', error);
  }
};

// JWT Payload interface
export interface JWTPayload {
  sub: string; // User ID
  email: string; // User email
  roles: string[]; // User roles (array for RBAC)
  permissions: string[]; // User permissions (for convenience)
  iat: number; // Issued at
  exp: number; // Expiration time
  jti: string; // JWT ID (for blacklist)
}

// Extended Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    roles: Array<{ name: string }>;
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
export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided or invalid format',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // 2. Verify token signature
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: 'Token expired',
          message: 'Your token has expired. Please login again.',
        });
        return;
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'Invalid token',
          message: 'The provided token is invalid.',
        });
        return;
      } else {
        res.status(401).json({
          error: 'Token verification failed',
          message: 'Failed to verify the provided token.',
        });
        return;
      }
    }

    // 3. Check if token is not in blacklist (Redis)
    try {
      const blacklistKey = `blacklist:${decoded.jti}`;
      const isBlacklisted = await redisClient.get(blacklistKey);

      if (isBlacklisted) {
        res.status(401).json({
          error: 'Token revoked',
          message: 'The provided token has been revoked.',
        });
        return;
      }
    } catch (redisError) {
      console.error('Redis error during blacklist check:', redisError);
      // Continue with authentication even if Redis is down
      // In production, you might want to fail closed instead
    }

    // 4. Attach user object to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.roles && decoded.roles.length > 0 ? decoded.roles[0] : 'user',
      roles: (decoded.roles || []).map((role: string) => ({ name: role })),
      permissions: decoded.permissions || [],
    };

    // 5. Call next() if successful
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during authentication.',
    });
  }
};

/**
 * Optional role-based authentication middleware
 * Usage: router.get('/admin', authenticateJWT, requireRole('admin'), adminHandler);
 */
export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource.',
      });
      return;
    }

    const userRoleNames = req.user.roles.map(r => r.name);
    if (!userRoleNames.includes(requiredRole)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `You need ${requiredRole} role to access this resource.`,
      });
      return;
    }

    next();
  };
};

/**
 * Service authentication middleware for internal service-to-service communication
 */
export const authenticateService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const serviceToken = req.headers['x-service-token'] as string;
    
    if (!serviceToken) {
      res.status(401).json({
        error: 'Service authentication required',
        message: 'No service token provided',
      });
      return;
    }

    const serviceSecret = process.env.SERVICE_TOKEN_SECRET || 'service-secret-key-change-in-production';
    
    try {
      const decoded = jwt.verify(serviceToken, serviceSecret) as any;
      
      if (decoded.type !== 'service') {
        res.status(401).json({
          error: 'Invalid service token',
          message: 'Token is not a service token',
        });
        return;
      }

      // Attach service info to request
      (req as any).service = {
        id: decoded.sub,
        name: decoded.name,
        type: decoded.type,
      };

      next();
    } catch (error) {
      res.status(401).json({
        error: 'Invalid service token',
        message: 'The provided service token is invalid',
      });
      return;
    }
  } catch (error) {
    console.error('Service authentication error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during service authentication.',
    });
  }
};

/**
 * Disconnect Redis client (call this when shutting down the application)
 */
export const disconnectAuthRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
  } catch (error) {
    console.error('Error disconnecting Redis from auth middleware:', error);
  }
};