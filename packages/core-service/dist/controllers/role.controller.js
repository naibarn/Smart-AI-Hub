"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermissionHandler = exports.createRoleHandler = exports.getAllPermissionsHandler = exports.getAllRolesHandler = exports.getUserRolesHandler = exports.removeRoleFromUser = exports.assignRoleToUser = void 0;
const permission_service_1 = require("../services/permission.service");
/**
 * Assign a role to a user
 * POST /api/admin/roles/assign
 * Requires: admin role
 */
const assignRoleToUser = async (req, res) => {
    try {
        const { userId, roleId } = req.body;
        const assignedBy = req.user?.id;
        // Validate input
        if (!userId || !roleId) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'userId and roleId are required',
            });
            return;
        }
        // Check if the current user has permission to assign roles
        if (req.user && !(await (0, permission_service_1.hasPermission)(req.user.id, 'roles', 'assign'))) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to assign roles',
            });
            return;
        }
        await (0, permission_service_1.assignRole)(userId, roleId, assignedBy);
        res.status(200).json({
            success: true,
            message: 'Role assigned successfully',
        });
    }
    catch (error) {
        console.error('Error assigning role:', error);
        if (error instanceof Error) {
            if (error.message === 'Role not found') {
                res.status(404).json({
                    error: 'Not Found',
                    message: 'Role not found',
                });
                return;
            }
            if (error.message === 'User not found') {
                res.status(404).json({
                    error: 'Not Found',
                    message: 'User not found',
                });
                return;
            }
            if (error.message === 'User already has this role') {
                res.status(409).json({
                    error: 'Conflict',
                    message: 'User already has this role',
                });
                return;
            }
        }
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to assign role',
        });
    }
};
exports.assignRoleToUser = assignRoleToUser;
/**
 * Remove a role from a user
 * DELETE /api/admin/roles/remove
 * Requires: admin role
 */
const removeRoleFromUser = async (req, res) => {
    try {
        const { userId, roleId } = req.body;
        // Validate input
        if (!userId || !roleId) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'userId and roleId are required',
            });
            return;
        }
        // Check if the current user has permission to assign roles
        if (req.user && !(await (0, permission_service_1.hasPermission)(req.user.id, 'roles', 'assign'))) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to remove roles',
            });
            return;
        }
        await (0, permission_service_1.removeRole)(userId, roleId);
        res.status(200).json({
            success: true,
            message: 'Role removed successfully',
        });
    }
    catch (error) {
        console.error('Error removing role:', error);
        if (error instanceof Error) {
            if (error.message === 'User does not have this role') {
                res.status(404).json({
                    error: 'Not Found',
                    message: 'User does not have this role',
                });
                return;
            }
        }
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to remove role',
        });
    }
};
exports.removeRoleFromUser = removeRoleFromUser;
/**
 * Get roles for a specific user
 * GET /api/users/:id/roles
 * Requires: users:read permission
 */
const getUserRolesHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
            return;
        }
        // Check if user has permission to read user information
        // Users can read their own roles or need admin permission
        const isSelfAccess = currentUserId === id;
        const hasReadPermission = await (0, permission_service_1.hasPermission)(currentUserId, 'users', 'read');
        if (!isSelfAccess && !hasReadPermission) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to read user roles',
            });
            return;
        }
        const roles = await (0, permission_service_1.getUserRoles)(id);
        res.status(200).json({
            success: true,
            data: {
                userId: id,
                roles,
            },
        });
    }
    catch (error) {
        console.error('Error getting user roles:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get user roles',
        });
    }
};
exports.getUserRolesHandler = getUserRolesHandler;
/**
 * Get all available roles
 * GET /api/admin/roles
 * Requires: roles:read permission
 */
const getAllRolesHandler = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
            return;
        }
        // Check if user has permission to read roles
        if (!(await (0, permission_service_1.hasPermission)(currentUserId, 'roles', 'read'))) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to read roles',
            });
            return;
        }
        const roles = await (0, permission_service_1.getAllRoles)();
        res.status(200).json({
            success: true,
            data: {
                roles,
            },
        });
    }
    catch (error) {
        console.error('Error getting all roles:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get roles',
        });
    }
};
exports.getAllRolesHandler = getAllRolesHandler;
/**
 * Get all available permissions
 * GET /api/admin/permissions
 * Requires: roles:read permission
 */
const getAllPermissionsHandler = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
            return;
        }
        // Check if user has permission to read roles
        if (!(await (0, permission_service_1.hasPermission)(currentUserId, 'roles', 'read'))) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to read permissions',
            });
            return;
        }
        const permissions = await (0, permission_service_1.getAllPermissions)();
        res.status(200).json({
            success: true,
            data: {
                permissions,
            },
        });
    }
    catch (error) {
        console.error('Error getting all permissions:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get permissions',
        });
    }
};
exports.getAllPermissionsHandler = getAllPermissionsHandler;
/**
 * Create a new role
 * POST /api/admin/roles
 * Requires: roles:assign permission
 */
const createRoleHandler = async (req, res) => {
    try {
        const { name, description, permissionIds } = req.body;
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
            return;
        }
        // Validate input
        if (!name) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Role name is required',
            });
            return;
        }
        // Check if user has permission to assign roles
        if (!(await (0, permission_service_1.hasPermission)(currentUserId, 'roles', 'assign'))) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to create roles',
            });
            return;
        }
        const role = await (0, permission_service_1.createRole)(name, description, permissionIds);
        res.status(201).json({
            success: true,
            data: {
                role,
            },
            message: 'Role created successfully',
        });
    }
    catch (error) {
        console.error('Error creating role:', error);
        if (error instanceof Error) {
            if (error.message === 'Role with this name already exists') {
                res.status(409).json({
                    error: 'Conflict',
                    message: 'Role with this name already exists',
                });
                return;
            }
        }
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create role',
        });
    }
};
exports.createRoleHandler = createRoleHandler;
/**
 * Check if a user has a specific permission
 * POST /api/permissions/check
 * Internal API used by middleware
 */
const checkPermissionHandler = async (req, res) => {
    try {
        const { userId, resource, action } = req.body;
        // Validate input
        if (!userId || !resource || !action) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'userId, resource, and action are required',
            });
            return;
        }
        const hasRequiredPermission = await (0, permission_service_1.hasPermission)(userId, resource, action);
        res.status(200).json({
            hasPermission: hasRequiredPermission,
        });
    }
    catch (error) {
        console.error('Error checking permission:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to check permission',
        });
    }
};
exports.checkPermissionHandler = checkPermissionHandler;
//# sourceMappingURL=role.controller.js.map