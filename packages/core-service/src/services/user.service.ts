import { PrismaClient, Prisma, UserTier } from '@prisma/client';
import bcrypt from 'bcrypt';
import { createClient } from 'redis';
import {
  User,
  UserProfile,
  UserRole,
  UserWithProfile,
  Role,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateProfileRequest,
  UserSearchOptions,
  UserSearchResult,
  DeactivateUserRequest,
  ReactivateUserRequest,
  UserAuditLog,
  UserAuditAction,
  UserServiceResponse,
  UserStatistics,
  UserManagementTier,
  BulkUserOperationRequest,
  BulkUserOperationResult,
} from '@smart-ai-hub/shared';

const prisma = new PrismaClient();

// Redis client for caching user data
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    // Failed to connect to Redis for user service
  }
};

// Initialize Redis connection
connectRedis();

// Convert UserManagementTier to Prisma UserTier
const convertToPrismaTier = (tier?: UserManagementTier): UserTier | undefined => {
  if (!tier) return undefined;
  switch (tier) {
    case UserManagementTier.ADMINISTRATOR:
      return UserTier.administrator;
    case UserManagementTier.AGENCY:
      return UserTier.agency;
    case UserManagementTier.ORGANIZATION:
      return UserTier.organization;
    case UserManagementTier.ADMIN:
      return UserTier.admin;
    case UserManagementTier.GENERAL:
      return UserTier.general;
    default:
      return UserTier.general;
  }
};

// Convert Prisma UserTier to UserManagementTier
const convertFromPrismaTier = (tier: UserTier): UserManagementTier => {
  switch (tier) {
    case UserTier.administrator:
      return UserManagementTier.ADMINISTRATOR;
    case UserTier.agency:
      return UserManagementTier.AGENCY;
    case UserTier.organization:
      return UserManagementTier.ORGANIZATION;
    case UserTier.admin:
      return UserManagementTier.ADMIN;
    case UserTier.general:
      return UserManagementTier.GENERAL;
    default:
      return UserManagementTier.GENERAL;
  }
};

/**
 * Create a new user with profile and default roles
 */
export const createUser = async (
  userData: CreateUserRequest,
  createdBy?: string
): Promise<UserServiceResponse<UserWithProfile>> => {
  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if email already exists
      const existingUser = await tx.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password if provided
      let passwordHash: string | undefined;
      if (userData.password) {
        const saltRounds = 12;
        passwordHash = await bcrypt.hash(userData.password, saltRounds);
      }

      // Create user
      const newUser = await tx.user.create({
        data: {
          email: userData.email,
          passwordHash,
          tier: convertToPrismaTier(userData.tier) || UserTier.general,
          parentAgencyId: userData.parentAgencyId,
          parentOrganizationId: userData.parentOrganizationId,
          inviteCode: userData.inviteCode,
        },
      });

      // Create user profile if provided
      if (userData.firstName || userData.lastName) {
        await tx.userProfile.create({
          data: {
            userId: newUser.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
          },
        });
      }

      // Assign default role if specified
      if (userData.roles && userData.roles.length > 0) {
        for (const roleName of userData.roles) {
          const role = await tx.role.findFirst({
            where: { name: roleName },
          });

          if (role) {
            await tx.userRole.create({
              data: {
                userId: newUser.id,
                roleId: role.id,
              },
            });
          }
        }
      } else {
        // Assign 'general' role by default
        const generalRole = await tx.role.findFirst({
          where: { name: 'general' },
        });

        if (generalRole) {
          await tx.userRole.create({
            data: {
              userId: newUser.id,
              roleId: generalRole.id,
            },
          });
        }
      }

      // Get complete user data
      const userWithProfile = await getUserByIdInternal(newUser.id, tx);

      return userWithProfile;
    });

    // Log audit entry
    await logUserAudit({
      userId: result!.id,
      action: UserAuditAction.CREATED,
      performedBy: createdBy || result!.id,
      metadata: { email: userData.email, tier: userData.tier },
    });

    return {
      success: true,
      data: result!,
    };
  } catch (error) {
    // Error creating user
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
};

