import { PrismaClient, UserRole, User } from '@prisma/client';
import {
  AppError,
  UserServiceResponse,
  UserValidationError,
  Role as IRole,
  Permission as IPermission,
} from '@smart-ai-hub/shared';
import { createClient } from 'redis';

const prisma = new PrismaClient();
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
redisClient.connect().catch(console.error);

/**
 * Get all roles
 */
export const getAllRoles = async (): Promise<UserServiceResponse<IRole[]>> => {
  try {
    // Check cache first
    const cacheKey = 'roles:all';
    const cachedRoles = await redisClient.get(cacheKey);

    if (cachedRoles) {
      return {
        success: true,
        data: JSON.parse(cachedRoles),
      };
    }

    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    // Cache the result
    await redisClient.setEx(cacheKey, 600, JSON.stringify(roles)); // 10 minutes

    // Transform Prisma roles to shared types
    const transformedRoles = roles.map((role) => ({
      ...role,
      description: role.description || undefined,
    }));

    return {
      success: true,
      data: transformedRoles,
    };
  } catch (error) {
    console.error('Error getting all roles:', error);
    return {
      success: false,
      error: 'Failed to get roles',
    };
  }
};

/**
 * Get role by ID
 */
export const getRoleById = async (roleId: string): Promise<UserServiceResponse<IRole>> => {
  try {
    // Check cache first
    const cacheKey = `role:${roleId}`;
    const cachedRole = await redisClient.get(cacheKey);

    if (cachedRole) {
      return {
        success: true,
        data: JSON.parse(cachedRole),
      };
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Cache the result
    await redisClient.setEx(cacheKey, 300, JSON.stringify(role)); // 5 minutes

    // Transform Prisma role to shared type
    const transformedRole = {
      ...role,
      description: role.description || undefined,
    };

    return {
      success: true,
      data: transformedRole,
    };
  } catch (error) {
    console.error('Error getting role by ID:', error);
    return {
      success: false,
      error: 'Failed to get role',
    };
  }
};

/**
 * Get role by name
 */
export const getRoleByName = async (roleName: string): Promise<UserServiceResponse<IRole>> => {
  try {
    // Check cache first
    const cacheKey = `role:name:${roleName}`;
    const cachedRole = await redisClient.get(cacheKey);

    if (cachedRole) {
      return {
        success: true,
        data: JSON.parse(cachedRole),
      };
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Cache the result
    await redisClient.setEx(cacheKey, 300, JSON.stringify(role)); // 5 minutes

    // Transform Prisma role to shared type
    const transformedRole = {
      ...role,
      description: role.description || undefined,
    };

    return {
      success: true,
      data: transformedRole,
    };
  } catch (error) {
    console.error('Error getting role by name:', error);
    return {
      success: false,
      error: 'Failed to get role',
    };
  }
};

/**
 * Create a new role
 */
export const createRole = async (
  name: string,
  description?: string,
  isSystem: boolean = false
): Promise<UserServiceResponse<IRole>> => {
  try {
    const validationErrors: UserValidationError[] = [];

    // Validate role name
    if (!name || name.trim().length === 0) {
      validationErrors.push({
        field: 'name',
        message: 'Role name is required',
        code: 'REQUIRED_FIELD',
      });
    } else if (name.length > 50) {
      validationErrors.push({
        field: 'name',
        message: 'Role name must be less than 50 characters',
        code: 'FIELD_TOO_LONG',
      });
    }

    // Validate description
    if (description && description.length > 255) {
      validationErrors.push({
        field: 'description',
        message: 'Description must be less than 255 characters',
        code: 'FIELD_TOO_LONG',
      });
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors,
      };
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: name.trim() },
    });

    if (existingRole) {
      return {
        success: false,
        error: 'Role with this name already exists',
      };
    }

    const newRole = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isSystem,
      },
    });

    // Invalidate cache
    await redisClient.del('roles:all');

    // Transform Prisma role to shared type
    const transformedRole = {
      ...newRole,
      description: newRole.description || undefined,
    };

    return {
      success: true,
      data: transformedRole,
    };
  } catch (error) {
    console.error('Error creating role:', error);
    return {
      success: false,
      error: 'Failed to create role',
    };
  }
};

/**
 * Update a role
 */
