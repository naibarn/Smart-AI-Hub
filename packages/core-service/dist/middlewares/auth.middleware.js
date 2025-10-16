"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectAuthRedis = exports.authenticateService = exports.requireRole = exports.authenticateJWT = exports.connectAuthRedis = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("redis");
// Redis client for blacklist checking
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
// Connect to Redis (this should be called when the application starts)
const connectAuthRedis = async () => {
    try {
        await redisClient.connect();
    }
    catch (error) {
        console.error('Failed to connect to Redis for auth middleware:', error);
    }
};
exports.connectAuthRedis = connectAuthRedis;
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
const authenticateJWT = async (req, res, next) => {
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
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                res.status(401).json({
                    error: 'Token expired',
                    message: 'Your token has expired. Please login again.',
                });
                return;
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                res.status(401).json({
                    error: 'Invalid token',
                    message: 'The provided token is invalid.',
                });
                return;
            }
            else {
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
        }
        catch (redisError) {
            console.error('Redis error during blacklist check:', redisError);
            // Continue with authentication even if Redis is down
            // In production, you might want to fail closed instead
        }
        // 4. Attach user object to request
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.roles && decoded.roles.length > 0 ? decoded.roles[0] : 'user',
            roles: (decoded.roles || []).map((role) => ({ name: role })),
            permissions: decoded.permissions || [],
        };
        // 5. Call next() if successful
        next();
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred during authentication.',
        });
    }
};
exports.authenticateJWT = authenticateJWT;
/**
 * Optional role-based authentication middleware
 * Usage: router.get('/admin', authenticateJWT, requireRole('admin'), adminHandler);
 */
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'You must be authenticated to access this resource.',
            });
            return;
        }
        const userRoleNames = req.user.roles.map((r) => r.name);
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
exports.requireRole = requireRole;
/**
 * Service authentication middleware for internal service-to-service communication
 */
const authenticateService = async (req, res, next) => {
    try {
        const serviceToken = req.headers['x-service-token'];
        if (!serviceToken) {
            res.status(401).json({
                error: 'Service authentication required',
                message: 'No service token provided',
            });
            return;
        }
        const serviceSecret = process.env.SERVICE_TOKEN_SECRET || 'service-secret-key-change-in-production';
        try {
            const decoded = jsonwebtoken_1.default.verify(serviceToken, serviceSecret);
            if (decoded.type !== 'service') {
                res.status(401).json({
                    error: 'Invalid service token',
                    message: 'Token is not a service token',
                });
                return;
            }
            // Attach service info to request
            req.service = {
                id: decoded.sub,
                name: decoded.name,
                type: decoded.type,
            };
            next();
        }
        catch (error) {
            res.status(401).json({
                error: 'Invalid service token',
                message: 'The provided service token is invalid',
            });
            return;
        }
    }
    catch (error) {
        console.error('Service authentication error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred during service authentication.',
        });
    }
};
exports.authenticateService = authenticateService;
/**
 * Disconnect Redis client (call this when shutting down the application)
 */
const disconnectAuthRedis = async () => {
    try {
        await redisClient.quit();
    }
    catch (error) {
        console.error('Error disconnecting Redis from auth middleware:', error);
    }
};
exports.disconnectAuthRedis = disconnectAuthRedis;
//# sourceMappingURL=auth.middleware.js.map