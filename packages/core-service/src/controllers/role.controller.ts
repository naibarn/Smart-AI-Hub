import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@smart-ai-hub/shared';
import {
  assignRole,
  removeRole,
  getUserRoles,
  getAllRoles,
  getAllPermissions,
  createRole,
  hasPermission,
} from '../services/permission.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { parsePaginationParams } from '../utils/pagination';

/**
 * Assign a role to a user
 * POST /api/admin/roles/assign
 * Requires: admin role
 */
export const assignRoleToUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, roleId } = req.body;
    const assignedBy = req.user?.id;

    // Validate input
    if (!userId || !roleId) {
      errorResponse('BAD_REQUEST', 'userId and roleId are required', res, 400, null, req.requestId);
      return;
    }

    // Check if the current user has permission to assign roles
    if (req.user && !(await hasPermission(req.user.id, 'roles', 'assign'))) {
      errorResponse(
        'FORBIDDEN',
        'You do not have permission to assign roles',
        res,
        403,
        null,
        req.requestId
      );
      return;
    }

    await assignRole(userId, roleId, assignedBy);

    successResponse({ message: 'Role assigned successfully' }, res, 200, req.requestId);
    return;
  } catch (error) {
    console.error('Error assigning role:', error);

    if (error instanceof Error) {
      if (error.message === 'Role not found') {
        errorResponse('NOT_FOUND', 'Role not found', res, 404, null, req.requestId);
        return;
      }
      if (error.message === 'User not found') {
        errorResponse('NOT_FOUND', 'User not found', res, 404, null, req.requestId);
        return;
      }
      if (error.message === 'User already has this role') {
        errorResponse('CONFLICT', 'User already has this role', res, 409, null, req.requestId);
        return;
      }
    }

    errorResponse('INTERNAL_SERVER_ERROR', 'Failed to assign role', res, 500, null, req.requestId);
  }
};

/**
 * Remove a role from a user
 * DELETE /api/admin/roles/remove
 * Requires: admin role
 */
export const removeRoleFromUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId, roleId } = req.body;

    // Validate input
    if (!userId || !roleId) {
      errorResponse('BAD_REQUEST', 'userId and roleId are required', res, 400, null, req.requestId);
      return;
    }

    // Check if the current user has permission to assign roles
    if (req.user && !(await hasPermission(req.user.id, 'roles', 'assign'))) {
      errorResponse(
        'FORBIDDEN',
        'You do not have permission to remove roles',
        res,
        403,
        null,
        req.requestId
      );
      return;
    }

    await removeRole(userId, roleId);

    successResponse({ message: 'Role removed successfully' }, res, 200, req.requestId);
    return;
  } catch (error) {
    console.error('Error removing role:', error);

    if (error instanceof Error) {
      if (error.message === 'User does not have this role') {
        errorResponse('NOT_FOUND', 'User does not have this role', res, 404, null, req.requestId);
        return;
      }
    }

    errorResponse('INTERNAL_SERVER_ERROR', 'Failed to remove role', res, 500, null, req.requestId);
  }
};

/**
 * Get roles for a specific user
 * GET /api/users/:id/roles
 * Requires: users:read permission
 */
export const getUserRolesHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      errorResponse('UNAUTHORIZED', 'Authentication required', res, 401, null, req.requestId);
      return;
    }

    // Check if user has permission to read user information
    // Users can read their own roles or need admin permission
    const isSelfAccess = currentUserId === id;
    const hasReadPermission = await hasPermission(currentUserId, 'users', 'read');

    if (!isSelfAccess && !hasReadPermission) {
      errorResponse(
        'FORBIDDEN',
        'You do not have permission to read user roles',
        res,
        403,
        null,
        req.requestId
      );
      return;
    }

    const roles = await getUserRoles(id);

    successResponse(
      {
        userId: id,
        roles,
      },
      res,
      200,
      req.requestId
    );
    return;
  } catch (error) {
    console.error('Error getting user roles:', error);
    errorResponse(
      'INTERNAL_SERVER_ERROR',
      'Failed to get user roles',
      res,
      500,
      null,
      req.requestId
    );
  }
};

/**
 * Get all available roles
 * GET /api/admin/roles
 * Requires: roles:read permission
 */