export const updateRole = async (
  roleId: string,
  name?: string,
  description?: string
): Promise<UserServiceResponse<IRole>> => {
  try {
    const validationErrors: UserValidationError[] = [];

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Check if it's a system role
    if (existingRole.isSystem) {
      return {
        success: false,
        error: 'Cannot modify system roles',
      };
    }

    // Validate role name if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        validationErrors.push({
          field: 'name',
          message: 'Role name is required',
          code: 'REQUIRED_FIELD',
        });
      } else if (name.length > 50) {
        validationErrors.push({
          field: 'name',
          message: 'Role name must be less than 50 characters',
          code: 'FIELD_TOO_LONG',
        });
      }

      // Check if role name already exists (excluding current role)
      const duplicateRole = await prisma.role.findFirst({
        where: {
          name: name.trim(),
          id: { not: roleId },
        },
      });

      if (duplicateRole) {
        validationErrors.push({
          field: 'name',
          message: 'Role with this name already exists',
          code: 'DUPLICATE_VALUE',
        });
      }
    }

    // Validate description if provided
    if (description !== undefined && description && description.length > 255) {
      validationErrors.push({
        field: 'description',
        message: 'Description must be less than 255 characters',
        code: 'FIELD_TOO_LONG',
      });
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors,
      };
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: updateData,
    });

    // Invalidate cache
    await redisClient.del('roles:all');
    await redisClient.del(`role:${roleId}`);
    await redisClient.del(`role:name:${updatedRole.name}`);

    // Transform Prisma role to shared type
    const transformedRole = {
      ...updatedRole,
      description: updatedRole.description || undefined,
    };

    return {
      success: true,
      data: transformedRole,
    };
  } catch (error) {
    console.error('Error updating role:', error);
    return {
      success: false,
      error: 'Failed to update role',
    };
  }
};

/**
 * Delete a role
 */
export const deleteRole = async (roleId: string): Promise<UserServiceResponse<null>> => {
  try {
    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Check if it's a system role
    if (existingRole.isSystem) {
      return {
        success: false,
        error: 'Cannot delete system roles',
      };
    }

    // Check if role is assigned to any users
    const userRolesCount = await prisma.userRole.count({
      where: { roleId },
    });

    if (userRolesCount > 0) {
      return {
        success: false,
        error: 'Cannot delete role that is assigned to users',
      };
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    // Invalidate cache
    await redisClient.del('roles:all');
    await redisClient.del(`role:${roleId}`);
    await redisClient.del(`role:name:${existingRole.name}`);

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error('Error deleting role:', error);
    return {
      success: false,
      error: 'Failed to delete role',
    };
  }
};

/**
 * Assign role to user
 */
export const assignRoleToUser = async (
  userId: string,
  roleId: string
): Promise<UserServiceResponse<UserRole>> => {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Check if role is already assigned to user
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existingUserRole) {
      return {
        success: false,
        error: 'Role is already assigned to this user',
      };
    }

    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });

    // Invalidate cache
    await redisClient.del(`user_roles:${userId}`);
    await redisClient.del(`user:${userId}:roles`);

    return {
      success: true,
      data: userRole,
    };
  } catch (error) {
    console.error('Error assigning role to user:', error);
    return {
      success: false,
      error: 'Failed to assign role to user',
    };
  }
};

/**
 * Remove role from user
 */
export const removeRoleFromUser = async (
  userId: string,
  roleId: string
): Promise<UserServiceResponse<null>> => {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Check if role is assigned to user
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!existingUserRole) {
      return {
        success: false,
        error: 'Role is not assigned to this user',
      };
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    // Invalidate cache
    await redisClient.del(`user_roles:${userId}`);
    await redisClient.del(`user:${userId}:roles`);

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error('Error removing role from user:', error);
    return {
      success: false,
      error: 'Failed to remove role from user',
    };
  }
};

/**
 * Get user roles
 */
export const getUserRoles = async (userId: string): Promise<UserServiceResponse<IRole[]>> => {
  try {
    // Check cache first
    const cacheKey = `user:${userId}:roles`;
    const cachedRoles = await redisClient.get(cacheKey);

    if (cachedRoles) {
      return {
        success: true,
        data: JSON.parse(cachedRoles),
      };
    }

    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    const roles = userRoles.map((ur) => ur.role);

    // Cache the result
    await redisClient.setEx(cacheKey, 300, JSON.stringify(roles)); // 5 minutes

    // Transform Prisma roles to shared types
    const transformedRoles = roles.map((role) => ({
      ...role,
      description: role.description || undefined,
    }));

    return {
      success: true,
      data: transformedRoles,
    };
  } catch (error) {
    console.error('Error getting user roles:', error);
    return {
      success: false,
      error: 'Failed to get user roles',
    };
  }
};

