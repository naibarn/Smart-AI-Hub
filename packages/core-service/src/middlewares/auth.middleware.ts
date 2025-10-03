import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT Payload interface
export interface JWTPayload {
  sub: string; // User ID
  email: string; // User email
  role: string; // User role
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

    // 3. Attach user object to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    // 4. Call next() if successful
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

    if (req.user.role !== requiredRole) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `You need ${requiredRole} role to access this resource.`,
      });
      return;
    }

    next();
  };
};