/**
 * Get user by ID with profile and roles
 */
export const getUserById = async (
  userId: string
): Promise<UserServiceResponse<UserWithProfile>> => {
  try {
    // Check cache first
    const cacheKey = `user:${userId}`;
    try {
      const cachedUser = await redisClient.get(cacheKey);
      if (cachedUser) {
        return {
          success: true,
          data: JSON.parse(cachedUser) as UserWithProfile,
        };
      }
    } catch (redisError) {
      // Redis cache read error
    }

    const user = await getUserByIdInternal(userId, prisma);

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Cache the result for 5 minutes (300 seconds)
    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(user));
    } catch (redisError) {
      // Redis cache write error
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    // Error getting user by ID
    return {
      success: false,
      error: 'Failed to get user',
    };
  }
};

/**
 * Internal function to get user by ID with profile and roles
 */
const getUserByIdInternal = async (
  userId: string,
  tx: PrismaClient | Prisma.TransactionClient
): Promise<UserWithProfile | null> => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash || undefined,
    verified: user.verified,
    googleId: user.googleId || undefined,
    tier: convertFromPrismaTier(user.tier),
    parentAgencyId: user.parentAgencyId || undefined,
    parentOrganizationId: user.parentOrganizationId || undefined,
    inviteCode: user.inviteCode || undefined,
    invitedBy: user.invitedBy || undefined,
    isBlocked: user.isBlocked,
    blockedReason: user.blockedReason || undefined,
    blockedAt: user.blockedAt || undefined,
    blockedBy: user.blockedBy || undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    credits: user.credits,
    points: user.points,
    profile: user.profile
      ? {
          userId: user.profile.userId,
          firstName: user.profile.firstName || undefined,
          lastName: user.profile.lastName || undefined,
          avatarUrl: user.profile.avatarUrl || undefined,
          preferences: user.profile.preferences as Record<string, any>,
          updatedAt: user.profile.updatedAt,
        }
      : undefined,
    userRoles: user.userRoles.map((ur: any) => ({
      id: ur.id,
      userId: ur.userId,
      roleId: ur.roleId,
      assignedAt: ur.assignedAt,
    })),
    roles: user.userRoles.map((ur: any) => ur.role as Role),
  };
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  profileData: UpdateProfileRequest,
  updatedBy?: string
): Promise<UserServiceResponse<UserWithProfile>> => {
  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if user exists
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Update or create profile
      const profile = await tx.userProfile.upsert({
        where: { userId },
        update: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          avatarUrl: profileData.avatarUrl,
          preferences: profileData.preferences || {},
        },
        create: {
          userId,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          avatarUrl: profileData.avatarUrl,
          preferences: profileData.preferences || {},
        },
      });

      // Get updated user data
      const userWithProfile = await getUserByIdInternal(userId, tx);

      return userWithProfile;
    });

    // Clear cache
    await clearUserCache(userId);

    // Log audit entry
    await logUserAudit({
      userId,
      action: UserAuditAction.PROFILE_UPDATED,
      performedBy: updatedBy || userId,
      metadata: profileData,
    });

    return {
      success: true,
      data: result!,
    };
  } catch (error) {
    // Error updating user profile
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user profile',
    };
  }
};

/**
 * Search and filter users
 */
