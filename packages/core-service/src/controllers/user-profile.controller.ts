import { Request, Response, NextFunction } from 'express';
import { AppError, AuthenticatedRequest, UpdateProfileRequest } from '@smart-ai-hub/shared';
import * as userProfileService from '../services/user-profile.service';

/**
 * Get current user's profile
 */
export const getCurrentUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const profileResult = await userProfileService.getUserProfile(userId);
    if (!profileResult.success || !profileResult.data) {
      return next(new AppError(profileResult.error || 'Failed to get user profile', 400));
    }

    res.status(200).json({
      success: true,
      data: profileResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's profile with additional user data
 */
export const getCurrentUserProfileWithUserData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const profileResult = await userProfileService.getUserProfileWithUserData(userId);
    if (!profileResult.success || !profileResult.data) {
      return next(new AppError(profileResult.error || 'Failed to get user profile', 400));
    }

    res.status(200).json({
      success: true,
      data: profileResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's profile
 */
export const updateCurrentUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const profileData: UpdateProfileRequest = req.body;
    if (Object.keys(profileData).length === 0) {
      return next(new AppError('At least one field must be provided for update', 400));
    }

    const updateResult = await userProfileService.updateUserProfile(userId, profileData);
    if (!updateResult.success || !updateResult.data) {
      return next(new AppError(updateResult.error || 'Failed to update profile', 400));
    }

    res.status(200).json({
      success: true,
      data: updateResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const preferencesResult = await userProfileService.getUserPreferences(userId);
    if (!preferencesResult.success) {
      return next(new AppError(preferencesResult.error || 'Failed to get user preferences', 400));
    }

    res.status(200).json({
      success: true,
      data: preferencesResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const preferences = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return next(new AppError('Preferences must be a valid object', 400));
    }

    const updateResult = await userProfileService.updateUserPreferences(userId, preferences);
    if (!updateResult.success || !updateResult.data) {
      return next(new AppError(updateResult.error || 'Failed to update user preferences', 400));
    }

    res.status(200).json({
      success: true,
      data: updateResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload user avatar
 */
export const uploadUserAvatar = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { avatarUrl } = req.body;
    if (!avatarUrl) {
      return next(new AppError('Avatar URL is required', 400));
    }

    const uploadResult = await userProfileService.uploadUserAvatar(userId, avatarUrl);
    if (!uploadResult.success || !uploadResult.data) {
      return next(new AppError(uploadResult.error || 'Failed to upload user avatar', 400));
    }

    res.status(200).json({
      success: true,
      data: { avatarUrl: uploadResult.data },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user avatar
 */
export const deleteUserAvatar = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const deleteResult = await userProfileService.deleteUserAvatar(userId);
    if (!deleteResult.success) {
      return next(new AppError(deleteResult.error || 'Failed to delete user avatar', 400));
    }

    res.status(200).json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get profile completion percentage
 */
export const getProfileCompletionPercentage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const completionResult = await userProfileService.getProfileCompletionPercentage(userId);
    if (!completionResult.success || completionResult.data === undefined) {
      return next(
        new AppError(completionResult.error || 'Failed to get profile completion percentage', 400)
      );
    }

    res.status(200).json({
      success: true,
      data: { completionPercentage: completionResult.data },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile by ID (admin only)
 */
export const getUserProfileById = async (
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

    // Check if user has admin role or is accessing their own profile
    const isAdmin = req.user?.roles.some((role) => ['admin', 'administrator'].includes(role.name));
    const isSelfAccess = currentUserId === id;

    if (!isAdmin && !isSelfAccess) {
      return next(new AppError('Insufficient permissions', 403));
    }

    const profileResult = await userProfileService.getUserProfileWithUserData(id);
    if (!profileResult.success || !profileResult.data) {
      return next(new AppError(profileResult.error || 'User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: profileResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile by ID (admin only)
 */
export const updateUserProfileById = async (
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

    // Check if user has admin role
    const isAdmin = req.user?.roles.some((role) => ['admin', 'administrator'].includes(role.name));
    if (!isAdmin) {
      return next(new AppError('Insufficient permissions', 403));
    }

    const profileData: UpdateProfileRequest = req.body;
    if (Object.keys(profileData).length === 0) {
      return next(new AppError('At least one field must be provided for update', 400));
    }

    const updateResult = await userProfileService.updateUserProfile(id, profileData);
    if (!updateResult.success || !updateResult.data) {
      return next(new AppError(updateResult.error || 'Failed to update user profile', 400));
    }

    res.status(200).json({
      success: true,
      data: updateResult.data,
    });
  } catch (error) {
    next(error);
  }
};
