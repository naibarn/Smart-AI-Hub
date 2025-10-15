import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import logger from '../config/logger';

// Extended Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  body: any;
  params: any;
  query: any;
  headers: any;
}

/**
 * JWT Authentication Middleware
 */
export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided or invalid format',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token signature
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        verified: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'The user associated with this token no longer exists.',
      });
      return;
    }

    if (!user.verified) {
      res.status(403).json({
        error: 'Account not verified',
        message: 'Please verify your account before accessing this resource.',
      });
      return;
    }

    // Attach user object to request
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during authentication.',
    });
  }
};

/**
 * Internal service authentication middleware
 * Uses a shared secret for service-to-service communication
 */
export const authenticateInternal = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;

    if (!internalSecret) {
      logger.error('INTERNAL_SERVICE_SECRET not configured');
      res.status(500).json({
        error: 'Service configuration error',
      });
      return;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Access denied',
        message: 'Internal service authentication required',
      });
      return;
    }

    const token = authHeader.substring(7);

    if (token !== internalSecret) {
      res.status(401).json({
        error: 'Invalid internal service token',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Internal authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};
