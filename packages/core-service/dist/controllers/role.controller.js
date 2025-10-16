"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermissionHandler = exports.createRoleHandler = exports.getAllPermissionsHandler = exports.getAllRolesHandler = exports.getUserRolesHandler = exports.removeRoleFromUser = exports.assignRoleToUser = void 0;
const permission_service_1 = require("../services/permission.service");
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
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
            (0, response_1.errorResponse)('BAD_REQUEST', 'userId and roleId are required', res, 400, null, req.requestId);
            return;
        }
        // Check if the current user has permission to assign roles
        if (req.user && !(await (0, permission_service_1.hasPermission)(req.user.id, 'roles', 'assign'))) {
            (0, response_1.errorResponse)('FORBIDDEN', 'You do not have permission to assign roles', res, 403, null, req.requestId);
            return;
        }
        await (0, permission_service_1.assignRole)(userId, roleId, assignedBy);
        (0, response_1.successResponse)({ message: 'Role assigned successfully' }, res, 200, req.requestId);
        return;
    }
    catch (error) {
        console.error('Error assigning role:', error);
        if (error instanceof Error) {
            if (error.message === 'Role not found') {
                (0, response_1.errorResponse)('NOT_FOUND', 'Role not found', res, 404, null, req.requestId);
                return;
            }
            if (error.message === 'User not found') {
                (0, response_1.errorResponse)('NOT_FOUND', 'User not found', res, 404, null, req.requestId);
                return;
            }
            if (error.message === 'User already has this role') {
                (0, response_1.errorResponse)('CONFLICT', 'User already has this role', res, 409, null, req.requestId);
                return;
            }
        }
        (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Failed to assign role', res, 500, null, req.requestId);
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
            (0, response_1.errorResponse)('BAD_REQUEST', 'userId and roleId are required', res, 400, null, req.requestId);
            return;
        }
        // Check if the current user has permission to assign roles
        if (req.user && !(await (0, permission_service_1.hasPermission)(req.user.id, 'roles', 'assign'))) {
            (0, response_1.errorResponse)('FORBIDDEN', 'You do not have permission to remove roles', res, 403, null, req.requestId);
            return;
        }
        await (0, permission_service_1.removeRole)(userId, roleId);
        (0, response_1.successResponse)({ message: 'Role removed successfully' }, res, 200, req.requestId);
        return;
    }
    catch (error) {
        console.error('Error removing role:', error);
        if (error instanceof Error) {
            if (error.message === 'User does not have this role') {
                (0, response_1.errorResponse)('NOT_FOUND', 'User does not have this role', res, 404, null, req.requestId);
                return;
            }
        }
        (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Failed to remove role', res, 500, null, req.requestId);
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
            (0, response_1.errorResponse)('UNAUTHORIZED', 'Authentication required', res, 401, null, req.requestId);
            return;
        }
        // Check if user has permission to read user information
        // Users can read their own roles or need admin permission
        const isSelfAccess = currentUserId === id;
        const hasReadPermission = await (0, permission_service_1.hasPermission)(currentUserId, 'users', 'read');
        if (!isSelfAccess && !hasReadPermission) {
            (0, response_1.errorResponse)('FORBIDDEN', 'You do not have permission to read user roles', res, 403, null, req.requestId);
            return;
        }
        const roles = await (0, permission_service_1.getUserRoles)(id);
        (0, response_1.successResponse)({
            userId: id,
            roles,
        }, res, 200, req.requestId);
        return;
    }
    catch (error) {
        console.error('Error getting user roles:', error);
        (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Failed to get user roles', res, 500, null, req.requestId);
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
            (0, response_1.errorResponse)('UNAUTHORIZED', 'Authentication required', res, 401, null, req.requestId);
            return;
        }
        // Check if user has permission to read roles
        if (!(await (0, permission_service_1.hasPermission)(currentUserId, 'roles', 'read'))) {
            (0, response_1.errorResponse)('FORBIDDEN', 'You do not have permission to read roles', res, 403, null, req.requestId);
            return;
        }
        // Parse pagination parameters
        const pagination = (0, pagination_1.parsePaginationParams)(req.query);
        // Get roles with pagination
        const roles = await (0, permission_service_1.getAllRoles)();
        // For now, implement simple pagination on the client side
        // In a real implementation, you would modify getAllRoles to support pagination
        const startIndex = (pagination.page - 1) * pagination.per_page;
        const endIndex = startIndex + pagination.per_page;
        const paginatedRoles = roles.slice(startIndex, endIndex);
        (0, response_1.paginatedResponse)(paginatedRoles, {
            page: pagination.page,
            per_page: pagination.per_page,
            total: roles.length,
            total_pages: Math.ceil(roles.length / pagination.per_page),
        }, res, 200, req.requestId);
        return;
    }
    catch (error) {
        console.error('Error getting all roles:', error);
        (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Failed to get roles', res, 500, null, req.requestId);
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
            (0, response_1.errorResponse)('UNAUTHORIZED', 'Authentication required', res, 401, null, req.requestId);
            return;
        }
        // Check if user has permission to read roles
        if (!(await (0, permission_service_1.hasPermission)(currentUserId, 'roles', 'read'))) {
            (0, response_1.errorResponse)('FORBIDDEN', 'You do not have permission to read permissions', res, 403, null, req.requestId);
            return;
        }
        // Parse pagination parameters
        const pagination = (0, pagination_1.parsePaginationParams)(req.query);
        // Get permissions with pagination
        const permissions = await (0, permission_service_1.getAllPermissions)();
        // For now, implement simple pagination on the client side
        // In a real implementation, you would modify getAllPermissions to support pagination
        const startIndex = (pagination.page - 1) * pagination.per_page;
        const endIndex = startIndex + pagination.per_page;
        const paginatedPermissions = permissions.slice(startIndex, endIndex);
        (0, response_1.paginatedResponse)(paginatedPermissions, {
            page: pagination.page,
            per_page: pagination.per_page,
            total: permissions.length,
            total_pages: Math.ceil(permissions.length / pagination.per_page),
        }, res, 200, req.requestId);
        return;
    }
    catch (error) {
        console.error('Error getting all permissions:', error);
        (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Failed to get permissions', res, 500, null, req.requestId);
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
            (0, response_1.errorResponse)('UNAUTHORIZED', 'Authentication required', res, 401, null, req.requestId);
            return;
        }
        // Validate input
        if (!name) {
            (0, response_1.errorResponse)('BAD_REQUEST', 'Role name is required', res, 400, null, req.requestId);
            return;
        }
        // Check if user has permission to assign roles
        if (!(await (0, permission_service_1.hasPermission)(currentUserId, 'roles', 'assign'))) {
            (0, response_1.errorResponse)('FORBIDDEN', 'You do not have permission to create roles', res, 403, null, req.requestId);
            return;
        }
        const role = await (0, permission_service_1.createRole)(name, description, permissionIds);
        (0, response_1.successResponse)({
            role,
            message: 'Role created successfully',
        }, res, 201, req.requestId);
        return;
    }
    catch (error) {
        console.error('Error creating role:', error);
        if (error instanceof Error) {
            if (error.message === 'Role with this name already exists') {
                (0, response_1.errorResponse)('CONFLICT', 'Role with this name already exists', res, 409, null, req.requestId);
                return;
            }
        }
        (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Failed to create role', res, 500, null, req.requestId);
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
            (0, response_1.errorResponse)('BAD_REQUEST', 'userId, resource, and action are required', res, 400, null, req.requestId);
            return;
        }
        const hasRequiredPermission = await (0, permission_service_1.hasPermission)(userId, resource, action);
        (0, response_1.successResponse)({
            hasPermission: hasRequiredPermission,
        }, res, 200, req.requestId);
        return;
    }
    catch (error) {
        console.error('Error checking permission:', error);
        (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Failed to check permission', res, 500, null, req.requestId);
    }
};
exports.checkPermissionHandler = checkPermissionHandler;
//# sourceMappingURL=role.controller.js.map