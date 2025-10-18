import { Router } from 'express';
import { authenticateJWT, requirePermission } from '@smart-ai-hub/shared';
import * as userProfileController from '../controllers/user-profile.controller';
import { validateUpdateProfile } from '../middlewares/user.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * @route   GET /profile/me
 * @desc    Get current user's profile
 * @access  Private (JWT required)
 */
router.get('/profile/me', userProfileController.getCurrentUserProfile);

/**
 * @route   GET /profile/me/full
 * @desc    Get current user's profile with additional user data
 * @access  Private (JWT required)
 */
router.get('/profile/me/full', userProfileController.getCurrentUserProfileWithUserData);

/**
 * @route   PUT /profile/me
 * @desc    Update current user's profile
 * @access  Private (JWT required)
 */
router.put('/profile/me', validateUpdateProfile, userProfileController.updateCurrentUserProfile);

/**
 * @route   GET /profile/me/preferences
 * @desc    Get current user's preferences
 * @access  Private (JWT required)
 */
router.get('/profile/me/preferences', userProfileController.getUserPreferences);

/**
 * @route   PUT /profile/me/preferences
 * @desc    Update current user's preferences
 * @access  Private (JWT required)
 */
router.put('/profile/me/preferences', userProfileController.updateUserPreferences);

/**
 * @route   POST /profile/me/avatar
 * @desc    Upload user avatar
 * @access  Private (JWT required)
 */
router.post('/profile/me/avatar', userProfileController.uploadUserAvatar);

/**
 * @route   DELETE /profile/me/avatar
 * @desc    Delete user avatar
 * @access  Private (JWT required)
 */
router.delete('/profile/me/avatar', userProfileController.deleteUserAvatar);

/**
 * @route   GET /profile/me/completion
 * @desc    Get profile completion percentage
 * @access  Private (JWT required)
 */
router.get('/profile/me/completion', userProfileController.getProfileCompletionPercentage);

// Admin-only routes

/**
 * @route   GET /profile/:id
 * @desc    Get user profile by ID
 * @access  Private (admin only)
 */
router.get('/profile/:id', userProfileController.getUserProfileById);

/**
 * @route   PUT /profile/:id
 * @desc    Update user profile by ID
 * @access  Private (admin only)
 */
router.put(
  '/profile/:id',
  requirePermission('users', 'update'),
  validateUpdateProfile,
  userProfileController.updateUserProfileById
);

export default router;
