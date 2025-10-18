import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorCode, HttpStatus } from '@/types';
import { logger } from '@/utils/logger';

// Mock authentication middleware
// In a real implementation, this would verify JWT tokens or use another auth method
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Authorization token required',
        },
        timestamp: new Date(),
      } as ApiResponse);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // In a real implementation, verify the JWT token
    // For now, we'll mock a user
    if (token === 'mock-valid-token') {
      req.user = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      next();
    } else {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Invalid or expired token',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Authentication error',
      },
      timestamp: new Date(),
    } as ApiResponse);
  }
};

// Admin authentication middleware
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First authenticate the user
    await authenticate(req, res, (err) => {
      if (err) return next(err);

      // Check if user is admin
      if (req.user?.role !== 'admin') {
        res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          error: {
            code: ErrorCode.ACCESS_DENIED,
            message: 'Admin access required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      next();
    });
  } catch (error) {
    logger.error('Admin authentication error:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Authentication error',
      },
      timestamp: new Date(),
    } as ApiResponse);
  }
};
