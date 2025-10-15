import { Router } from 'express';
import { authenticateJWT } from '@smart-ai-hub/shared';
import { requirePermission, requireRoles } from '../middlewares/rbac.middleware';
import { authenticateServiceRequest } from '../middlewares/service-auth.middleware';
import { rateLimiter, strictRateLimiter } from '../middlewares/rateLimiter';
import * as creditController from '../controllers/credit.controller';

const router = Router();

/**
 * @route   GET /credits/balance
 * @desc    Get current user's credit balance
 * @access  Private (JWT required)
 */
router.get(
  '/credits/balance',
  rateLimiter,
  authenticateJWT,
  requirePermission('credits', 'read'),
  creditController.getBalance
);

/**
 * @route   GET /credits/history
 * @desc    Get current user's credit history
 * @access  Private (JWT required)
 */
router.get(
  '/credits/history',
  rateLimiter,
  authenticateJWT,
  requirePermission('credits', 'read'),
  creditController.getHistory
);

/**
 * @route   POST /credits/redeem
 * @desc    Redeem promo code for credits
 * @access  Private (JWT required)
 */
router.post(
  '/credits/redeem',
  strictRateLimiter,
  authenticateJWT,
  requirePermission('credits', 'write'),
  creditController.redeemPromoCode
);

/**
 * @route   POST /admin/credits/adjust
 * @desc    Adjust user credits (admin only)
 * @access  Private (requires credits:adjust permission)
 */
router.post(
  '/admin/credits/adjust',
  rateLimiter,
  authenticateJWT,
  requireRoles(['admin', 'superadmin']),
  creditController.adjustCredits
);

/**
 * @route   GET /admin/credits/:userId
 * @desc    Get user credit information (admin only)
 * @access  Private (requires credits:read permission)
 */
router.get(
  '/admin/credits/:userId',
  rateLimiter,
  authenticateJWT,
  requirePermission('credits', 'read'),
  creditController.getUserCredits
);

/**
 * @route   POST /api/mcp/v1/credits/check
 * @desc    Check if user has sufficient credits for a service
 * @access  Private (requires service authentication)
 */
router.post('/mcp/v1/credits/check', rateLimiter, authenticateServiceRequest, creditController.checkCredits);

/**
 * @route   POST /api/mcp/v1/credits/deduct
 * @desc    Deduct credits from user account with transaction record
 * @access  Private (requires service authentication)
 */
router.post('/mcp/v1/credits/deduct', rateLimiter, authenticateServiceRequest, creditController.deductCredits);

export default router;