export const searchUsers = async (
  options: UserSearchOptions
): Promise<UserServiceResponse<UserSearchResult>> => {
  try {
    const {
      query,
      tier,
      isBlocked,
      isVerified,
      roleId,
      parentAgencyId,
      parentOrganizationId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { profile: { firstName: { contains: query, mode: 'insensitive' } } },
        { profile: { lastName: { contains: query, mode: 'insensitive' } } },
      ];
    }

    if (tier) {
      where.tier = convertToPrismaTier(tier);
    }

    if (isBlocked !== undefined) {
      where.isBlocked = isBlocked;
    }

    if (isVerified !== undefined) {
      where.verified = isVerified;
    }

    if (roleId) {
      where.userRoles = {
        some: {
          roleId,
        },
      };
    }

    if (parentAgencyId) {
      where.parentAgencyId = parentAgencyId;
    }

    if (parentOrganizationId) {
      where.parentOrganizationId = parentOrganizationId;
    }

    // Build order by clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    // Get total count and users
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    // Transform users to UserWithProfile format
    const usersWithProfile: UserWithProfile[] = [];
    for (const user of users) {
      const userWithProfile = await transformPrismaUser(user);
      usersWithProfile.push(userWithProfile);
    }

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        users: usersWithProfile,
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    // Error searching users
    return {
      success: false,
      error: 'Failed to search users',
    };
  }
};

/**
 * Transform Prisma user to UserWithProfile format
 */
const transformPrismaUser = async (user: any): Promise<UserWithProfile> => {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash || undefined,
    verified: user.verified,
    googleId: user.googleId || undefined,
    tier: convertFromPrismaTier(user.tier),
    parentAgencyId: user.parentAgencyId || undefined,
    parentOrganizationId: user.parentOrganizationId || undefined,
    inviteCode: user.inviteCode || undefined,
    invitedBy: user.invitedBy || undefined,
    isBlocked: user.isBlocked,
    blockedReason: user.blockedReason || undefined,
    blockedAt: user.blockedAt || undefined,
    blockedBy: user.blockedBy || undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    credits: user.credits,
    points: user.points,
    profile: user.profile
      ? {
          userId: user.profile.userId,
          firstName: user.profile.firstName || undefined,
          lastName: user.profile.lastName || undefined,
          avatarUrl: user.profile.avatarUrl || undefined,
          preferences: user.profile.preferences as Record<string, any>,
          updatedAt: user.profile.updatedAt,
        }
      : undefined,
    userRoles: user.userRoles.map((ur: any) => ({
      id: ur.id,
      userId: ur.userId,
      roleId: ur.roleId,
      assignedAt: ur.assignedAt,
    })),
    roles: user.userRoles.map((ur: any) => ur.role as Role),
  };
};

/**
 * Deactivate user account
 */
export const deactivateUser = async (
  userId: string,
  deactivationData: DeactivateUserRequest,
  deactivatedBy?: string
): Promise<UserServiceResponse<UserWithProfile>> => {
  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if user exists
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      if (existingUser.isBlocked) {
        throw new Error('User is already deactivated');
      }

      // Deactivate user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          isBlocked: true,
          blockedReason: deactivationData.reason,
          blockedAt: new Date(),
          blockedBy: deactivatedBy,
        },
      });

      // Get updated user data
      const userWithProfile = await getUserByIdInternal(userId, tx);

      return userWithProfile;
    });

    // Clear cache
    await clearUserCache(userId);

    // Log audit entry
    await logUserAudit({
      userId,
      action: UserAuditAction.DEACTIVATED,
      performedBy: deactivatedBy || userId,
      metadata: { reason: deactivationData.reason, notifyUser: deactivationData.notifyUser },
    });

    return {
      success: true,
      data: result!,
    };
  } catch (error) {
    // Error deactivating user
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate user',
    };
  }
};

/**
 * Reactivate user account
 */
export const reactivateUser = async (
  userId: string,
  reactivationData: ReactivateUserRequest,
  reactivatedBy?: string
): Promise<UserServiceResponse<UserWithProfile>> => {
  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if user exists
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      if (!existingUser.isBlocked) {
        throw new Error('User is not deactivated');
      }

      // Reactivate user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          isBlocked: false,
          blockedReason: null,
          blockedAt: null,
          blockedBy: null,
        },
      });

      // Get updated user data
      const userWithProfile = await getUserByIdInternal(userId, tx);

      return userWithProfile;
    });

    // Clear cache
    await clearUserCache(userId);

    // Log audit entry
    await logUserAudit({
      userId,
      action: UserAuditAction.REACTIVATED,
      performedBy: reactivatedBy || userId,
      metadata: { reason: reactivationData.reason, notifyUser: reactivationData.notifyUser },
    });

    return {
      success: true,
      data: result!,
    };
  } catch (error) {
    // Error reactivating user
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reactivate user',
    };
  }
};

