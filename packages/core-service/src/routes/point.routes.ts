import { Router } from 'express';
import { authenticateJWT } from '@smart-ai-hub/shared';
import { requirePermission, requireRoles } from '../middlewares/rbac.middleware';
import { authenticateServiceRequest } from '../middlewares/service-auth.middleware';
import { rateLimiter, strictRateLimiter } from '../middlewares/rateLimiter';
import * as pointController from '../controllers/point.controller';

const router = Router();

/**
 * @route   GET /points/balance
 * @desc    Get current user's point balance
 * @access  Private (JWT required)
 */
router.get(
  '/points/balance',
  rateLimiter,
  authenticateJWT,
  requirePermission('points', 'read'),
  pointController.getBalance
);

/**
 * @route   GET /points/history
 * @desc    Get current user's point history
 * @access  Private (JWT required)
 */
router.get(
  '/points/history',
  rateLimiter,
  authenticateJWT,
  requirePermission('points', 'read'),
  pointController.getHistory
);

/**
 * @route   POST /points/exchange-from-credits
 * @desc    Exchange Credits to Points (manual)
 * @access  Private (JWT required)
 */
router.post(
  '/points/exchange-from-credits',
  strictRateLimiter,
  authenticateJWT,
  requirePermission('points', 'write'),
  pointController.exchangeCreditsToPoints
);

/**
 * @route   POST /points/purchase
 * @desc    Purchase Points with real money
 * @access  Private (JWT required)
 */
router.post(
  '/points/purchase',
  strictRateLimiter,
  authenticateJWT,
  requirePermission('points', 'write'),
  pointController.purchasePoints
);

/**
 * @route   POST /points/deduct
 * @desc    Deduct Points (internal, checks auto top-up first)
 * @access  Private (requires service authentication)
 */
router.post(
  '/mcp/v1/points/deduct',
  rateLimiter,
  authenticateServiceRequest,
  pointController.deductPoints
);

/**
 * @route   POST /points/claim-daily-reward
 * @desc    Claim daily login reward
 * @access  Private (JWT required)
 */
router.post(
  '/points/claim-daily-reward',
  rateLimiter,
  authenticateJWT,
  requirePermission('points', 'write'),
  pointController.claimDailyReward
);

/**
 * @route   GET /points/daily-reward-status
 * @desc    Check daily reward status
 * @access  Private (JWT required)
 */
router.get(
  '/points/daily-reward-status',
  rateLimiter,
  authenticateJWT,
  requirePermission('points', 'read'),
  pointController.getDailyRewardStatus
);

/**
 * @route   GET /wallet/balance
 * @desc    Get both Credits and Points balance
 * @access  Private (JWT required)
 */
router.get(
  '/wallet/balance',
  rateLimiter,
  authenticateJWT,
  requirePermission('credits', 'read'),
  pointController.getWalletBalance
);

/**
 * @route   POST /admin/points/adjust
 * @desc    Adjust user points (admin only)
 * @access  Private (admin only)
 */
router.post(
  '/admin/points/adjust',
  rateLimiter,
  authenticateJWT,
  requireRoles(['admin', 'superadmin']),
  pointController.adjustPoints
);

/**
 * @route   GET /admin/exchange-rates
 * @desc    View all exchange rates (admin only)
 * @access  Private (admin only)
 */
router.get(
  '/admin/exchange-rates',
  rateLimiter,
  authenticateJWT,
  requireRoles(['admin', 'superadmin']),
  pointController.getExchangeRates
);

/**
 * @route   PUT /admin/exchange-rates/:name
 * @desc    Update exchange rate (admin only)
 * @access  Private (admin only)
 */
router.put(
  '/admin/exchange-rates/:name',
  rateLimiter,
  authenticateJWT,
  requireRoles(['admin', 'superadmin']),
  pointController.updateExchangeRate
);

/**
 * @route   GET /admin/points/stats
 * @desc    Get Points statistics (admin only)
 * @access  Private (admin only)
 */
router.get(
  '/admin/points/stats',
  rateLimiter,
  authenticateJWT,
  requireRoles(['admin', 'superadmin']),
  pointController.getPointsStats
);

/**
 * @route   GET /admin/auto-topup/stats
 * @desc    Get auto top-up statistics (admin only)
 * @access  Private (admin only)
 */
router.get(
  '/admin/auto-topup/stats',
  rateLimiter,
  authenticateJWT,
  requireRoles(['admin', 'superadmin']),
  pointController.getAutoTopupStats
);

export default router;