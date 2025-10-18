import { PrismaClient, User, UserProfile } from '@prisma/client';
import {
  AppError,
  AuthenticatedRequest,
  UpdateProfileRequest,
  UserProfile as UserProfileType,
  UserServiceResponse,
  UserValidationError,
} from '@smart-ai-hub/shared';
import { createClient } from 'redis';

const prisma = new PrismaClient();
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
redisClient.connect().catch(console.error);

/**
 * Get user profile by user ID
 */
export const getUserProfile = async (
  userId: string
): Promise<UserServiceResponse<UserProfileType>> => {
  try {
    // Check cache first
    const cacheKey = `user_profile:${userId}`;
    const cachedProfile = await redisClient.get(cacheKey);

    if (cachedProfile) {
      return {
        success: true,
        data: JSON.parse(cachedProfile),
      };
    }

    // Get user profile from database
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    // Cache the result
    await redisClient.setEx(cacheKey, 300, JSON.stringify(userProfile)); // 5 minutes

    return {
      success: true,
      data: userProfile as UserProfileType,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      success: false,
      error: 'Failed to get user profile',
    };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  profileData: UpdateProfileRequest
): Promise<UserServiceResponse<UserProfileType>> => {
  try {
    const validationErrors: UserValidationError[] = [];

    // Validate profile data
    if (profileData.firstName && profileData.firstName.length > 100) {
      validationErrors.push({
        field: 'firstName',
        message: 'First name must be less than 100 characters',
        code: 'FIELD_TOO_LONG',
      });
    }

    if (profileData.lastName && profileData.lastName.length > 100) {
      validationErrors.push({
        field: 'lastName',
        message: 'Last name must be less than 100 characters',
        code: 'FIELD_TOO_LONG',
      });
    }

    if (profileData.avatarUrl) {
      try {
        new URL(profileData.avatarUrl);
      } catch {
        validationErrors.push({
          field: 'avatarUrl',
          message: 'Invalid URL format',
          code: 'INVALID_FORMAT',
        });
      }
    }

    if (profileData.phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(profileData.phone)) {
        validationErrors.push({
          field: 'phone',
          message: 'Invalid phone number format',
          code: 'INVALID_FORMAT',
        });
      }
    }

    if (profileData.dateOfBirth) {
      const dob = new Date(profileData.dateOfBirth);
      const now = new Date();
      const minAge = 13;
      const maxAge = 120;

      if (isNaN(dob.getTime())) {
        validationErrors.push({
          field: 'dateOfBirth',
          message: 'Invalid date format',
          code: 'INVALID_FORMAT',
        });
      } else {
        const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < minAge || age > maxAge) {
          validationErrors.push({
            field: 'dateOfBirth',
            message: `Age must be between ${minAge} and ${maxAge} years`,
            code: 'INVALID_AGE',
          });
        }
      }
    }

    if (profileData.timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: profileData.timezone });
      } catch {
        validationErrors.push({
          field: 'timezone',
          message: 'Invalid timezone',
          code: 'INVALID_TIMEZONE',
        });
      }
    }

    if (profileData.language) {
      const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
      if (!languageRegex.test(profileData.language)) {
        validationErrors.push({
          field: 'language',
          message: 'Invalid language format (e.g., en, en-US)',
          code: 'INVALID_FORMAT',
        });
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors,
      };
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Update or create user profile
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...profileData,
        updatedAt: new Date(),
      },
      create: {
        userId,
        ...profileData,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    const cacheKey = `user_profile:${userId}`;
    await redisClient.del(cacheKey);

    return {
      success: true,
      data: updatedProfile as UserProfileType,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: 'Failed to update user profile',
    };
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  userId: string,
  preferences: Record<string, any>
): Promise<UserServiceResponse<UserProfileType>> => {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Get current profile
    const currentProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // Merge preferences
    const currentPreferences =
      typeof currentProfile?.preferences === 'object' ? currentProfile.preferences : {};
    const mergedPreferences = {
      ...currentPreferences,
      ...preferences,
    };

    // Update or create user profile
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        preferences: mergedPreferences,
        updatedAt: new Date(),
      },
      create: {
        userId,
        preferences: mergedPreferences,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    const cacheKey = `user_profile:${userId}`;
    await redisClient.del(cacheKey);

    return {
      success: true,
      data: updatedProfile as UserProfileType,
    };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return {
      success: false,
      error: 'Failed to update user preferences',
    };
  }
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (
  userId: string
): Promise<UserServiceResponse<Record<string, any>>> => {
  try {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true },
    });

    if (!userProfile) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    return {
      success: true,
      data:
        userProfile.preferences && typeof userProfile.preferences === 'object'
          ? (userProfile.preferences as Record<string, any>)
          : {},
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      success: false,
      error: 'Failed to get user preferences',
    };
  }
};

/**
 * Upload user avatar
 */
export const uploadUserAvatar = async (
  userId: string,
  avatarUrl: string
): Promise<UserServiceResponse<string>> => {
  try {
    // Validate URL
    try {
      new URL(avatarUrl);
    } catch {
      return {
        success: false,
        error: 'Invalid avatar URL',
      };
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Update avatar URL
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        avatarUrl,
        updatedAt: new Date(),
      },
      create: {
        userId,
        avatarUrl,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    const cacheKey = `user_profile:${userId}`;
    await redisClient.del(cacheKey);

    return {
      success: true,
      data: avatarUrl,
    };
  } catch (error) {
    console.error('Error uploading user avatar:', error);
    return {
      success: false,
      error: 'Failed to upload user avatar',
    };
  }
};

/**
 * Delete user avatar
 */
export const deleteUserAvatar = async (userId: string): Promise<UserServiceResponse<null>> => {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Remove avatar URL
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        avatarUrl: null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        avatarUrl: null,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    const cacheKey = `user_profile:${userId}`;
    await redisClient.del(cacheKey);

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error('Error deleting user avatar:', error);
    return {
      success: false,
      error: 'Failed to delete user avatar',
    };
  }
};

/**
 * Get user profile completion percentage
 */
export const getProfileCompletionPercentage = async (
  userId: string
): Promise<UserServiceResponse<number>> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    let completedFields = 0;
    const totalFields = 7; // Total number of profile fields to track

    // Check email (always present)
    completedFields++;

    // Check profile fields
    if (userProfile?.firstName) completedFields++;
    if (userProfile?.lastName) completedFields++;
    if (userProfile?.avatarUrl) completedFields++;
    // Note: phone, dateOfBirth, and timezone are not in the Prisma UserProfile model
    // They would need to be added to the schema if we want to track them
    // For now, we'll just track the existing fields

    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    return {
      success: true,
      data: completionPercentage,
    };
  } catch (error) {
    console.error('Error getting profile completion percentage:', error);
    return {
      success: false,
      error: 'Failed to get profile completion percentage',
    };
  }
};

/**
 * Get user profile with additional user data
 */
export const getUserProfileWithUserData = async (
  userId: string
): Promise<UserServiceResponse<any>> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Transform the data to match the expected format
    const userProfileData = {
      id: user.id,
      email: user.email,
      verified: user.verified,
      tier: user.tier,
      isBlocked: user.isBlocked,
      blockedReason: user.blockedReason,
      blockedAt: user.blockedAt,
      blockedBy: user.blockedBy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      credits: user.credits,
      points: user.points,
      profile: user.profile,
      roles: user.userRoles.map((ur) => ur.role),
    };

    return {
      success: true,
      data: userProfileData,
    };
  } catch (error) {
    console.error('Error getting user profile with user data:', error);
    return {
      success: false,
      error: 'Failed to get user profile with user data',
    };
  }
};