export const getAllRolesHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      errorResponse('UNAUTHORIZED', 'Authentication required', res, 401, null, req.requestId);
      return;
    }

    // Check if user has permission to read roles
    if (!(await hasPermission(currentUserId, 'roles', 'read'))) {
      errorResponse(
        'FORBIDDEN',
        'You do not have permission to read roles',
        res,
        403,
        null,
        req.requestId
      );
      return;
    }

    // Parse pagination parameters
    const pagination = parsePaginationParams(req.query);

    // Get roles with pagination
    const roles = await getAllRoles();

    // For now, implement simple pagination on the client side
    // In a real implementation, you would modify getAllRoles to support pagination
    const page = pagination.page ?? 1;
    const perPage = pagination.per_page ?? 20;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedRoles = roles.slice(startIndex, endIndex);

    paginatedResponse(
      paginatedRoles,
      {
        page: page,
        per_page: perPage,
        total: roles.length,
        total_pages: Math.ceil(roles.length / perPage),
      },
      res,
      200,
      req.requestId
    );
    return;
  } catch (error) {
    console.error('Error getting all roles:', error);
    errorResponse('INTERNAL_SERVER_ERROR', 'Failed to get roles', res, 500, null, req.requestId);
  }
};

/**
 * Get all available permissions
 * GET /api/admin/permissions
 * Requires: roles:read permission
 */
export const getAllPermissionsHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      errorResponse('UNAUTHORIZED', 'Authentication required', res, 401, null, req.requestId);
      return;
    }

    // Check if user has permission to read roles
    if (!(await hasPermission(currentUserId, 'roles', 'read'))) {
      errorResponse(
        'FORBIDDEN',
        'You do not have permission to read permissions',
        res,
        403,
        null,
        req.requestId
      );
      return;
    }

    // Parse pagination parameters
    const pagination = parsePaginationParams(req.query);

    // Get permissions with pagination
    const permissions = await getAllPermissions();

    // For now, implement simple pagination on the client side
    // In a real implementation, you would modify getAllPermissions to support pagination
    const page = pagination.page ?? 1;
    const perPage = pagination.per_page ?? 20;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedPermissions = permissions.slice(startIndex, endIndex);

    paginatedResponse(
      paginatedPermissions,
      {
        page: page,
        per_page: perPage,
        total: permissions.length,
        total_pages: Math.ceil(permissions.length / perPage),
      },
      res,
      200,
      req.requestId
    );
    return;
  } catch (error) {
    console.error('Error getting all permissions:', error);
    errorResponse(
      'INTERNAL_SERVER_ERROR',
      'Failed to get permissions',
      res,
      500,
      null,
      req.requestId
    );
  }
};

/**
 * Create a new role
 * POST /api/admin/roles
 * Requires: roles:assign permission
 */
export const createRoleHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description, permissionIds } = req.body;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      errorResponse('UNAUTHORIZED', 'Authentication required', res, 401, null, req.requestId);
      return;
    }

    // Validate input
    if (!name) {
      errorResponse('BAD_REQUEST', 'Role name is required', res, 400, null, req.requestId);
      return;
    }

    // Check if user has permission to assign roles
    if (!(await hasPermission(currentUserId, 'roles', 'assign'))) {
      errorResponse(
        'FORBIDDEN',
        'You do not have permission to create roles',
        res,
        403,
        null,
        req.requestId
      );
      return;
    }

    const role = await createRole(name, description, permissionIds);

    successResponse(
      {
        role,
        message: 'Role created successfully',
      },
      res,
      201,
      req.requestId
    );
    return;
  } catch (error) {
    console.error('Error creating role:', error);

    if (error instanceof Error) {
      if (error.message === 'Role with this name already exists') {
        errorResponse(
          'CONFLICT',
          'Role with this name already exists',
          res,
          409,
          null,
          req.requestId
        );
        return;
      }
    }

    errorResponse('INTERNAL_SERVER_ERROR', 'Failed to create role', res, 500, null, req.requestId);
  }
};

/**
 * Check if a user has a specific permission
 * POST /api/permissions/check
 * Internal API used by middleware
 */
export const checkPermissionHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, resource, action } = req.body;

    // Validate input
    if (!userId || !resource || !action) {
      errorResponse(
        'BAD_REQUEST',
        'userId, resource, and action are required',
        res,
        400,
        null,
        req.requestId
      );
      return;
    }

    const hasRequiredPermission = await hasPermission(userId, resource, action);

    successResponse(
      {
        hasPermission: hasRequiredPermission,
      },
      res,
      200,
      req.requestId
    );
    return;
  } catch (error) {
    console.error('Error checking permission:', error);
    errorResponse(
      'INTERNAL_SERVER_ERROR',
      'Failed to check permission',
      res,
      500,
      null,
      req.requestId
    );
  }
};
