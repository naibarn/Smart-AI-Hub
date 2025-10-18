import { createClient } from 'redis';
import fs from 'fs/promises';
import path from 'path';
import {
  UserAuditLog,
  UserAuditAction,
  UserServiceResponse,
  UserValidationError,
} from '@smart-ai-hub/shared';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Audit log file path
const AUDIT_LOG_FILE = path.join(process.cwd(), 'logs', 'user-audit.json');

// Ensure audit log directory exists
const ensureAuditLogDirectory = async (): Promise<void> => {
  try {
    const dir = path.dirname(AUDIT_LOG_FILE);
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error('Error creating audit log directory:', error);
  }
};

// Read audit logs from file
const readAuditLogs = async (): Promise<UserAuditLog[]> => {
  try {
    await ensureAuditLogDirectory();
    const data = await fs.readFile(AUDIT_LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as any).code === 'ENOENT') {
      return [];
    }
    console.error('Error reading audit logs:', error);
    return [];
  }
};

// Write audit logs to file
const writeAuditLogs = async (logs: UserAuditLog[]): Promise<void> => {
  try {
    await ensureAuditLogDirectory();
    await fs.writeFile(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error writing audit logs:', error);
  }
};

/**
 * Create a user audit log entry
 */
export const createUserAuditLog = async (
  userId: string,
  action: UserAuditAction,
  performedBy: string,
  reason?: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<UserServiceResponse<UserAuditLog>> => {
  try {
    // Validate required fields
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    if (!action) {
      return {
        success: false,
        error: 'Action is required',
      };
    }

    if (!performedBy) {
      return {
        success: false,
        error: 'Performed by is required',
      };
    }

    // Validate action
    const validActions = Object.values(UserAuditAction);
    if (!validActions.includes(action)) {
      return {
        success: false,
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
      };
    }

    // Create audit log entry
    const auditLog: UserAuditLog = {
      id: generateId(),
      userId,
      action,
      performedBy,
      reason,
      metadata: metadata || {},
      createdAt: new Date(),
    };

    // Read existing logs
    const logs = await readAuditLogs();

    // Add new log
    logs.push(auditLog);

    // Keep only last 10000 logs to prevent file from growing too large
    if (logs.length > 10000) {
      logs.splice(0, logs.length - 10000);
    }

    // Write back to file
    await writeAuditLogs(logs);

    // Clear relevant cache
    await clearAuditCache(userId);

    return {
      success: true,
      data: auditLog,
    };
  } catch (error) {
    console.error('Error creating user audit log:', error);
    return {
      success: false,
      error: 'Failed to create user audit log',
    };
  }
};

// Generate a simple ID for audit logs
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Get user audit logs
 */
export const getUserAuditLogs = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
  action?: UserAuditAction,
  startDate?: Date,
  endDate?: Date
): Promise<
  UserServiceResponse<{
    logs: UserAuditLog[];
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

    // Create cache key
    const cacheKey = `user_audit_logs:${userId}:${page}:${limit}:${action || 'all'}:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`;

    // Check cache first
    try {
      const cachedLogs = await redisClient.get(cacheKey);
      if (cachedLogs) {
        return {
          success: true,
          data: JSON.parse(cachedLogs),
        };
      }
    } catch (redisError) {
      console.error('Redis cache read error:', redisError);
    }

    // Build where clause
    const where: any = { userId };

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Read all logs
    const allLogs = await readAuditLogs();

    // Filter logs based on criteria
    let filteredLogs = allLogs.filter((log) => {
      if (log.userId !== userId) return false;
      if (action && log.action !== action) return false;
      if (startDate && new Date(log.createdAt) < startDate) return false;
      if (endDate && new Date(log.createdAt) > endDate) return false;
      return true;
    });

    // Sort by creation date (newest first)
    filteredLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Get total count
    const total = filteredLogs.length;

    // Apply pagination
    const skip = (page - 1) * limit;
    const logs = filteredLogs.slice(skip, skip + limit);

    const totalPages = Math.ceil(total / limit);
    const result = {
      logs: transformedLogs,
      total,
      page,
      limit,
      totalPages,
    };

    // Cache the result for 5 minutes (300 seconds)
    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    } catch (redisError) {
      console.error('Redis cache write error:', redisError);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error getting user audit logs:', error);
    return {
      success: false,
      error: 'Failed to get user audit logs',
    };
  }
};

