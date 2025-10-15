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
      res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'BAD_REQUEST',
          message: 'userId and roleId are required',
        },
      });
      return;
    }

    // Check if the current user has permission to assign roles
    if (req.user && !(await hasPermission(req.user.id, 'roles', 'assign'))) {
      res.status(403).json({
        data: null,
        meta: null,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to assign roles',
        },
      });
      return;
    }

    await assignRole(userId, roleId, assignedBy);

    res.status(200).json({
      data: {
        message: 'Role assigned successfully',
      },
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error('Error assigning role:', error);

    if (error instanceof Error) {
      if (error.message === 'Role not found') {
        res.status(404).json({
          data: null,
          meta: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Role not found',
          },
        });
        return;
      }
      if (error.message === 'User not found') {
        res.status(404).json({
          data: null,
          meta: null,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
        return;
      }
      if (error.message === 'User already has this role') {
        res.status(409).json({
          data: null,
          meta: null,
          error: {
            code: 'CONFLICT',
            message: 'User already has this role',
          },
        });
        return;
      }
    }

    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to assign role',
      },
    });
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
      res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'BAD_REQUEST',
          message: 'userId and roleId are required',
        },
      });
      return;
    }

    // Check if the current user has permission to assign roles
    if (req.user && !(await hasPermission(req.user.id, 'roles', 'assign'))) {
      res.status(403).json({
        data: null,
        meta: null,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to remove roles',
        },
      });
      return;
    }

    await removeRole(userId, roleId);

    res.status(200).json({
      data: {
        message: 'Role removed successfully',
      },
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error('Error removing role:', error);

    if (error instanceof Error) {
      if (error.message === 'User does not have this role') {
        res.status(404).json({
          data: null,
          meta: null,
          error: {
            code: 'NOT_FOUND',
            message: 'User does not have this role',
          },
        });
        return;
      }
    }

    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove role',
      },
    });
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
      res.status(401).json({
        data: null,
        meta: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Check if user has permission to read user information
    // Users can read their own roles or need admin permission
    const isSelfAccess = currentUserId === id;
    const hasReadPermission = await hasPermission(currentUserId, 'users', 'read');

    if (!isSelfAccess && !hasReadPermission) {
      res.status(403).json({
        data: null,
        meta: null,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to read user roles',
        },
      });
      return;
    }

    const roles = await getUserRoles(id);

    res.status(200).json({
      data: {
        userId: id,
        roles,
      },
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error('Error getting user roles:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user roles',
      },
    });
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
      res.status(401).json({
        data: null,
        meta: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Check if user has permission to read roles
    if (!(await hasPermission(currentUserId, 'roles', 'read'))) {
      res.status(403).json({
        data: null,
        meta: null,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to read roles',
        },
      });
      return;
    }

    const roles = await getAllRoles();

    res.status(200).json({
      data: {
        roles,
      },
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error('Error getting all roles:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get roles',
      },
    });
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
      res.status(401).json({
        data: null,
        meta: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Check if user has permission to read roles
    if (!(await hasPermission(currentUserId, 'roles', 'read'))) {
      res.status(403).json({
        data: null,
        meta: null,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to read permissions',
        },
      });
      return;
    }

    const permissions = await getAllPermissions();

    res.status(200).json({
      data: {
        permissions,
      },
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error('Error getting all permissions:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get permissions',
      },
    });
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
      res.status(401).json({
        data: null,
        meta: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Validate input
    if (!name) {
      res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'BAD_REQUEST',
          message: 'Role name is required',
        },
      });
      return;
    }

    // Check if user has permission to assign roles
    if (!(await hasPermission(currentUserId, 'roles', 'assign'))) {
      res.status(403).json({
        data: null,
        meta: null,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to create roles',
        },
      });
      return;
    }

    const role = await createRole(name, description, permissionIds);

    res.status(201).json({
      data: {
        role,
        message: 'Role created successfully',
      },
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error('Error creating role:', error);

    if (error instanceof Error) {
      if (error.message === 'Role with this name already exists') {
        res.status(409).json({
          data: null,
          meta: null,
          error: {
            code: 'CONFLICT',
            message: 'Role with this name already exists',
          },
        });
        return;
      }
    }

    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create role',
      },
    });
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
      res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'BAD_REQUEST',
          message: 'userId, resource, and action are required',
        },
      });
      return;
    }

    const hasRequiredPermission = await hasPermission(userId, resource, action);

    res.status(200).json({
      data: {
        hasPermission: hasRequiredPermission,
      },
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check permission',
      },
    });
  }
};
