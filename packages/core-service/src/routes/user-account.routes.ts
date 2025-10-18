import { Router } from 'express';
import { authenticateJWT, requirePermission } from '@smart-ai-hub/shared';
import * as userAccountController from '../controllers/user-account.controller';
import { validateAccountStatusChange } from '../middlewares/user.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// User account management routes

/**
 * @route   POST /accounts/:id/deactivate
 * @desc    Deactivate user account
 * @access  Private (admin only)
 */
router.post(
  '/accounts/:id/deactivate',
  requirePermission('users', 'deactivate'),
  validateAccountStatusChange,
  userAccountController.deactivateUser
);

/**
 * @route   POST /accounts/:id/reactivate
 * @desc    Reactivate user account
 * @access  Private (admin only)
 */
router.post(
  '/accounts/:id/reactivate',
  requirePermission('users', 'reactivate'),
  validateAccountStatusChange,
  userAccountController.reactivateUser
);

/**
 * @route   GET /accounts/:id/logs
 * @desc    Get user block logs
 * @access  Private (admin or self-access)
 */
router.get('/accounts/:id/logs', userAccountController.getUserBlockLogs);

/**
 * @route   GET /accounts/logs
 * @desc    Get all block logs
 * @access  Private (admin only)
 */
router.get(
  '/accounts/logs',
  requirePermission('users', 'read'),
  userAccountController.getAllBlockLogs
);

/**
 * @route   GET /accounts/statistics/blocked
 * @desc    Get blocked users statistics
 * @access  Private (admin only)
 */
router.get(
  '/accounts/statistics/blocked',
  requirePermission('users', 'read'),
  userAccountController.getBlockedUsersStatistics
);

// Bulk operations

/**
 * @route   POST /accounts/bulk/deactivate
 * @desc    Bulk deactivate users
 * @access  Private (admin only)
 */
router.post(
  '/accounts/bulk/deactivate',
  requirePermission('users', 'deactivate'),
  validateAccountStatusChange,
  userAccountController.bulkDeactivateUsers
);

/**
 * @route   POST /accounts/bulk/reactivate
 * @desc    Bulk reactivate users
 * @access  Private (admin only)
 */
router.post(
  '/accounts/bulk/reactivate',
  requirePermission('users', 'reactivate'),
  validateAccountStatusChange,
  userAccountController.bulkReactivateUsers
);

export default router;
