"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.clearUserPermissionCache = exports.createRole = exports.getAllPermissions = exports.getAllRoles = exports.removeRole = exports.assignRole = exports.getUserPermissions = exports.getUserRoles = exports.hasPermission = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("redis");
const prisma = new client_1.PrismaClient();
// Redis client for caching permission checks
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
// Connect to Redis
const connectRedis = async () => {
    try {
        await redisClient.connect();
    }
    catch (error) {
        console.error('Failed to connect to Redis for permission service:', error);
    }
};
// Initialize Redis connection
connectRedis();
/**
 * Check if a user has a specific permission
 * Caches result in Redis for 1 hour TTL
 */
const hasPermission = async (userId, resource, action) => {
    try {
        const permissionKey = `${resource}:${action}`;
        const cacheKey = `permission:${userId}:${permissionKey}`;
        // Check cache first
        try {
            const cachedResult = await redisClient.get(cacheKey);
            if (cachedResult !== null) {
                return cachedResult === 'true';
            }
        }
        catch (redisError) {
            console.error('Redis cache read error:', redisError);
            // Continue with database check if Redis is down
        }
        // Get user's roles with their permissions
        const userRoles = await prisma.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
        // Check if any role has the required permission
        let hasRequiredPermission = false;
        for (const userRole of userRoles) {
            const role = userRole.role;
            for (const rolePermission of role.permissions) {
                const permission = rolePermission.permission;
                if (permission.resource === resource && permission.action === action) {
                    hasRequiredPermission = true;
                    break;
                }
            }
            if (hasRequiredPermission)
                break;
        }
        // Cache the result for 1 hour (3600 seconds)
        try {
            await redisClient.setEx(cacheKey, 3600, hasRequiredPermission.toString());
        }
        catch (redisError) {
            console.error('Redis cache write error:', redisError);
            // Continue even if caching fails
        }
        return hasRequiredPermission;
    }
    catch (error) {
        console.error('Error checking permission:', error);
        // Fail closed - deny permission if check fails
        return false;
    }
};
exports.hasPermission = hasPermission;
/**
 * Get all roles for a user
 */
const getUserRoles = async (userId) => {
    try {
        const userRoles = await prisma.userRole.findMany({
            where: { userId },
            include: {
                role: true,
            },
        });
        return userRoles.map((userRole) => userRole.role);
    }
    catch (error) {
        console.error('Error getting user roles:', error);
        throw new Error('Failed to get user roles');
    }
};
exports.getUserRoles = getUserRoles;
/**
 * Get all permissions for a user
 */
const getUserPermissions = async (userId) => {
    try {
        const userRoles = await prisma.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
        const permissions = [];
        for (const userRole of userRoles) {
            const role = userRole.role;
            for (const rolePermission of role.permissions) {
                permissions.push(rolePermission.permission);
            }
        }
        // Remove duplicates
        const uniquePermissions = permissions.filter((permission, index, self) => index === self.findIndex((p) => p.id === permission.id));
        return uniquePermissions;
    }
    catch (error) {
        console.error('Error getting user permissions:', error);
        throw new Error('Failed to get user permissions');
    }
};
exports.getUserPermissions = getUserPermissions;
/**
 * Assign a role to a user
 */
const assignRole = async (userId, roleId, assignedBy) => {
    try {
        // Check if role exists
        const role = await prisma.role.findUnique({
            where: { id: roleId },
        });
        if (!role) {
            throw new Error('Role not found');
        }
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Check if user already has this role
        const existingUserRole = await prisma.userRole.findUnique({
            where: {
                userId_roleId: {
                    userId,
                    roleId,
                },
            },
        });
        if (existingUserRole) {
            throw new Error('User already has this role');
        }
        // Assign the role
        await prisma.userRole.create({
            data: {
                userId,
                roleId,
            },
        });
        // Clear permission cache for this user
        await (0, exports.clearUserPermissionCache)(userId);
    }
    catch (error) {
        console.error('Error assigning role:', error);
        throw error;
    }
};
exports.assignRole = assignRole;
/**
 * Remove a role from a user
 */
const removeRole = async (userId, roleId) => {
    try {
        // Check if user has this role
        const existingUserRole = await prisma.userRole.findUnique({
            where: {
                userId_roleId: {
                    userId,
                    roleId,
                },
            },
        });
        if (!existingUserRole) {
            throw new Error('User does not have this role');
        }
        // Remove the role
        await prisma.userRole.delete({
            where: {
                userId_roleId: {
                    userId,
                    roleId,
                },
            },
        });
        // Clear permission cache for this user
        await (0, exports.clearUserPermissionCache)(userId);
    }
    catch (error) {
        console.error('Error removing role:', error);
        throw error;
    }
};
exports.removeRole = removeRole;
/**
 * Get all available roles
 */
const getAllRoles = async () => {
    try {
        const roles = await prisma.role.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });
        return roles;
    }
    catch (error) {
        console.error('Error getting all roles:', error);
        throw new Error('Failed to get roles');
    }
};
exports.getAllRoles = getAllRoles;
/**
 * Get all available permissions
 */
const getAllPermissions = async () => {
    try {
        const permissions = await prisma.permission.findMany();
        return permissions;
    }
    catch (error) {
        console.error('Error getting all permissions:', error);
        throw new Error('Failed to get permissions');
    }
};
exports.getAllPermissions = getAllPermissions;
/**
 * Create a new role
 */
const createRole = async (name, description, permissionIds) => {
    try {
        // Check if role name already exists
        const existingRole = await prisma.role.findUnique({
            where: { name },
        });
        if (existingRole) {
            throw new Error('Role with this name already exists');
        }
        // Create the role
        const role = await prisma.role.create({
            data: {
                name,
                description,
            },
        });
        // Assign permissions if provided
        if (permissionIds && permissionIds.length > 0) {
            await prisma.rolePermission.createMany({
                data: permissionIds.map(permissionId => ({
                    roleId: role.id,
                    permissionId,
                })),
            });
        }
        return role;
    }
    catch (error) {
        console.error('Error creating role:', error);
        throw error;
    }
};
exports.createRole = createRole;
/**
 * Clear permission cache for a user
 * Useful when roles or permissions are changed
 */
const clearUserPermissionCache = async (userId) => {
    try {
        const pattern = `permission:${userId}:*`;
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    }
    catch (error) {
        console.error('Error clearing user permission cache:', error);
    }
};
exports.clearUserPermissionCache = clearUserPermissionCache;
/**
 * Disconnect Redis client (call this when shutting down the application)
 */
const disconnectRedis = async () => {
    try {
        await redisClient.quit();
    }
    catch (error) {
        console.error('Error disconnecting Redis from permission service:', error);
    }
};
exports.disconnectRedis = disconnectRedis;
//# sourceMappingURL=permission.service.js.map