"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSelfOrRole = exports.requireRoles = exports.requirePermission = void 0;
/**
 * Middleware to check if user has specific permission
 */
const requirePermission = (resource, action) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'You must be authenticated to access this resource.',
            });
            return;
        }
        // For now, we'll implement a simple check
        // In a real implementation, you would check against a database or cache
        if (req.user.role === 'admin' || req.user.role === 'superadmin') {
            next();
            return;
        }
        res.status(403).json({
            error: 'Insufficient permissions',
            message: `You need ${resource}:${action} permission to access this resource.`,
        });
    };
};
exports.requirePermission = requirePermission;
/**
 * Middleware to check if user has specific role
 */
const requireRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'You must be authenticated to access this resource.',
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                message: `You need one of these roles: ${roles.join(', ')} to access this resource.`,
            });
            return;
        }
        next();
    };
};
exports.requireRoles = requireRoles;
/**
 * Middleware to check if user is accessing their own resources or has specific role
 */
const requireSelfOrRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'You must be authenticated to access this resource.',
            });
            return;
        }
        // Check if user is accessing their own resources
        const targetUserId = req.params.userId || req.params.id;
        if (targetUserId === req.user.id) {
            next();
            return;
        }
        // Check if user has required role
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                message: `You can only access your own resources or need one of these roles: ${roles.join(', ')}`,
            });
            return;
        }
        next();
    };
};
exports.requireSelfOrRole = requireSelfOrRole;
//# sourceMappingURL=rbac.middleware.js.map