/**
 * Get users with a specific role
 */
export const getUsersWithRole = async (roleId: string): Promise<UserServiceResponse<User[]>> => {
  try {
    // Check cache first
    const cacheKey = `role:${roleId}:users`;
    const cachedUsers = await redisClient.get(cacheKey);

    if (cachedUsers) {
      return {
        success: true,
        data: JSON.parse(cachedUsers),
      };
    }

    const userRoles = await prisma.userRole.findMany({
      where: { roleId },
      include: {
        user: true,
      },
    });

    const users = userRoles.map((ur) => ur.user);

    // Cache the result
    await redisClient.setEx(cacheKey, 300, JSON.stringify(users)); // 5 minutes

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error('Error getting users with role:', error);
    return {
      success: false,
      error: 'Failed to get users with role',
    };
  }
};

/**
 * Get all permissions
 */
export const getAllPermissions = async (): Promise<UserServiceResponse<IPermission[]>> => {
  try {
    // Check cache first
    const cacheKey = 'permissions:all';
    const cachedPermissions = await redisClient.get(cacheKey);

    if (cachedPermissions) {
      return {
        success: true,
        data: JSON.parse(cachedPermissions),
      };
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Cache the result
    await redisClient.setEx(cacheKey, 600, JSON.stringify(permissions)); // 10 minutes

    // Transform Prisma permissions to shared types
    const transformedPermissions = permissions.map((permission) => ({
      ...permission,
      description: permission.description || undefined,
    }));

    return {
      success: true,
      data: transformedPermissions,
    };
  } catch (error) {
    console.error('Error getting all permissions:', error);
    return {
      success: false,
      error: 'Failed to get permissions',
    };
  }
};

/**
 * Get role permissions
 */
export const getRolePermissions = async (
  roleId: string
): Promise<UserServiceResponse<IPermission[]>> => {
  try {
    // Check cache first
    const cacheKey = `role:${roleId}:permissions`;
    const cachedPermissions = await redisClient.get(cacheKey);

    if (cachedPermissions) {
      return {
        success: true,
        data: JSON.parse(cachedPermissions),
      };
    }

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    const permissions = rolePermissions.map((rp) => rp.permission);

    // Cache the result
    await redisClient.setEx(cacheKey, 300, JSON.stringify(permissions)); // 5 minutes

    // Transform Prisma permissions to shared types
    const transformedPermissions = permissions.map((permission) => ({
      ...permission,
      description: permission.description || undefined,
    }));

    return {
      success: true,
      data: transformedPermissions,
    };
  } catch (error) {
    console.error('Error getting role permissions:', error);
    return {
      success: false,
      error: 'Failed to get role permissions',
    };
  }
};

/**
 * Assign permission to role
 */
export const assignPermissionToRole = async (
  roleId: string,
  permissionId: string
): Promise<UserServiceResponse<any>> => {
  try {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return {
        success: false,
        error: 'Permission not found',
      };
    }

    // Check if permission is already assigned to role
    const existingRolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existingRolePermission) {
      return {
        success: false,
        error: 'Permission is already assigned to this role',
      };
    }

    const rolePermission = await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });

    // Invalidate cache
    await redisClient.del(`role:${roleId}:permissions`);
    await redisClient.del(`permission:${permissionId}:roles`);

    return {
      success: true,
      data: rolePermission,
    };
  } catch (error) {
    console.error('Error assigning permission to role:', error);
    return {
      success: false,
      error: 'Failed to assign permission to role',
    };
  }
};

/**
 * Remove permission from role
 */
export const removePermissionFromRole = async (
  roleId: string,
  permissionId: string
): Promise<UserServiceResponse<null>> => {
  try {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return {
        success: false,
        error: 'Permission not found',
      };
    }

    // Check if permission is assigned to role
    const existingRolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (!existingRolePermission) {
      return {
        success: false,
        error: 'Permission is not assigned to this role',
      };
    }

    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    // Invalidate cache
    await redisClient.del(`role:${roleId}:permissions`);
    await redisClient.del(`permission:${permissionId}:roles`);

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error('Error removing permission from role:', error);
    return {
      success: false,
      error: 'Failed to remove permission from role',
    };
  }
};
