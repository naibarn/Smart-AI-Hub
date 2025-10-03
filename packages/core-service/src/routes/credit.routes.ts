import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requirePermission, requireRoles } from '../middlewares/rbac.middleware';
import * as creditController from '../controllers/credit.controller';

const router = Router();

/**
 * @route   GET /credits/balance
 * @desc    Get current user's credit balance
 * @access  Private (JWT required)
 */
router.get('/credits/balance', authenticateJWT, requirePermission('credits', 'read'), creditController.getBalance);

/**
 * @route   GET /credits/history
 * @desc    Get current user's credit history
 * @access  Private (JWT required)
 */
router.get('/credits/history', authenticateJWT, requirePermission('credits', 'read'), creditController.getHistory);

/**
 * @route   POST /credits/redeem
 * @desc    Redeem promo code for credits
 * @access  Private (JWT required)
 */
router.post('/credits/redeem', authenticateJWT, requirePermission('credits', 'write'), creditController.redeemPromoCode);

/**
 * @route   POST /admin/credits/adjust
 * @desc    Adjust user credits (admin only)
 * @access  Private (requires credits:adjust permission)
 */
router.post('/admin/credits/adjust', authenticateJWT, requireRoles(['admin', 'superadmin']), creditController.adjustCredits);

/**
 * @route   GET /admin/credits/:userId
 * @desc    Get user credit information (admin only)
 * @access  Private (requires credits:read permission)
 */
router.get('/admin/credits/:userId', authenticateJWT, requirePermission('credits', 'read'), creditController.getUserCredits);

export default router;