/**
 * Get user statistics
 */
export const getUserStatistics = async (): Promise<UserServiceResponse<UserStatistics>> => {
  try {
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      verifiedUsers,
      usersByTier,
      recentRegistrations,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: false } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { verified: true } }),
      prisma.user.groupBy({
        by: ['tier'],
        _count: true,
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Convert tier counts to UserManagementTier format
    const usersByTierConverted: Record<UserManagementTier, number> = {
      [UserManagementTier.ADMINISTRATOR]: 0,
      [UserManagementTier.AGENCY]: 0,
      [UserManagementTier.ORGANIZATION]: 0,
      [UserManagementTier.ADMIN]: 0,
      [UserManagementTier.GENERAL]: 0,
    };

    for (const tierCount of usersByTier) {
      const tier = convertFromPrismaTier(tierCount.tier);
      usersByTierConverted[tier] = tierCount._count;
    }

    return {
      success: true,
      data: {
        totalUsers,
        activeUsers,
        blockedUsers,
        verifiedUsers,
        usersByTier: usersByTierConverted,
        recentRegistrations,
        recentActivity,
      },
    };
  } catch (error) {
    // Error getting user statistics
    return {
      success: false,
      error: 'Failed to get user statistics',
    };
  }
};

/**
 * Perform bulk operations on users
 */
export const bulkUserOperation = async (
  operationData: BulkUserOperationRequest,
  performedBy?: string
): Promise<UserServiceResponse<BulkUserOperationResult>> => {
  try {
    const { userIds, operation, roleId, reason } = operationData;
    const successful: string[] = [];
    const failed: Array<{ userId: string; error: string }> = [];

    for (const userId of userIds) {
      try {
        switch (operation) {
          case 'deactivate':
            await deactivateUser(userId, { reason }, performedBy);
            successful.push(userId);
            break;
          case 'activate':
            await reactivateUser(userId, { reason }, performedBy);
            successful.push(userId);
            break;
          case 'assignRole':
            if (!roleId) {
              throw new Error('Role ID is required for assign role operation');
            }
            await prisma.userRole.create({
              data: { userId, roleId },
            });
            successful.push(userId);
            break;
          case 'removeRole':
            if (!roleId) {
              throw new Error('Role ID is required for remove role operation');
            }
            await prisma.userRole.delete({
              where: {
                userId_roleId: { userId, roleId },
              },
            });
            successful.push(userId);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } catch (error) {
        failed.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log audit entry
    await logUserAudit({
      userId: performedBy || 'system',
      action: UserAuditAction.UPDATED,
      performedBy: performedBy || 'system',
      metadata: { operation, userIds, successful, failed, reason },
    });

    return {
      success: true,
      data: {
        successful,
        failed,
        totalProcessed: userIds.length,
        successCount: successful.length,
        failureCount: failed.length,
      },
    };
  } catch (error) {
    // Error performing bulk user operation
    return {
      success: false,
      error: 'Failed to perform bulk user operation',
    };
  }
};

/**
 * Log user audit entry
 */
const logUserAudit = async (auditData: {
  userId: string;
  action: UserAuditAction;
  performedBy: string;
  reason?: string;
  metadata?: Record<string, any>;
}): Promise<void> => {
  try {
    // In a real implementation, you would store this in an audit log table
    // For now, we'll just log to console
    // User Audit Log
  } catch (error) {
    // Error logging user audit
  }
};

/**
 * Clear user cache
 */
const clearUserCache = async (userId: string): Promise<void> => {
  try {
    const cacheKey = `user:${userId}`;
    await redisClient.del(cacheKey);
  } catch (error) {
    // Error clearing user cache
  }
};

/**
 * Disconnect Redis client (call this when shutting down the application)
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
  } catch (error) {
    // Error disconnecting Redis from user service
  }
};
