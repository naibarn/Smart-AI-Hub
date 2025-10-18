"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePermissionFromRole = exports.assignPermissionToRole = exports.getRolePermissions = exports.getAllPermissions = exports.getUsersWithRole = exports.getUserRoles = exports.removeRoleFromUser = exports.assignRoleToUser = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoleById = exports.getAllRoles = void 0;
const shared_1 = require("@smart-ai-hub/shared");
const roleService = __importStar(require("../services/role.service"));
/**
 * Get all roles
 */
const getAllRoles = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const rolesResult = await roleService.getAllRoles();
        if (!rolesResult.success || !rolesResult.data) {
            return next(new shared_1.AppError(rolesResult.error || 'Failed to get roles', 400));
        }
        res.status(200).json({
            success: true,
            data: rolesResult.data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllRoles = getAllRoles;
/**
 * Get role by ID
 */
const getRoleById = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const { id } = req.params;
        if (!id) {
            return next(new shared_1.AppError('Role ID is required', 400));
        }
        const roleResult = await roleService.getRoleById(id);
        if (!roleResult.success || !roleResult.data) {
            return next(new shared_1.AppError(roleResult.error || 'Role not found', 404));
        }
        res.status(200).json({
            success: true,
            data: roleResult.data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRoleById = getRoleById;
/**
 * Create a new role
 */
const createRole = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const { name, description, isSystem } = req.body;
        if (!name) {
            return next(new shared_1.AppError('Role name is required', 400));
        }
        const createResult = await roleService.createRole(name, description, isSystem);
        if (!createResult.success || !createResult.data) {
            return next(new shared_1.AppError(createResult.error || 'Failed to create role', 400));
        }
        res.status(201).json({
            success: true,
            data: createResult.data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createRole = createRole;
/**
 * Update a role
 */
const updateRole = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const { id } = req.params;
        if (!id) {
            return next(new shared_1.AppError('Role ID is required', 400));
        }
        const { name, description } = req.body;
        if (!name && !description) {
            return next(new shared_1.AppError('At least one field must be provided for update', 400));
        }
        const updateResult = await roleService.updateRole(id, name, description);
        if (!updateResult.success || !updateResult.data) {
            return next(new shared_1.AppError(updateResult.error || 'Failed to update role', 400));
        }
        res.status(200).json({
            success: true,
            data: updateResult.data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateRole = updateRole;
/**
 * Delete a role
 */
const deleteRole = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const { id } = req.params;
        if (!id) {
            return next(new shared_1.AppError('Role ID is required', 400));
        }
        const deleteResult = await roleService.deleteRole(id);
        if (!deleteResult.success) {
            return next(new shared_1.AppError(deleteResult.error || 'Failed to delete role', 400));
        }
        res.status(200).json({
            success: true,
            message: 'Role deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteRole = deleteRole;
/**
 * Assign role to user
 */
const assignRoleToUser = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const { userId: targetUserId, roleId } = req.body;
        if (!targetUserId || !roleId) {
            return next(new shared_1.AppError('User ID and Role ID are required', 400));
        }
        const assignResult = await roleService.assignRoleToUser(targetUserId, roleId);
        if (!assignResult.success || !assignResult.data) {
            return next(new shared_1.AppError(assignResult.error || 'Failed to assign role to user', 400));
        }
        res.status(200).json({
            success: true,
            data: assignResult.data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.assignRoleToUser = assignRoleToUser;
/**
 * Remove role from user
 */
const removeRoleFromUser = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const { userId: targetUserId, roleId } = req.body;
        if (!targetUserId || !roleId) {
            return next(new shared_1.AppError('User ID and Role ID are required', 400));
        }
        const removeResult = await roleService.removeRoleFromUser(targetUserId, roleId);
        if (!removeResult.success) {
            return next(new shared_1.AppError(removeResult.error || 'Failed to remove role from user', 400));
        }
        res.status(200).json({
            success: true,
            message: 'Role removed from user successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeRoleFromUser = removeRoleFromUser;
/**
 * Get user roles
 */
const getUserRoles = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const { id } = req.params;
        if (!id) {
            return next(new shared_1.AppError('User ID is required', 400));
        }
        // Check if user has admin role or is accessing their own roles
        const isAdmin = req.user?.roles.some((role) => ['admin', 'administrator'].includes(role.name));
        const isSelfAccess = userId === id;
        if (!isAdmin && !isSelfAccess) {
            return next(new shared_1.AppError('Insufficient permissions', 403));
        }
        const rolesResult = await roleService.getUserRoles(id);
        if (!rolesResult.success || !rolesResult.data) {
            return next(new shared_1.AppError(rolesResult.error || 'Failed to get user roles', 400));
        }
        res.status(200).json({
            success: true,
            data: rolesResult.data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserRoles = getUserRoles;
/**
 * Get users with a specific role
 */
const getUsersWithRole = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const { id } = req.params;
        if (!id) {
            return next(new shared_1.AppError('Role ID is required', 400));
        }
        const usersResult = await roleService.getUsersWithRole(id);
        if (!usersResult.success || !usersResult.data) {
            return next(new shared_1.AppError(usersResult.error || 'Failed to get users with role', 400));
        }
        res.status(200).json({
            success: true,
            data: usersResult.data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsersWithRole = getUsersWithRole;
/**
 * Get all permissions
 */
const getAllPermissions = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const permissionsResult = await roleService.getAllPermissions();
        if (!permissionsResult.success || !permissionsResult.data) {
            return next(new shared_1.AppError(permissionsResult.error || 'Failed to get permissions', 400));
        }
        res.status(200).json({
            success: true,
            data: permissionsResult.data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllPermissions = getAllPermissions;
/**
 * Get role permissions
 */
const getRolePermissions = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const { id } = req.params;
        if (!id) {
            return next(new shared_1.AppError('Role ID is required', 400));
        }
        const permissionsResult = await roleService.getRolePermissions(id);
        if (!permissionsResult.success || !permissionsResult.data) {
            return next(new shared_1.AppError(permissionsResult.error || 'Failed to get role permissions', 400));
        }
        res.status(200).json({
            success: true,
            data: permissionsResult.data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRolePermissions = getRolePermissions;
/**
 * Assign permission to role
 */
const assignPermissionToRole = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const { roleId, permissionId } = req.body;
        if (!roleId || !permissionId) {
            return next(new shared_1.AppError('Role ID and Permission ID are required', 400));
        }
        const assignResult = await roleService.assignPermissionToRole(roleId, permissionId);
        if (!assignResult.success || !assignResult.data) {
            return next(new shared_1.AppError(assignResult.error || 'Failed to assign permission to role', 400));
        }
        res.status(200).json({
            success: true,
            data: assignResult.data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.assignPermissionToRole = assignPermissionToRole;
/**
 * Remove permission from role
 */
const removePermissionFromRole = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        const { roleId, permissionId } = req.body;
        if (!roleId || !permissionId) {
            return next(new shared_1.AppError('Role ID and Permission ID are required', 400));
        }
        const removeResult = await roleService.removePermissionFromRole(roleId, permissionId);
        if (!removeResult.success) {
            return next(new shared_1.AppError(removeResult.error || 'Failed to remove permission from role', 400));
        }
        res.status(200).json({
            success: true,
            message: 'Permission removed from role successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removePermissionFromRole = removePermissionFromRole;
//# sourceMappingURL=role.controller.js.map