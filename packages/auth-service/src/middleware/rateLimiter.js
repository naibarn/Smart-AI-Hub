/**
 * Role-based rate limiting middleware
 * Follows FR-6 API Standards specification
 * Uses Redis for distributed rate limiting
 */

const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Rate limits per role according to FR-6 specification
 */
const RATE_LIMITS = {
  guest: 10,      // 10 requests per minute
  user: 60,       // 60 requests per minute
  manager: 120,   // 120 requests per minute
  admin: 0        // No limit (0 represents unlimited)
};

/**
 * Get user role from request
 * @param {Object} req - Express request object
 * @returns {string} User role
 */
const getUserRole = (req) => {
  // If user is authenticated, get their role
  if (req.user && req.user.roles) {
    // Check if user has admin role
    if (req.user.roles.some(role => role.name === 'admin' || role.name === 'superadmin')) {
      return 'admin';
    }
    // Check if user has manager role
    if (req.user.roles.some(role => role.name === 'manager')) {
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
 * @param {string} keyPrefix - Redis key prefix for this rate limiter
 * @returns {Function} Express middleware function
 */
const createRateLimiter = (keyPrefix = 'rate_limit') => {
  return async (req, res, next) => {
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
      const current = await redis.incr(key);
      
      // Set expiry if this is the first request in the window
      if (current === 1) {
        await redis.expire(key, 60); // 60 seconds window
      }
      
      // Get TTL for response headers
      const ttl = await redis.ttl(key);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + ttl * 1000).toISOString());
      
      // Check if limit exceeded
      if (current > limit) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Maximum ${limit} requests per minute allowed for ${role} role.`,
            details: {
              role,
              limit,
              window: '1 minute',
              retry_after: ttl
            },
            timestamp: new Date().toISOString(),
            request_id: req.requestId || 'unknown'
          }
        });
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
 * @param {Object} limits - Custom rate limits by role
 * @param {string} keyPrefix - Redis key prefix
 * @returns {Function} Express middleware function
 */
const createCustomRateLimiter = (limits, keyPrefix = 'custom_rate_limit') => {
  return async (req, res, next) => {
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
      const current = await redis.incr(key);
      
      // Set expiry if this is the first request in the window
      if (current === 1) {
        await redis.expire(key, 60); // 60 seconds window
      }
      
      // Get TTL for response headers
      const ttl = await redis.ttl(key);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + ttl * 1000).toISOString());
      
      // Check if limit exceeded
      if (current > limit) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Maximum ${limit} requests per minute allowed.`,
            details: {
              role,
              limit,
              window: '1 minute',
              retry_after: ttl
            },
            timestamp: new Date().toISOString(),
            request_id: req.requestId || 'unknown'
          }
        });
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
const rateLimiter = createRateLimiter('api');

/**
 * Strict rate limiter for sensitive endpoints (e.g., login, registration)
 */
const strictRateLimiter = createCustomRateLimiter({
  guest: 5,    // 5 requests per minute for guests
  user: 10,    // 10 requests per minute for users
  manager: 20, // 20 requests per minute for managers
  admin: 0     // No limit for admins
}, 'strict');

module.exports = {
  rateLimiter,
  strictRateLimiter,
  createRateLimiter,
  createCustomRateLimiter,
  getUserRole,
  RATE_LIMITS
};