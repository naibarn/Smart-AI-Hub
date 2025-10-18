import { PrismaClient } from '@prisma/client';
import * as userProfileService from '../../services/user-profile.service';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
  })),
}));

describe('User Profile Service', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('getUserProfile', () => {
    it('should return user profile when found', async () => {
      const userId = 'user-1';
      const mockProfile = {
        userId,
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        preferences: { theme: 'dark' },
        updatedAt: new Date(),
      };

      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userProfileService.getUserProfile(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfile);
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return error when profile not found', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userProfileService.getUserProfile('non-existent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Profile not found');
    });

    it('should handle database errors', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userProfileService.getUserProfile('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get user profile');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'user-1';
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        avatarUrl: 'https://example.com/new-avatar.jpg',
      };

      const mockExistingProfile = {
        userId,
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/old-avatar.jpg',
        preferences: { theme: 'light' },
        updatedAt: new Date(),
      };

      const mockUpdatedProfile = {
        ...mockExistingProfile,
        ...updateData,
        updatedAt: new Date(),
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
      (prisma.userProfile.upsert as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const result = await userProfileService.updateUserProfile(userId, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedProfile);
      expect(prisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: updateData,
        create: { userId, ...updateData },
      });
    });

    it('should return error if user not found', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userProfileService.updateUserProfile('non-existent-user', {
        firstName: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle database errors when updating', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userProfileService.updateUserProfile('user-1', { firstName: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update user profile');
    });
  });

  describe('getProfileCompletionPercentage', () => {
    it('should return profile completion percentage', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
      };
      const mockProfile = {
        userId,
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        preferences: { theme: 'dark', language: 'en' },
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userProfileService.getProfileCompletionPercentage(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeGreaterThan(0);
      expect(typeof result.data).toBe('number');
    });

    it('should return lower percentage for incomplete profile', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
      };
      const mockProfile = {
        userId,
        firstName: null,
        lastName: null,
        avatarUrl: null,
        preferences: {},
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userProfileService.getProfileCompletionPercentage(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeLessThan(100);
      expect(typeof result.data).toBe('number');
    });

    it('should return error when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userProfileService.getProfileCompletionPercentage('non-existent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences successfully', async () => {
      const userId = 'user-1';
      const preferences = {
        theme: 'dark',
        language: 'th',
        notifications: true,
      };

      const mockUser = {
        id: userId,
        email: 'test@example.com',
      };

      const mockProfile = {
        userId,
        firstName: 'John',
        lastName: 'Doe',
        preferences: { theme: 'light' },
        updatedAt: new Date(),
      };

      const mockUpdatedProfile = {
        ...mockProfile,
        preferences: { ...mockProfile.preferences, ...preferences },
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.userProfile.upsert as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const result = await userProfileService.updateUserPreferences(userId, preferences);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedProfile);
      expect(prisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: {
          preferences: { ...mockProfile.preferences, ...preferences },
          updatedAt: expect.any(Date),
        },
        create: {
          userId,
          preferences: { ...mockProfile.preferences, ...preferences },
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should return error when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userProfileService.updateUserPreferences('non-existent-user', {
        theme: 'dark',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle database errors when updating preferences', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userProfileService.updateUserPreferences('user-1', { theme: 'dark' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update user preferences');
    });
  });

  describe('getUserPreferences', () => {
    it('should get user preferences successfully', async () => {
      const userId = 'user-1';
      const mockProfile = {
        userId,
        preferences: { theme: 'dark', language: 'en' },
      };

      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userProfileService.getUserPreferences(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ theme: 'dark', language: 'en' });
    });

    it('should return empty object when preferences not set', async () => {
      const userId = 'user-1';
      const mockProfile = {
        userId,
        preferences: null,
      };

      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userProfileService.getUserPreferences(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should return error when profile not found', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userProfileService.getUserPreferences('non-existent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User profile not found');
    });
  });

  describe('uploadUserAvatar', () => {
    it('should upload user avatar successfully', async () => {
      const userId = 'user-1';
      const avatarUrl = 'https://example.com/new-avatar.jpg';
      const mockUser = { id: userId };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userProfile.upsert as jest.Mock).mockResolvedValue({ userId, avatarUrl });

      const result = await userProfileService.uploadUserAvatar(userId, avatarUrl);

      expect(result.success).toBe(true);
      expect(result.data).toBe(avatarUrl);
    });

    it('should return error for invalid URL', async () => {
      const userId = 'user-1';
      const avatarUrl = 'invalid-url';

      const result = await userProfileService.uploadUserAvatar(userId, avatarUrl);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid avatar URL');
    });

    it('should return error when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userProfileService.uploadUserAvatar(
        'non-existent-user',
        'https://example.com/avatar.jpg'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('deleteUserAvatar', () => {
    it('should delete user avatar successfully', async () => {
      const userId = 'user-1';
      const mockUser = { id: userId };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userProfile.upsert as jest.Mock).mockResolvedValue({ userId, avatarUrl: null });

      const result = await userProfileService.deleteUserAvatar(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should return error when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userProfileService.deleteUserAvatar('non-existent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });
});
