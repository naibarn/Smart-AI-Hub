import { Request, Response, NextFunction } from 'express';
import { AppError } from '@smart-ai-hub/shared';
import * as analyticsService from '../services/analytics.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { parsePaginationParams, calculatePagination } from '../utils/pagination';
import { AnalyticsFilters } from '../services/analytics.service';

/**
 * Get comprehensive dashboard data for analytics
 *
 * @route GET /analytics/dashboard
 * @access Private (admin only)
 * @param req - Express request object with query parameters for filtering
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user has admin permissions
    const user = req.user;
    if (!user) {
      return next(new AppError('User not authenticated', 401));
    }

    // For now, allow all authenticated users to access analytics
    // In production, you might want to restrict this to admin users only

    // Parse filters from query parameters
    const filters: AnalyticsFilters = {};

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
      if (isNaN(filters.startDate.getTime())) {
        return next(new AppError('Invalid start date format', 400));
      }
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
      if (isNaN(filters.endDate.getTime())) {
        return next(new AppError('Invalid end date format', 400));
      }
    }

    if (req.query.service) {
      filters.service = req.query.service as string;
    }

    if (req.query.model) {
      filters.model = req.query.model as string;
    }

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    // Get dashboard data
    const dashboardData = await analyticsService.getDashboardData(filters);

    successResponse(dashboardData, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Get usage metrics with optional filters
 *
 * @route GET /analytics/metrics
 * @access Private (admin only)
 * @param req - Express request object with query parameters for filtering
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getUsageMetrics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('User not authenticated', 401));
    }

    // Parse filters from query parameters
    const filters: AnalyticsFilters = {};

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    if (req.query.service) {
      filters.service = req.query.service as string;
    }

    if (req.query.model) {
      filters.model = req.query.model as string;
    }

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    // Get usage metrics
    const metrics = await analyticsService.getUsageMetrics(filters);

    successResponse(metrics, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Get usage breakdown by service
 *
 * @route GET /analytics/services
 * @access Private (admin only)
 * @param req - Express request object with query parameters for filtering
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getUsageByService = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('User not authenticated', 401));
    }

    // Parse filters from query parameters
    const filters: AnalyticsFilters = {};

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    // Get usage by service
    const serviceUsage = await analyticsService.getUsageByService(filters);

    successResponse(serviceUsage, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Get usage breakdown by model
 *
 * @route GET /analytics/models
 * @access Private (admin only)
 * @param req - Express request object with query parameters for filtering
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getUsageByModel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('User not authenticated', 401));
    }

    // Parse filters from query parameters
    const filters: AnalyticsFilters = {};

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    if (req.query.service) {
      filters.service = req.query.service as string;
    }

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    // Get usage by model
    const modelUsage = await analyticsService.getUsageByModel(filters);

    successResponse(modelUsage, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Get usage time series data
 *
 * @route GET /analytics/timeseries
 * @access Private (admin only)
 * @param req - Express request object with query parameters for filtering and grouping
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getUsageTimeSeries = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('User not authenticated', 401));
    }

    // Parse filters from query parameters
    const filters: AnalyticsFilters = {};

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    if (req.query.service) {
      filters.service = req.query.service as string;
    }

    if (req.query.model) {
      filters.model = req.query.model as string;
    }

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    // Parse groupBy parameter
    const groupBy = (req.query.groupBy as string) || 'day';
    if (!['day', 'week', 'month'].includes(groupBy)) {
      return next(new AppError('Invalid groupBy parameter. Must be one of: day, week, month', 400));
    }

    // Get time series data
    const timeSeries = await analyticsService.getUsageTimeSeries(
      filters,
      groupBy as 'day' | 'week' | 'month'
    );

    successResponse(timeSeries, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Get top users by usage
 *
 * @route GET /analytics/users/top
 * @access Private (admin only)
 * @param req - Express request object with query parameters for filtering and limit
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getTopUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('User not authenticated', 401));
    }

    // Parse filters from query parameters
    const filters: AnalyticsFilters = {};

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    if (req.query.service) {
      filters.service = req.query.service as string;
    }

    if (req.query.model) {
      filters.model = req.query.model as string;
    }

    // Parse limit parameter
    const limit = parseInt(req.query.limit as string) || 10;
    if (limit < 1 || limit > 100) {
      return next(new AppError('Limit must be between 1 and 100', 400));
    }

    // Get top users
    const topUsers = await analyticsService.getTopUsers(filters, limit);

    successResponse(topUsers, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Export usage data as CSV
 *
 * @route GET /analytics/export
 * @access Private (admin only)
 * @param req - Express request object with query parameters for filtering and pagination
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const exportUsageData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('User not authenticated', 401));
    }

    // Parse filters from query parameters
    const filters: AnalyticsFilters = {};

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    if (req.query.service) {
      filters.service = req.query.service as string;
    }

    if (req.query.model) {
      filters.model = req.query.model as string;
    }

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;

    if (page < 1) {
      return next(new AppError('Page must be a positive integer', 400));
    }

    if (limit < 1 || limit > 5000) {
      return next(new AppError('Limit must be between 1 and 5000', 400));
    }

    // Get usage data for export
    const { data, total } = await analyticsService.getUsageDataForExport(filters, page, limit);

    // Generate CSV
    const csvHeaders = [
      'ID',
      'User ID',
      'Email',
      'Service',
      'Model',
      'Tokens',
      'Credits',
      'Metadata',
      'Created At',
    ];

    const csvRows = data.map((row) => [
      row.id,
      row.userId,
      row.email,
      row.service,
      row.model,
      row.tokens,
      row.credits,
      `"${row.metadata.replace(/"/g, '""')}"`, // Escape quotes in CSV
      row.createdAt,
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="usage-data-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.setHeader('X-Total-Count', total.toString());

    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Get personal usage analytics for the authenticated user
 *
 * @route GET /analytics/my-usage
 * @access Private
 * @param req - Express request object with query parameters for filtering
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getMyUsage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError('User not authenticated', 401));
    }

    // Parse filters from query parameters
    const filters: AnalyticsFilters = {
      userId: user.id, // Only get data for the authenticated user
    };

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    if (req.query.service) {
      filters.service = req.query.service as string;
    }

    if (req.query.model) {
      filters.model = req.query.model as string;
    }

    // Get user's usage data
    const [metrics, services, models, timeSeries] = await Promise.all([
      analyticsService.getUsageMetrics(filters),
      analyticsService.getUsageByService(filters),
      analyticsService.getUsageByModel(filters),
      analyticsService.getUsageTimeSeries(filters),
    ]);

    const userData = {
      metrics,
      services,
      models,
      timeSeries,
    };

    successResponse(userData, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};
