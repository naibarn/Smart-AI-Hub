import { PrismaClient, Prisma } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient();

// Redis client for caching permission checks
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis for permission service:', error);
  }
};

// Initialize Redis connection
connectRedis();

export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
}

/**
 * Check if a user has a specific permission
 * Caches result in Redis for 1 hour TTL
 */
export const hasPermission = async (userId: string, resource: string, action: string): Promise<boolean> => {
  try {
    const permissionKey = `${resource}:${action}`;
    const cacheKey = `permission:${userId}:${permissionKey}`;

    // Check cache first
    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult === 'true';
      }
    } catch (redisError) {
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
      if (hasRequiredPermission) break;
    }

    // Cache the result for 1 hour (3600 seconds)
    try {
      await redisClient.setEx(cacheKey, 3600, hasRequiredPermission.toString());
    } catch (redisError) {
      console.error('Redis cache write error:', redisError);
      // Continue even if caching fails
    }

    return hasRequiredPermission;
  } catch (error) {
    console.error('Error checking permission:', error);
    // Fail closed - deny permission if check fails
    return false;
  }
};

/**
 * Get all roles for a user
 */
export const getUserRoles = async (userId: string): Promise<Role[]> => {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    return userRoles.map((userRole: any) => userRole.role as Role);
  } catch (error) {
    console.error('Error getting user roles:', error);
    throw new Error('Failed to get user roles');
  }
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = async (userId: string): Promise<Permission[]> => {
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

    const permissions: Permission[] = [];
    for (const userRole of userRoles) {
      const role = userRole.role;
      for (const rolePermission of role.permissions) {
        permissions.push(rolePermission.permission as Permission);
      }
    }

    // Remove duplicates
    const uniquePermissions = permissions.filter((permission, index, self) =>
      index === self.findIndex((p) => p.id === permission.id)
    );

    return uniquePermissions;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    throw new Error('Failed to get user permissions');
  }
};

/**
 * Assign a role to a user
 */
export const assignRole = async (userId: string, roleId: string, assignedBy?: string): Promise<void> => {
  try {
    // Use Prisma transaction for atomic operation
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if role exists
      const role = await tx.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new Error('Role not found');
      }

      // Check if user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user already has this role
      const existingUserRole = await tx.userRole.findUnique({
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
      await tx.userRole.create({
        data: {
          userId,
          roleId,
        },
      });
    });

    // Clear permission cache for this user (outside transaction)
    await clearUserPermissionCache(userId);
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
};

/**
 * Remove a role from a user
 */
export const removeRole = async (userId: string, roleId: string): Promise<void> => {
  try {
    // Use Prisma transaction for atomic operation
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if user has this role
      const existingUserRole = await tx.userRole.findUnique({
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
      await tx.userRole.delete({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });
    });

    // Clear permission cache for this user (outside transaction)
    await clearUserPermissionCache(userId);
  } catch (error) {
    console.error('Error removing role:', error);
    throw error;
  }
};

/**
 * Get all available roles
 */
export const getAllRoles = async (): Promise<Role[]> => {
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

    return roles as Role[];
  } catch (error) {
    console.error('Error getting all roles:', error);
    throw new Error('Failed to get roles');
  }
};

/**
 * Get all available permissions
 */
export const getAllPermissions = async (): Promise<Permission[]> => {
  try {
    const permissions = await prisma.permission.findMany();
    return permissions as Permission[];
  } catch (error) {
    console.error('Error getting all permissions:', error);
    throw new Error('Failed to get permissions');
  }
};

/**
 * Create a new role
 */
export const createRole = async (name: string, description?: string, permissionIds?: string[]): Promise<Role> => {
  try {
    // Use Prisma transaction for atomic operation
    const role = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if role name already exists
      const existingRole = await tx.role.findUnique({
        where: { name },
      });

      if (existingRole) {
        throw new Error('Role with this name already exists');
      }

      // Create the role
      const newRole = await tx.role.create({
        data: {
          name,
          description,
        },
      });

      // Assign permissions if provided
      if (permissionIds && permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId: newRole.id,
            permissionId,
          })),
        });
      }

      return newRole;
    });

    return role as Role;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

/**
 * Clear permission cache for a user
 * Useful when roles or permissions are changed
 */
export const clearUserPermissionCache = async (userId: string): Promise<void> => {
  try {
    const pattern = `permission:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error clearing user permission cache:', error);
  }
};

/**
 * Disconnect Redis client (call this when shutting down the application)
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
  } catch (error) {
    console.error('Error disconnecting Redis from permission service:', error);
  }
};