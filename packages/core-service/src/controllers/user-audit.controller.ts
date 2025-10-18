import { Request, Response } from 'express';
import {
  createUserAuditLog,
  getUserAuditLogs,
  getAllAuditLogs,
  getAuditStatistics,
  cleanupOldAuditLogs,
} from '../services/user-audit.service';
import { UserAuditAction } from '@smart-ai-hub/shared';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';

/**
 * Create a user audit log entry
 */
export const createUserAuditLogHandler = async (req: Request, res: Response) => {
  try {
    const { userId, action, reason, metadata } = req.body;
    const performedBy = req.user?.id;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Create audit log
    const result = await createUserAuditLog(
      userId,
      action,
      performedBy!,
      reason,
      metadata,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in createUserAuditLogHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get audit logs for a specific user
 */
export const getUserAuditLogsHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '20', action, startDate, endDate } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page parameter',
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter (must be between 1 and 100)',
      });
    }

    // Parse action parameter
    let actionEnum: UserAuditAction | undefined;
    if (action) {
      if (!Object.values(UserAuditAction).includes(action as UserAuditAction)) {
        return res.status(400).json({
          success: false,
          error: `Invalid action. Must be one of: ${Object.values(UserAuditAction).join(', ')}`,
        });
      }
      actionEnum = action as UserAuditAction;
    }

    // Parse date parameters
    let start: Date | undefined;
    let end: Date | undefined;
    if (startDate) {
      start = new Date(startDate as string);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid startDate format',
        });
      }
    }
    if (endDate) {
      end = new Date(endDate as string);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid endDate format',
        });
      }
    }

    // Get audit logs
    const result = await getUserAuditLogs(userId, pageNum, limitNum, actionEnum, start, end);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in getUserAuditLogsHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get all audit logs (admin only)
 */
export const getAllAuditLogsHandler = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', userId, action, startDate, endDate } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate pagination parameters
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page parameter',
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter (must be between 1 and 100)',
      });
    }

    // Parse action parameter
    let actionEnum: UserAuditAction | undefined;
    if (action) {
      if (!Object.values(UserAuditAction).includes(action as UserAuditAction)) {
        return res.status(400).json({
          success: false,
          error: `Invalid action. Must be one of: ${Object.values(UserAuditAction).join(', ')}`,
        });
      }
      actionEnum = action as UserAuditAction;
    }

    // Parse date parameters
    let start: Date | undefined;
    let end: Date | undefined;
    if (startDate) {
      start = new Date(startDate as string);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid startDate format',
        });
      }
    }
    if (endDate) {
      end = new Date(endDate as string);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid endDate format',
        });
      }
    }

    // Get audit logs
    const result = await getAllAuditLogs(
      pageNum,
      limitNum,
      userId as string,
      actionEnum,
      start,
      end
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in getAllAuditLogsHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get audit statistics (admin only)
 */
export const getAuditStatisticsHandler = async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.query;

    // Parse date parameters
    let start: Date | undefined;
    let end: Date | undefined;
    if (startDate) {
      start = new Date(startDate as string);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid startDate format',
        });
      }
    }
    if (endDate) {
      end = new Date(endDate as string);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid endDate format',
        });
      }
    }

    // Get audit statistics
    const result = await getAuditStatistics(userId as string | undefined, start, end);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in getAuditStatisticsHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Clean up old audit logs (admin only)
 */
export const cleanupOldAuditLogsHandler = async (req: Request, res: Response) => {
  try {
    const { days } = req.body;

    // Validate days parameter
    if (!days || isNaN(parseInt(days, 10)) || parseInt(days, 10) < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter (must be a positive integer)',
      });
    }

    const daysNum = parseInt(days, 10);

    // Clean up old audit logs
    const result = await cleanupOldAuditLogs(daysNum);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in cleanupOldAuditLogsHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
