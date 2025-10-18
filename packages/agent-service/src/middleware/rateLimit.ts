import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorCode, HttpStatus } from '@/types';
import { logger } from '@/utils/logger';

// Rate limit options interface
export interface RateLimitOptions {
  max: number; // Maximum number of requests
  windowMs: number; // Time window in milliseconds
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

// In-memory store for rate limits
const store = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Rate limit middleware factory
export const rateLimit = (options: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get identifier for the request
      const identifier = getIdentifier(req);

      // Get current time
      const now = Date.now();

      // Get or create entry for this identifier
      let entry = store.get(identifier);

      if (!entry || now > entry.resetTime) {
        // Create new entry
        entry = {
          count: 1,
          resetTime: now + options.windowMs,
        };
        store.set(identifier, entry);
      } else {
        // Increment count
        entry.count++;
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': options.max.toString(),
        'X-RateLimit-Remaining': Math.max(0, options.max - entry.count).toString(),
        'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
      });

      // Check if limit exceeded
      if (entry.count > options.max) {
        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          success: false,
          error: {
            code: ErrorCode.RATE_LIMIT_EXCEEDED,
            message: options.message || 'Too many requests, please try again later.',
            details: {
              limit: options.max,
              windowMs: options.windowMs,
              retryAfter: Math.ceil((entry.resetTime - now) / 1000),
            },
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      // If we get here, the request is allowed
      next();
    } catch (error) {
      logger.error('Rate limit error:', error);
      // If rate limiting fails, allow the request
      next();
    }
  };
};

// Get identifier for rate limiting
function getIdentifier(req: Request): string {
  // Try to use user ID if available
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }

  // Fall back to IP address
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  return `ip:${ip || 'unknown'}`;
}

// Predefined rate limit configurations
export const defaultRateLimit = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});

export const strictRateLimit = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests, please try again after 15 minutes.',
});

export const uploadRateLimit = rateLimit({
  max: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many file uploads, please try again after an hour.',
});

export const queryRateLimit = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many queries, please try again after an hour.',
});
