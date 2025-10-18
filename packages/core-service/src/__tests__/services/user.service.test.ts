import { PrismaClient } from '@prisma/client';
import * as userService from '../../services/user.service';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
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

describe('User Service', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        verified: true,
        tier: 'general',
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: 100,
        points: 50,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getUserById('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: {
          profile: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    it('should return error when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userService.getUserById('non-existent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userService.getUserById('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get user');
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockCreatedUser = {
        id: 'new-user-id',
        email: userData.email,
        verified: false,
        tier: 'general',
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: 0,
        points: 0,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // Email not in use
      (prisma.$transaction as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await userService.createUser(userData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedUser);
    });

    it('should return error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-user' });

      const result = await userService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });

    it('should handle validation errors', async () => {
      const userData = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      const result = await userService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.length).toBeGreaterThan(0);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'user-1';
      const updateData = {
        firstName: 'Updated Name',
        lastName: 'Test',
      };

      const mockExistingUser = {
        id: userId,
        email: 'old@example.com',
      };

      const mockUpdatedProfile = {
        userId,
        firstName: 'Updated Name',
        lastName: 'Test',
      };

      const mockUserWithProfile = {
        id: userId,
        email: 'old@example.com',
        profile: mockUpdatedProfile,
        userRoles: [],
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (prisma.userProfile.upsert as jest.Mock).mockResolvedValue(mockUpdatedProfile);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserWithProfile);

      const result = await userService.updateUserProfile(userId, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserWithProfile);
    });

    it('should return error if user not found', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userService.updateUserProfile('non-existent-user', {
        firstName: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle database errors when updating profile', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userService.updateUserProfile('user-1', { firstName: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update user profile');
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      const searchOptions = {
        query: 'test',
        page: 1,
        limit: 10,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      const mockUsers = [
        {
          id: 'user-1',
          email: 'test1@example.com',
          verified: true,
          tier: 'general',
          isBlocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          credits: 100,
          points: 50,
        },
        {
          id: 'user-2',
          email: 'test2@example.com',
          verified: true,
          tier: 'admin',
          isBlocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          credits: 200,
          points: 100,
        },
      ];

      const mockTotal = 2;

      (prisma.user.count as jest.Mock).mockResolvedValue(mockTotal);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userService.searchUsers(searchOptions);

      expect(result.success).toBe(true);
      expect(result.data?.users).toEqual(mockUsers);
      expect(result.data?.total).toBe(mockTotal);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(10);
      expect(result.data?.totalPages).toBe(1);
    });

    it('should handle empty search results', async () => {
      const searchOptions = {
        query: 'nonexistent',
        page: 1,
        limit: 10,
      };

      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await userService.searchUsers(searchOptions);

      expect(result.success).toBe(true);
      expect(result.data?.users).toEqual([]);
      expect(result.data?.total).toBe(0);
    });

    it('should validate pagination parameters', async () => {
      const searchOptions = {
        page: 0, // Invalid
        limit: 101, // Invalid
      };

      const result = await userService.searchUsers(searchOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const userId = 'user-1';
      const deactivationData = {
        reason: 'Violation of terms',
        notifyUser: true,
      };
      const deactivatedBy = 'admin-1';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        isBlocked: false,
      };

      const mockDeactivatedUser = {
        ...mockUser,
        isBlocked: true,
        blockedReason: deactivationData.reason,
        blockedAt: new Date(),
        blockedBy: deactivatedBy,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockDeactivatedUser);

      const result = await userService.deactivateUser(userId, deactivationData, deactivatedBy);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDeactivatedUser);
    });

    it('should return error if user not found', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userService.deactivateUser(
        'non-existent-user',
        { reason: 'Reason' },
        'admin-1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should return error if user already blocked', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        isBlocked: true,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.deactivateUser('user-1', { reason: 'Reason' }, 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User is already deactivated');
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate user successfully', async () => {
      const userId = 'user-1';
      const reactivationData = {
        reason: 'Appeal approved',
        notifyUser: true,
      };
      const reactivatedBy = 'admin-1';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        isBlocked: true,
        blockedReason: 'Previous reason',
      };

      const mockReactivatedUser = {
        ...mockUser,
        isBlocked: false,
        blockedReason: null,
        blockedAt: null,
        blockedBy: null,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockReactivatedUser);

      const result = await userService.reactivateUser(userId, reactivationData, reactivatedBy);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReactivatedUser);
    });

    it('should return error if user not found', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userService.reactivateUser(
        'non-existent-user',
        { reason: 'Reason' },
        'admin-1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should return error if user already active', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        isBlocked: false,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.reactivateUser('user-1', { reason: 'Reason' }, 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User is not deactivated');
    });
  });

  describe('getUserStatistics', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 90,
        blockedUsers: 10,
        verifiedUsers: 80,
        usersByTier: {
          general: 70,
          admin: 5,
          agency: 15,
          organization: 8,
          administrator: 2,
        },
        recentRegistrations: 5,
        recentActivity: 20,
      };

      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(mockStats.totalUsers)
        .mockResolvedValueOnce(mockStats.activeUsers)
        .mockResolvedValueOnce(mockStats.blockedUsers)
        .mockResolvedValueOnce(mockStats.verifiedUsers);

      // Mock tier counts
      (prisma.user.groupBy as jest.Mock).mockResolvedValueOnce([
        { tier: 'general', _count: { tier: 70 } },
        { tier: 'admin', _count: { tier: 5 } },
        { tier: 'agency', _count: { tier: 15 } },
        { tier: 'organization', _count: { tier: 8 } },
        { tier: 'administrator', _count: { tier: 2 } },
      ]);

      // Mock recent registrations and activity
      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(mockStats.recentRegistrations)
        .mockResolvedValueOnce(mockStats.recentActivity);

      const result = await userService.getUserStatistics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });

    it('should handle database errors', async () => {
      (prisma.user.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userService.getUserStatistics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get user statistics');
    });
  });

  describe('bulkUserOperation', () => {
    it('should perform bulk deactivation successfully', async () => {
      const operationData = {
        userIds: ['user-1', 'user-2'],
        operation: 'deactivate' as const,
        reason: 'Bulk deactivation',
      };
      const performedBy = 'admin-1';

      // Mock the transaction for each user
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      const mockUser1 = { id: 'user-1', isBlocked: false };
      const mockUser2 = { id: 'user-2', isBlocked: false };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2);

      (prisma.user.update as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser1, isBlocked: true })
        .mockResolvedValueOnce({ ...mockUser2, isBlocked: true });

      const result = await userService.bulkUserOperation(operationData, performedBy);

      expect(result.success).toBe(true);
      expect(result.data?.successful).toEqual(['user-1', 'user-2']);
      expect(result.data?.failed).toEqual([]);
      expect(result.data?.totalProcessed).toBe(2);
      expect(result.data?.successCount).toBe(2);
      expect(result.data?.failureCount).toBe(0);
    });

    it('should handle mixed success and failure in bulk operations', async () => {
      const operationData = {
        userIds: ['user-1', 'user-2', 'user-3'],
        operation: 'deactivate' as const,
        reason: 'Bulk deactivation',
      };
      const performedBy = 'admin-1';

      // Mock the transaction for each user
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      const mockUser1 = { id: 'user-1', isBlocked: false };
      const mockUser3 = { id: 'user-3', isBlocked: false };

      // User 1 succeeds
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser1);
      (prisma.user.update as jest.Mock).mockResolvedValueOnce({ ...mockUser1, isBlocked: true });

      // User 2 fails (not found)
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      // User 3 succeeds
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser3);
      (prisma.user.update as jest.Mock).mockResolvedValueOnce({ ...mockUser3, isBlocked: true });

      const result = await userService.bulkUserOperation(operationData, performedBy);

      expect(result.success).toBe(true);
      expect(result.data?.successful).toEqual(['user-1', 'user-3']);
      expect(result.data?.failed).toHaveLength(1);
      expect(result.data?.failed[0].userId).toBe('user-2');
      expect(result.data?.totalProcessed).toBe(3);
      expect(result.data?.successCount).toBe(2);
      expect(result.data?.failureCount).toBe(1);
    });

    it('should perform bulk role assignment successfully', async () => {
      const operationData = {
        userIds: ['user-1', 'user-2'],
        operation: 'assignRole' as const,
        roleId: 'role-1',
        reason: 'Assign admin role',
      };
      const performedBy = 'admin-1';

      // Mock role assignment
      (prisma.userRole.create as jest.Mock)
        .mockResolvedValueOnce({ userId: 'user-1', roleId: 'role-1' })
        .mockResolvedValueOnce({ userId: 'user-2', roleId: 'role-1' });

      const result = await userService.bulkUserOperation(operationData, performedBy);

      expect(result.success).toBe(true);
      expect(result.data?.successful).toEqual(['user-1', 'user-2']);
      expect(result.data?.failed).toEqual([]);
      expect(result.data?.totalProcessed).toBe(2);
      expect(result.data?.successCount).toBe(2);
      expect(result.data?.failureCount).toBe(0);
    });

    it('should handle errors in bulk operations', async () => {
      const operationData = {
        userIds: ['user-1'],
        operation: 'unknownOperation' as any,
        reason: 'Test',
      };

      const result = await userService.bulkUserOperation(operationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to perform bulk user operation');
    });
  });
});
