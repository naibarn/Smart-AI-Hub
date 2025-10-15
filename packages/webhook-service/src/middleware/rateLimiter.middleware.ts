import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../config/logger';

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000'), // 1 hour
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requests per hour
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });

    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000') / 1000),
    });
  },
});

/**
 * Webhook delivery rate limiter
 * More restrictive for webhook endpoints
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per minute per webhook
  keyGenerator: (req: Request) => {
    // Use webhook ID from params if available, otherwise use IP
    return req.params.webhookId || req.ip;
  },
  message: {
    error: 'Webhook rate limit exceeded',
    message: 'Too many webhook requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Webhook rate limit exceeded', {
      ip: req.ip,
      webhookId: req.params.webhookId,
      userAgent: req.get('User-Agent'),
    });

    res.status(429).json({
      error: 'Webhook rate limit exceeded',
      message: 'Too many webhook requests. Please try again later.',
      retryAfter: 60,
    });
  },
});

/**
 * Internal service rate limiter
 * Less restrictive for internal service communication
 */
export const internalRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: {
    error: 'Internal service rate limit exceeded',
    message: 'Too many internal requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

/**
 * Create rate limiter for specific webhook endpoint
 */
export const createWebhookEndpointRateLimiter = (
  maxRequests: number = 1000,
  windowMs: number = 3600000
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: Request) => {
      // Use webhook ID from params
      return `webhook:${req.params.webhookId}`;
    },
    message: {
      error: 'Webhook endpoint rate limit exceeded',
      message: `Maximum ${maxRequests} requests per ${windowMs / 3600000} hour(s) allowed.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Webhook endpoint rate limit exceeded', {
        ip: req.ip,
        webhookId: req.params.webhookId,
        userAgent: req.get('User-Agent'),
      });

      res.status(429).json({
        error: 'Webhook endpoint rate limit exceeded',
        message: `Maximum ${maxRequests} requests per ${windowMs / 3600000} hour(s) allowed.`,
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

/**
 * Payload size limiter middleware
 */
export const payloadSizeLimiter = (maxSize: number = 1024 * 1024) => {
  // 1MB default
  return (req: Request, res: Response, next: Function) => {
    const contentLength = req.get('Content-Length');

    if (contentLength && parseInt(contentLength) > maxSize) {
      logger.warn('Payload size limit exceeded', {
        ip: req.ip,
        contentLength,
        maxSize,
        path: req.path,
      });

      return res.status(413).json({
        error: 'Payload too large',
        message: `Request payload size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB.`,
      });
    }

    next();
  };
};

/**
 * Webhook URL validation middleware
 */
export const webhookUrlValidator = (req: Request, res: Response, next: Function) => {
  if (req.body.url) {
    try {
      const url = new URL(req.body.url);

      if (url.protocol !== 'https:') {
        return res.status(400).json({
          error: 'Invalid webhook URL',
          message: 'Webhook URL must use HTTPS protocol.',
        });
      }

      // Check for localhost or private IP addresses
      const hostname = url.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.localhost')
      ) {
        return res.status(400).json({
          error: 'Invalid webhook URL',
          message: 'Webhook URL cannot point to localhost or private IP addresses.',
        });
      }
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid webhook URL',
        message: 'Webhook URL is not a valid URL.',
      });
    }
  }

  next();
};
