import { PrismaClient, User, BlockLog, BlockAction } from '@prisma/client';
import {
  AppError,
  UserServiceResponse,
  UserValidationError,
  BlockedUsersStatistics,
} from '@smart-ai-hub/shared';
import { createClient } from 'redis';

const prisma = new PrismaClient();
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
redisClient.connect().catch(console.error);

/**
 * Deactivate user account
 */
export const deactivateUserAccount = async (
  userId: string,
  reason: string,
  blockedBy: string,
  notifyUser: boolean = true
): Promise<UserServiceResponse<User>> => {
  try {
    const validationErrors: UserValidationError[] = [];

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      validationErrors.push({
        field: 'reason',
        message: 'Reason is required and must be a non-empty string',
        code: 'REQUIRED_FIELD',
      });
    } else if (reason.length > 500) {
      validationErrors.push({
        field: 'reason',
        message: 'Reason must be less than 500 characters',
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

    // Check if user is already blocked
    if (user.isBlocked) {
      return {
        success: false,
        error: 'User account is already deactivated',
      };
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update user to blocked status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          isBlocked: true,
          blockedReason: reason.trim(),
          blockedAt: new Date(),
          blockedBy,
        },
      });

      // Create block log entry
      await tx.blockLog.create({
        data: {
          userId,
          blockedBy,
          action: BlockAction.block,
          reason: reason.trim(),
          metadata: {
            notifyUser,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return updatedUser;
    });

    // Invalidate cache
    await redisClient.del(`user:${userId}`);
    await redisClient.del(`user_profile:${userId}`);

    // Send notification email if requested
    if (notifyUser) {
      try {
        await sendAccountDeactivationEmail(user.email, reason);
      } catch (emailError) {
        // Email failed but don't fail the operation
        // Don't fail the operation if email fails
      }
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // Error deactivating user account
    return {
      success: false,
      error: 'Failed to deactivate user account',
    };
  }
};

/**
 * Reactivate user account
 */
export const reactivateUserAccount = async (
  userId: string,
  reason: string,
  reactivatedBy: string,
  notifyUser: boolean = true
): Promise<UserServiceResponse<User>> => {
  try {
    const validationErrors: UserValidationError[] = [];

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      validationErrors.push({
        field: 'reason',
        message: 'Reason is required and must be a non-empty string',
        code: 'REQUIRED_FIELD',
      });
    } else if (reason.length > 500) {
      validationErrors.push({
        field: 'reason',
        message: 'Reason must be less than 500 characters',
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

    // Check if user is already active
    if (!user.isBlocked) {
      return {
        success: false,
        error: 'User account is already active',
      };
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update user to active status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          isBlocked: false,
          blockedReason: null,
          blockedAt: null,
          blockedBy: null,
        },
      });

      // Create block log entry
      await tx.blockLog.create({
        data: {
          userId,
          blockedBy: reactivatedBy,
          action: BlockAction.unblock,
          reason: reason.trim(),
          metadata: {
            notifyUser,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return updatedUser;
    });

    // Invalidate cache
    await redisClient.del(`user:${userId}`);
    await redisClient.del(`user_profile:${userId}`);

    // Send notification email if requested
    if (notifyUser) {
      try {
        await sendAccountReactivationEmail(user.email, reason);
      } catch (emailError) {
        // Email failed but don't fail the operation
        // Don't fail the operation if email fails
      }
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // Error reactivating user account
    return {
      success: false,
      error: 'Failed to reactivate user account',
    };
  }
};

/**
 * Get user block logs
 */
export const getUserBlockLogs = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<
  UserServiceResponse<{
    logs: (BlockLog & { user: { id: string; email: string } })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>
> => {
  try {
    // Validate pagination parameters
    if (page < 1) {
      return {
        success: false,
        error: 'Page must be a positive integer',
      };
    }

    if (limit < 1 || limit > 100) {
      return {
        success: false,
        error: 'Limit must be between 1 and 100',
      };
    }

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

    // Get total count
    const total = await prisma.blockLog.count({
      where: { userId },
    });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get block logs
    const logs = await prisma.blockLog.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      success: true,
      data: {
        logs,
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    // Error getting user block logs
    return {
      success: false,
      error: 'Failed to get user block logs',
    };
  }
};

/**
 * Get all block logs (admin only)
 */
export const getAllBlockLogs = async (
  page: number = 1,
  limit: number = 20,
  action?: BlockAction
): Promise<
  UserServiceResponse<{
    logs: (BlockLog & { user: { id: string; email: string } })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>
> => {
  try {
    // Validate pagination parameters
    if (page < 1) {
      return {
        success: false,
        error: 'Page must be a positive integer',
      };
    }

    if (limit < 1 || limit > 100) {
      return {
        success: false,
        error: 'Limit must be between 1 and 100',
      };
    }

    // Build where clause
    const whereClause: any = {};
    if (action) {
      whereClause.action = action;
    }

    // Get total count
    const total = await prisma.blockLog.count({
      where: whereClause,
    });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get block logs
    const logs = await prisma.blockLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      success: true,
      data: {
        logs,
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    // Error getting all block logs
    return {
      success: false,
      error: 'Failed to get block logs',
    };
  }
};

/**
 * Get blocked users statistics
 */
export const getBlockedUsersStatistics = async (): Promise<
  UserServiceResponse<BlockedUsersStatistics>
> => {
  try {
    // Get total blocked users
    const totalBlockedUsers = await prisma.user.count({
      where: { isBlocked: true },
    });

    // Get recently blocked users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyBlocked = await prisma.blockLog.count({
      where: {
        action: BlockAction.block,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get blocked by reason
    const blockedByReasonRaw = await prisma.blockLog.groupBy({
      by: ['reason'],
      where: {
        action: BlockAction.block,
      },
      _count: {
        reason: true,
      },
    });

    const blockedByReason = blockedByReasonRaw.reduce(
      (acc, item) => {
        if (item.reason) {
          acc[item.reason] = item._count.reason;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      success: true,
      data: {
        totalBlockedUsers,
        recentlyBlocked,
        blockedByReason,
      },
    };
  } catch (error) {
    // Error getting blocked users statistics
    return {
      success: false,
      error: 'Failed to get blocked users statistics',
    };
  }
};

// Email notification functions (placeholders - would need to be implemented)
async function sendAccountDeactivationEmail(email: string, reason: string): Promise<void> {
  // Implementation would depend on your email service
  // Sending account deactivation email
  // This would typically use a service like SendGrid, AWS SES, etc.
}

async function sendAccountReactivationEmail(email: string, reason: string): Promise<void> {
  // Implementation would depend on your email service
  // Sending account reactivation email
  // This would typically use a service like SendGrid, AWS SES, etc.
}
