import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';
import { addRequestStartTime } from '../middlewares/analytics.middleware';

const router = Router();

// Apply request timing middleware to all analytics routes
router.use(addRequestStartTime);

// Apply authentication middleware to all analytics routes
router.use(authenticateJWT);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get comprehensive dashboard data for analytics
 * @access Private (admin only)
 */
router.get('/dashboard', analyticsController.getDashboard);

/**
 * @route GET /api/analytics/metrics
 * @desc Get usage metrics with optional filters
 * @access Private (admin only)
 */
router.get('/metrics', analyticsController.getUsageMetrics);

/**
 * @route GET /api/analytics/services
 * @desc Get usage breakdown by service
 * @access Private (admin only)
 */
router.get('/services', analyticsController.getUsageByService);

/**
 * @route GET /api/analytics/models
 * @desc Get usage breakdown by model
 * @access Private (admin only)
 */
router.get('/models', analyticsController.getUsageByModel);

/**
 * @route GET /api/analytics/timeseries
 * @desc Get usage time series data
 * @access Private (admin only)
 */
router.get('/timeseries', analyticsController.getUsageTimeSeries);

/**
 * @route GET /api/analytics/users/top
 * @desc Get top users by usage
 * @access Private (admin only)
 */
router.get('/users/top', analyticsController.getTopUsers);

/**
 * @route GET /api/analytics/export
 * @desc Export usage data as CSV
 * @access Private (admin only)
 */
router.get('/export', analyticsController.exportUsageData);

/**
 * @route GET /api/analytics/my-usage
 * @desc Get personal usage analytics for the authenticated user
 * @access Private
 */
router.get('/my-usage', analyticsController.getMyUsage);

export default router;