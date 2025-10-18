import { Router } from 'express';
import { authenticateJWT, requirePermission, requireSelfOrRole } from '@smart-ai-hub/shared';
import * as userController from '../controllers/user.controller';
import {
  validateCreateUser,
  validateUpdateProfile,
  validateUserSearch,
  validateBulkUserOperation,
  attachUserToRequest,
  requireUserAccess,
  requireUserModificationAccess,
  validateAccountStatusChange,
} from '../middlewares/user.middleware';
import userAuditRoutes from './user-audit.routes';

const router = Router();

/**
 * @route   GET /users/me
 * @desc    Get current user profile
 * @access  Private (JWT required)
 */
router.get('/users/me', authenticateJWT, userController.getCurrentUser);

/**
 * @route   PUT /users/me
 * @desc    Update current user profile
 * @access  Private (JWT required)
 */
router.put('/users/me', authenticateJWT, validateUpdateProfile, userController.updateCurrentUser);

/**
 * @route   GET /users
 * @desc    Search and filter users
 * @access  Private (admin only)
 */
router.get(
  '/users',
  authenticateJWT,
  requirePermission('users', 'read'),
  validateUserSearch,
  userController.searchUsers
);

/**
 * @route   POST /users
 * @desc    Create a new user
 * @access  Private (admin only)
 */
router.post(
  '/users',
  authenticateJWT,
  requirePermission('users', 'create'),
  validateCreateUser,
  userController.createUser
);

/**
 * @route   GET /users/statistics
 * @desc    Get user statistics
 * @access  Private (admin only)
 */
router.get(
  '/users/statistics',
  authenticateJWT,
  requirePermission('users', 'read'),
  userController.getUserStatistics
);

/**
 * @route   POST /users/bulk
 * @desc    Perform bulk operations on users
 * @access  Private (admin only)
 */
router.post(
  '/users/bulk',
  authenticateJWT,
  requirePermission('users', 'update'),
  validateBulkUserOperation,
  userController.bulkUserOperation
);

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Private (admin or self-access)
 */
router.get(
  '/users/:id',
  authenticateJWT,
  attachUserToRequest,
  requireUserAccess,
  userController.getUserById
);

/**
 * @route   PUT /users/:id
 * @desc    Update user profile
 * @access  Private (admin only)
 */
router.put(
  '/users/:id',
  authenticateJWT,
  requirePermission('users', 'update'),
  attachUserToRequest,
  requireUserModificationAccess,
  validateUpdateProfile,
  userController.updateUser
);

/**
 * @route   POST /users/:id/deactivate
 * @desc    Deactivate user account
 * @access  Private (admin only)
 */
router.post(
  '/users/:id/deactivate',
  authenticateJWT,
  requirePermission('users', 'deactivate'),
  attachUserToRequest,
  requireUserModificationAccess,
  validateAccountStatusChange,
  userController.deactivateUser
);

/**
 * @route   POST /users/:id/reactivate
 * @desc    Reactivate user account
 * @access  Private (admin only)
 */
router.post(
  '/users/:id/reactivate',
  authenticateJWT,
  requirePermission('users', 'reactivate'),
  attachUserToRequest,
  requireUserModificationAccess,
  validateAccountStatusChange,
  userController.reactivateUser
);

/**
 * @route   DELETE /users/:id
 * @desc    Delete a user
 * @access  Private (admin only)
 */
router.delete(
  '/users/:id',
  authenticateJWT,
  requirePermission('users', 'delete'),
  attachUserToRequest,
  requireUserModificationAccess,
  userController.deleteUser
);

// User audit routes
router.use('/user-audit', userAuditRoutes);

export default router;
