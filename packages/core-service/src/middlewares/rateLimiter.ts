import { Request, Response, NextFunction } from 'express';
import RedisService from '../services/redis.service';
import { errorResponse } from '../utils/response';

/**
 * Rate limits per role according to FR-6 specification
 */
const RATE_LIMITS = {
  guest: 10, // 10 requests per minute
  user: 60, // 60 requests per minute
  manager: 120, // 120 requests per minute
  admin: 0, // No limit (0 represents unlimited)
};

/**
 * User role type
 */
type UserRole = 'guest' | 'user' | 'manager' | 'admin';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  [key: string]: number;
}

/**
 * Extend Express Request interface to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        roles: Array<{ name: string }>;
      };
      requestId?: string;
    }
  }
}

/**
 * Get user role from request
 * @param req - Express request object
 * @returns User role
 */
const getUserRole = (req: Request): UserRole => {
  // If user is authenticated, get their role
  if (req.user) {
    // Check if user has admin role (from role property or roles array)
    if (
      req.user.role === 'admin' ||
      req.user.role === 'superadmin' ||
      (req.user.roles &&
        req.user.roles.some((role) => role.name === 'admin' || role.name === 'superadmin'))
    ) {
      return 'admin';
    }
    // Check if user has manager role
    if (
      req.user.role === 'manager' ||
      (req.user.roles && req.user.roles.some((role) => role.name === 'manager'))
    ) {
      return 'manager';
    }
    // Default to user role for authenticated users
    return 'user';
  }

  // Default to guest for unauthenticated users
  return 'guest';
};

/**
 * Create rate limiter middleware
 * @param keyPrefix - Redis key prefix for this rate limiter
 * @returns Express middleware function
 */
export const createRateLimiter = (keyPrefix: string = 'rate_limit') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user role
      const role = getUserRole(req);

      // Skip rate limiting for admin users
      if (role === 'admin') {
        return next();
      }

      // Get rate limit for this role
      const limit = RATE_LIMITS[role];
      if (limit === 0) {
        // No limit for this role
        return next();
      }

      // Create unique key for this user/IP
      const identifier = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
      const key = `${keyPrefix}:${role}:${identifier}`;

      // Get current count and TTL
      const current = await RedisService.incr(key);

      // Set expiry if this is the first request in the window
      if (current === 1) {
        await RedisService.expire(key, 60); // 60 seconds window
      }

      // Get TTL for response headers
      const ttl = await RedisService.ttl(key);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - (current || 0)));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + (ttl || 0) * 1000).toISOString());

      // Check if limit exceeded
      if ((current || 0) > limit) {
        errorResponse(
          'RATE_LIMIT_EXCEEDED',
          `Rate limit exceeded. Maximum ${limit} requests per minute allowed for ${role} role.`,
          res,
          429,
          {
            role,
            limit,
            window: '1 minute',
            retry_after: ttl,
          },
          req.requestId
        );
        return;
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Continue without rate limiting if Redis is unavailable
      next();
    }
  };
};

/**
 * Create a custom rate limiter with specific limits
 * @param limits - Custom rate limits by role
 * @param keyPrefix - Redis key prefix
 * @returns Express middleware function
 */
export const createCustomRateLimiter = (
  limits: RateLimitConfig,
  keyPrefix: string = 'custom_rate_limit'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user role
      const role = getUserRole(req);

      // Get rate limit for this role
      const limit = limits[role] || 0;
      if (limit === 0) {
        // No limit for this role
        return next();
      }

      // Create unique key for this user/IP
      const identifier = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
      const key = `${keyPrefix}:${role}:${identifier}`;

      // Get current count and TTL
      const current = await RedisService.incr(key);

      // Set expiry if this is the first request in the window
      if (current === 1) {
        await RedisService.expire(key, 60); // 60 seconds window
      }

      // Get TTL for response headers
      const ttl = await RedisService.ttl(key);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - (current || 0)));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + (ttl || 0) * 1000).toISOString());

      // Check if limit exceeded
      if ((current || 0) > limit) {
        errorResponse(
          'RATE_LIMIT_EXCEEDED',
          `Rate limit exceeded. Maximum ${limit} requests per minute allowed.`,
          res,
          429,
          {
            role,
            limit,
            window: '1 minute',
            retry_after: ttl,
          },
          req.requestId
        );
        return;
      }

      next();
    } catch (error) {
      console.error('Custom rate limiter error:', error);
      // Continue without rate limiting if Redis is unavailable
      next();
    }
  };
};

/**
 * Default rate limiter for general API endpoints
 */
export const rateLimiter = createRateLimiter('api');

/**
 * Strict rate limiter for sensitive endpoints (e.g., payment processing)
 */
export const strictRateLimiter = createCustomRateLimiter(
  {
    guest: 5, // 5 requests per minute for guests
    user: 10, // 10 requests per minute for users
    manager: 20, // 20 requests per minute for managers
    admin: 0, // No limit for admins
  },
  'strict'
);

/**
 * Lenient rate limiter for less sensitive endpoints
 */
export const lenientRateLimiter = createCustomRateLimiter(
  {
    guest: 20, // 20 requests per minute for guests
    user: 100, // 100 requests per minute for users
    manager: 200, // 200 requests per minute for managers
    admin: 0, // No limit for admins
  },
  'lenient'
);

export { getUserRole, RATE_LIMITS };
