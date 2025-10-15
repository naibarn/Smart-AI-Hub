import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '@smart-ai-hub/shared';

// Service JWT Payload interface
export interface ServiceJWTPayload {
  sub: string; // Service ID
  name: string; // Service name
  type: 'service'; // Fixed type for service tokens
  iat: number; // Issued at
  exp: number; // Expiration time
  jti: string; // JWT ID
}

// Extended Request interface to include service
export interface ServiceRequest extends Request {
  service?: {
    id: string;
    name: string;
  };
}

/**
 * Service-to-Service Authentication Middleware
 *
 * This middleware:
 * 1. Extracts service token from X-Service-Token header
 * 2. Verifies token signature using service JWT secret
 * 3. Validates token is of service type
 * 4. Attaches service object to req.service = { id, name }
 * 5. Calls next() if successful
 *
 * Error handling:
 * - 401 if no token provided
 * - 401 if token is invalid
 * - 401 if token is expired
 * - 401 if token is not a service token
 */
export const authenticateServiceRequest = async (
  req: ServiceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from X-Service-Token header
    const serviceToken = req.headers['x-service-token'] as string;

    if (!serviceToken) {
      res.status(401).json({
        data: null,
        meta: null,
        error: {
          code: 'SERVICE_TOKEN_REQUIRED',
          message: 'Service token is required for internal API access',
        },
      });
      return;
    }

    // 2. Verify token signature with service JWT secret
    const serviceJwtSecret =
      process.env.SERVICE_TOKEN_SECRET || 'service-secret-key-change-in-production';

    let decoded: ServiceJWTPayload;
    try {
      decoded = jwt.verify(serviceToken, serviceJwtSecret) as ServiceJWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          data: null,
          meta: null,
          error: {
            code: 'SERVICE_TOKEN_EXPIRED',
            message: 'Service token has expired',
          },
        });
        return;
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          data: null,
          meta: null,
          error: {
            code: 'INVALID_SERVICE_TOKEN',
            message: 'The provided service token is invalid',
          },
        });
        return;
      } else {
        res.status(401).json({
          data: null,
          meta: null,
          error: {
            code: 'SERVICE_TOKEN_VERIFICATION_FAILED',
            message: 'Failed to verify the service token',
          },
        });
        return;
      }
    }

    // 3. Validate token is of service type
    if (decoded.type !== 'service') {
      res.status(401).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Token must be of service type',
        },
      });
      return;
    }

    // 4. Attach service object to request
    req.service = {
      id: decoded.sub,
      name: decoded.name,
    };

    // 5. Call next() if successful
    next();
  } catch (error) {
    console.error('Service authentication middleware error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during service authentication',
      },
    });
  }
};

/**
 * Generate a service JWT token for internal service communication
 */
export const generateServiceToken = (serviceId: string, serviceName: string): string => {
  const serviceJwtSecret =
    process.env.SERVICE_JWT_SECRET || 'your-super-secret-service-key-change-in-production';

  const payload: ServiceJWTPayload = {
    sub: serviceId,
    name: serviceName,
    type: 'service',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    jti: `svc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  return jwt.sign(payload, serviceJwtSecret);
};