/**
 * Get all audit logs (admin only)
 */
export const getAllAuditLogs = async (
  page: number = 1,
  limit: number = 20,
  action?: UserAuditAction,
  userId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<
  UserServiceResponse<{
    logs: UserAuditLog[];
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
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Read all logs
    const allLogs = await readAuditLogs();

    // Filter logs based on criteria
    let filteredLogs = allLogs.filter((log) => {
      if (userId && log.userId !== userId) return false;
      if (action && log.action !== action) return false;
      if (startDate && new Date(log.createdAt) < startDate) return false;
      if (endDate && new Date(log.createdAt) > endDate) return false;
      return true;
    });

    // Sort by creation date (newest first)
    filteredLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Get total count
    const total = filteredLogs.length;

    // Apply pagination
    const skip = (page - 1) * limit;
    const logs = filteredLogs.slice(skip, skip + limit);

    const totalPages = Math.ceil(total / limit);
    const result = {
      logs,
      total,
      page,
      limit,
      totalPages,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error getting all audit logs:', error);
    return {
      success: false,
      error: 'Failed to get audit logs',
    };
  }
};

/**
 * Get audit statistics
 */
export const getAuditStatistics = async (
  userId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<
  UserServiceResponse<{
    totalLogs: number;
    actionCounts: Record<UserAuditAction, number>;
    recentActivity: UserAuditLog[];
    topUsers: Array<{ userId: string; count: number }>;
  }>
> => {
  try {
    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Read all logs
    const allLogs = await readAuditLogs();

    // Filter logs based on criteria
    let filteredLogs = allLogs.filter((log) => {
      if (userId && log.userId !== userId) return false;
      if (startDate && new Date(log.createdAt) < startDate) return false;
      if (endDate && new Date(log.createdAt) > endDate) return false;
      return true;
    });

    // Get total count
    const totalLogs = filteredLogs.length;

    // Calculate action counts
    const actionCounts: Record<UserAuditAction, number> = {} as Record<UserAuditAction, number>;
    for (const log of filteredLogs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    }

    // Get recent activity
    const recentActivity = [...filteredLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Calculate top users
    const userCounts: Record<string, number> = {};
    for (const log of filteredLogs) {
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    }

    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    return {
      success: true,
      data: {
        totalLogs,
        actionCounts,
        recentActivity,
        topUsers,
      },
    };
  } catch (error) {
    console.error('Error getting audit statistics:', error);
    return {
      success: false,
      error: 'Failed to get audit statistics',
    };
  }
};

/**
 * Delete old audit logs (admin only)
 */
export const deleteOldAuditLogs = async (
  olderThanDays: number = 365
): Promise<UserServiceResponse<{ deletedCount: number }>> => {
  try {
    if (olderThanDays < 1) {
      return {
        success: false,
        error: 'Days must be a positive integer',
      };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Read all logs
    const allLogs = await readAuditLogs();

    // Filter out old logs
    const filteredLogs = allLogs.filter((log) => new Date(log.createdAt) >= cutoffDate);

    // Count deleted logs
    const deletedCount = allLogs.length - filteredLogs.length;

    // Write back filtered logs
    await writeAuditLogs(filteredLogs);

    // Clear all audit cache
    await clearAllAuditCache();

    return {
      success: true,
      data: {
        deletedCount,
      },
    };
  } catch (error) {
    console.error('Error deleting old audit logs:', error);
    return {
      success: false,
      error: 'Failed to delete old audit logs',
    };
  }
};

/**
 * Clear audit cache for a specific user
 */
const clearAuditCache = async (userId: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(`user_audit_logs:${userId}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error clearing audit cache:', error);
  }
};

/**
 * Clear all audit cache
 */
const clearAllAuditCache = async (): Promise<void> => {
  try {
    const keys = await redisClient.keys('user_audit_logs:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error clearing all audit cache:', error);
  }
};
