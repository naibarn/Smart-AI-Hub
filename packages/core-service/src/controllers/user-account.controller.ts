import { Request, Response, NextFunction } from 'express';
import { AppError, AuthenticatedRequest } from '@smart-ai-hub/shared';
import * as userAccountService from '../services/user-account.service';

/**
 * Deactivate user account
 */
export const deactivateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;
    if (!id) {
      return next(new AppError('User ID is required', 400));
    }

    const { reason, notifyUser } = req.body;
    if (!reason || reason.trim().length === 0) {
      return next(new AppError('Reason is required and must be a non-empty string', 400));
    }

    const deactivationResult = await userAccountService.deactivateUserAccount(
      id,
      reason,
      currentUserId,
      notifyUser !== false // Default to true
    );

    if (!deactivationResult.success || !deactivationResult.data) {
      return next(new AppError(deactivationResult.error || 'Failed to deactivate user', 400));
    }

    res.status(200).json({
      success: true,
      data: deactivationResult.data,
      message: 'User account deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reactivate user account
 */
export const reactivateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;
    if (!id) {
      return next(new AppError('User ID is required', 400));
    }

    const { reason, notifyUser } = req.body;
    if (!reason || reason.trim().length === 0) {
      return next(new AppError('Reason is required and must be a non-empty string', 400));
    }

    const reactivationResult = await userAccountService.reactivateUserAccount(
      id,
      reason,
      currentUserId,
      notifyUser !== false // Default to true
    );

    if (!reactivationResult.success || !reactivationResult.data) {
      return next(new AppError(reactivationResult.error || 'Failed to reactivate user', 400));
    }

    res.status(200).json({
      success: true,
      data: reactivationResult.data,
      message: 'User account reactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user block logs
 */
export const getUserBlockLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;
    if (!id) {
      return next(new AppError('User ID is required', 400));
    }

    // Check if user has admin role or is accessing their own logs
    const isAdmin = req.user?.roles.some((role) => ['admin', 'administrator'].includes(role.name));
    const isSelfAccess = currentUserId === id;

    if (!isAdmin && !isSelfAccess) {
      return next(new AppError('Insufficient permissions', 403));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const logsResult = await userAccountService.getUserBlockLogs(id, page, limit);
    if (!logsResult.success || !logsResult.data) {
      return next(new AppError(logsResult.error || 'Failed to get user block logs', 400));
    }

    res.status(200).json({
      success: true,
      data: logsResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all block logs (admin only)
 */
export const getAllBlockLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const action = req.query.action as any;

    const logsResult = await userAccountService.getAllBlockLogs(page, limit, action);
    if (!logsResult.success || !logsResult.data) {
      return next(new AppError(logsResult.error || 'Failed to get block logs', 400));
    }

    res.status(200).json({
      success: true,
      data: logsResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get blocked users statistics (admin only)
 */
export const getBlockedUsersStatistics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    const statsResult = await userAccountService.getBlockedUsersStatistics();
    if (!statsResult.success || !statsResult.data) {
      return next(new AppError(statsResult.error || 'Failed to get blocked users statistics', 400));
    }

    res.status(200).json({
      success: true,
      data: statsResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk deactivate users
 */
export const bulkDeactivateUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { userIds, reason, notifyUser } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return next(new AppError('User IDs array is required and must not be empty', 400));
    }

    if (!reason || reason.trim().length === 0) {
      return next(new AppError('Reason is required and must be a non-empty string', 400));
    }

    const results: {
      successful: string[];
      failed: Array<{ userId: string; error: string }>;
    } = {
      successful: [],
      failed: [],
    };

    // Process each user
    for (const userId of userIds) {
      try {
        const result = await userAccountService.deactivateUserAccount(
          userId,
          reason,
          currentUserId,
          notifyUser !== false
        );

        if (result.success) {
          results.successful.push(userId);
        } else {
          results.failed.push({
            userId,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        results.failed.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Processed ${userIds.length} users: ${results.successful.length} successful, ${results.failed.length} failed`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk reactivate users
 */
export const bulkReactivateUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { userIds, reason, notifyUser } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return next(new AppError('User IDs array is required and must not be empty', 400));
    }

    if (!reason || reason.trim().length === 0) {
      return next(new AppError('Reason is required and must be a non-empty string', 400));
    }

    const results: {
      successful: string[];
      failed: Array<{ userId: string; error: string }>;
    } = {
      successful: [],
      failed: [],
    };

    // Process each user
    for (const userId of userIds) {
      try {
        const result = await userAccountService.reactivateUserAccount(
          userId,
          reason,
          currentUserId,
          notifyUser !== false
        );

        if (result.success) {
          results.successful.push(userId);
        } else {
          results.failed.push({
            userId,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        results.failed.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Processed ${userIds.length} users: ${results.successful.length} successful, ${results.failed.length} failed`,
    });
  } catch (error) {
    next(error);
  }
};
