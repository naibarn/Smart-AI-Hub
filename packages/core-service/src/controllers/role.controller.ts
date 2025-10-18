import { Request, Response, NextFunction } from 'express';
import { AppError, AuthenticatedRequest } from '@smart-ai-hub/shared';
import * as roleService from '../services/role.service';

/**
 * Get all roles
 */
export const getAllRoles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const rolesResult = await roleService.getAllRoles();
    if (!rolesResult.success || !rolesResult.data) {
      return next(new AppError(rolesResult.error || 'Failed to get roles', 400));
    }

    res.status(200).json({
      success: true,
      data: rolesResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get role by ID
 */
export const getRoleById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;
    if (!id) {
      return next(new AppError('Role ID is required', 400));
    }

    const roleResult = await roleService.getRoleById(id);
    if (!roleResult.success || !roleResult.data) {
      return next(new AppError(roleResult.error || 'Role not found', 404));
    }

    res.status(200).json({
      success: true,
      data: roleResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new role
 */
export const createRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { name, description, isSystem } = req.body;
    if (!name) {
      return next(new AppError('Role name is required', 400));
    }

    const createResult = await roleService.createRole(name, description, isSystem);
    if (!createResult.success || !createResult.data) {
      return next(new AppError(createResult.error || 'Failed to create role', 400));
    }

    res.status(201).json({
      success: true,
      data: createResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a role
 */
export const updateRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;
    if (!id) {
      return next(new AppError('Role ID is required', 400));
    }

    const { name, description } = req.body;
    if (!name && !description) {
      return next(new AppError('At least one field must be provided for update', 400));
    }

    const updateResult = await roleService.updateRole(id, name, description);
    if (!updateResult.success || !updateResult.data) {
      return next(new AppError(updateResult.error || 'Failed to update role', 400));
    }

    res.status(200).json({
      success: true,
      data: updateResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a role
 */
export const deleteRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;
    if (!id) {
      return next(new AppError('Role ID is required', 400));
    }

    const deleteResult = await roleService.deleteRole(id);
    if (!deleteResult.success) {
      return next(new AppError(deleteResult.error || 'Failed to delete role', 400));
    }

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign role to user
 */
export const assignRoleToUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { userId: targetUserId, roleId } = req.body;
    if (!targetUserId || !roleId) {
      return next(new AppError('User ID and Role ID are required', 400));
    }

    const assignResult = await roleService.assignRoleToUser(targetUserId, roleId);
    if (!assignResult.success || !assignResult.data) {
      return next(new AppError(assignResult.error || 'Failed to assign role to user', 400));
    }

    res.status(200).json({
      success: true,
      data: assignResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove role from user
 */
export const removeRoleFromUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { userId: targetUserId, roleId } = req.body;
    if (!targetUserId || !roleId) {
      return next(new AppError('User ID and Role ID are required', 400));
    }

    const removeResult = await roleService.removeRoleFromUser(targetUserId, roleId);
    if (!removeResult.success) {
      return next(new AppError(removeResult.error || 'Failed to remove role from user', 400));
    }

    res.status(200).json({
      success: true,
      message: 'Role removed from user successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user roles
 */
export const getUserRoles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;
    if (!id) {
      return next(new AppError('User ID is required', 400));
    }

    // Check if user has admin role or is accessing their own roles
    const isAdmin = req.user?.roles.some((role) => ['admin', 'administrator'].includes(role.name));
    const isSelfAccess = userId === id;

    if (!isAdmin && !isSelfAccess) {
      return next(new AppError('Insufficient permissions', 403));
    }

    const rolesResult = await roleService.getUserRoles(id);
    if (!rolesResult.success || !rolesResult.data) {
      return next(new AppError(rolesResult.error || 'Failed to get user roles', 400));
    }

    res.status(200).json({
      success: true,
      data: rolesResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get users with a specific role
 */
export const getUsersWithRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;
    if (!id) {
      return next(new AppError('Role ID is required', 400));
    }

    const usersResult = await roleService.getUsersWithRole(id);
    if (!usersResult.success || !usersResult.data) {
      return next(new AppError(usersResult.error || 'Failed to get users with role', 400));
    }

    res.status(200).json({
      success: true,
      data: usersResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all permissions
 */
export const getAllPermissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const permissionsResult = await roleService.getAllPermissions();
    if (!permissionsResult.success || !permissionsResult.data) {
      return next(new AppError(permissionsResult.error || 'Failed to get permissions', 400));
    }

    res.status(200).json({
      success: true,
      data: permissionsResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get role permissions
 */
export const getRolePermissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;
    if (!id) {
      return next(new AppError('Role ID is required', 400));
    }

    const permissionsResult = await roleService.getRolePermissions(id);
    if (!permissionsResult.success || !permissionsResult.data) {
      return next(new AppError(permissionsResult.error || 'Failed to get role permissions', 400));
    }

    res.status(200).json({
      success: true,
      data: permissionsResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign permission to role
 */
export const assignPermissionToRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { roleId, permissionId } = req.body;
    if (!roleId || !permissionId) {
      return next(new AppError('Role ID and Permission ID are required', 400));
    }

    const assignResult = await roleService.assignPermissionToRole(roleId, permissionId);
    if (!assignResult.success || !assignResult.data) {
      return next(new AppError(assignResult.error || 'Failed to assign permission to role', 400));
    }

    res.status(200).json({
      success: true,
      data: assignResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove permission from role
 */
export const removePermissionFromRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { roleId, permissionId } = req.body;
    if (!roleId || !permissionId) {
      return next(new AppError('Role ID and Permission ID are required', 400));
    }

    const removeResult = await roleService.removePermissionFromRole(roleId, permissionId);
    if (!removeResult.success) {
      return next(new AppError(removeResult.error || 'Failed to remove permission from role', 400));
    }

    res.status(200).json({
      success: true,
      message: 'Permission removed from role successfully',
    });
  } catch (error) {
    next(error);
  }
};
