import { PrismaClient } from '@prisma/client';
import * as userAccountService from '../../services/user-account.service';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    blockLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
  BlockAction: {
    block: 'block',
    unblock: 'unblock',
  },
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

describe('User Account Service', () => {
  let prisma: any; // Use any to bypass type checking for the mock

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('deactivateUserAccount', () => {
    it('should deactivate user account successfully', async () => {
      const userId = 'user-1';
      const reason = 'Violation of terms';
      const blockedBy = 'admin-1';
      const notifyUser = true;

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        isBlocked: false,
      };

      const mockDeactivatedUser = {
        ...mockUser,
        isBlocked: true,
        blockedReason: reason,
        blockedAt: new Date(),
        blockedBy,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockDeactivatedUser);
      ((prisma as any).blockLog.create as jest.Mock).mockResolvedValue({});

      const result = await userAccountService.deactivateUserAccount(
        userId,
        reason,
        blockedBy,
        notifyUser
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDeactivatedUser);
    });

    it('should return error if user not found', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userAccountService.deactivateUserAccount(
        'non-existent-user',
        'Reason',
        'admin-1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should return error if user already deactivated', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        isBlocked: true,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userAccountService.deactivateUserAccount('user-1', 'Reason', 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User account is already deactivated');
    });

    it('should handle database errors', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userAccountService.deactivateUserAccount('user-1', 'Reason', 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to deactivate user account');
    });
  });

  describe('reactivateUserAccount', () => {
    it('should reactivate user account successfully', async () => {
      const userId = 'user-1';
      const reason = 'Appeal approved';
      const reactivatedBy = 'admin-1';
      const notifyUser = true;

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
      ((prisma as any).blockLog.create as jest.Mock).mockResolvedValue({});

      const result = await userAccountService.reactivateUserAccount(
        userId,
        reason,
        reactivatedBy,
        notifyUser
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReactivatedUser);
    });

    it('should return error if user not found', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userAccountService.reactivateUserAccount(
        'non-existent-user',
        'Reason',
        'admin-1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should return error if user is not deactivated', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        isBlocked: false,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userAccountService.reactivateUserAccount('user-1', 'Reason', 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User account is already active');
    });

    it('should handle database errors', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userAccountService.reactivateUserAccount('user-1', 'Reason', 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to reactivate user account');
    });
  });

  describe('getUserBlockLogs', () => {
    it('should get user block logs successfully', async () => {
      const userId = 'user-1';
      const page = 1;
      const limit = 20;

      const mockUser = { id: userId };
      const mockBlockLogs = [
        {
          id: 'log-1',
          userId,
          blockedBy: 'admin-1',
          action: 'block',
          reason: 'Violation of terms',
          metadata: { notifyUser: true },
          createdAt: new Date(),
        },
        {
          id: 'log-2',
          userId,
          blockedBy: 'admin-2',
          action: 'unblock',
          reason: 'Appeal approved',
          metadata: { notifyUser: true },
          createdAt: new Date(),
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      ((prisma as any).blockLog.count as jest.Mock).mockResolvedValue(2);
      ((prisma as any).blockLog.findMany as jest.Mock).mockResolvedValue(mockBlockLogs);

      const result = await userAccountService.getUserBlockLogs(userId, page, limit);

      expect(result.success).toBe(true);
      expect(result.data?.logs).toEqual(mockBlockLogs);
      expect(result.data?.total).toBe(2);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
      expect(result.data?.totalPages).toBe(1);
    });

    it('should return error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userAccountService.getUserBlockLogs('non-existent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userAccountService.getUserBlockLogs('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get user block logs');
    });
  });

  describe('getAllBlockLogs', () => {
    it('should get all block logs successfully', async () => {
      const page = 1;
      const limit = 20;

      const mockBlockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          blockedBy: 'admin-1',
          action: 'block',
          reason: 'Violation of terms',
          metadata: { notifyUser: true },
          createdAt: new Date(),
          user: { id: 'user-1', email: 'user1@example.com' },
        },
        {
          id: 'log-2',
          userId: 'user-2',
          blockedBy: 'admin-2',
          action: 'unblock',
          reason: 'Appeal approved',
          metadata: { notifyUser: true },
          createdAt: new Date(),
          user: { id: 'user-2', email: 'user2@example.com' },
        },
      ];

      ((prisma as any).blockLog.count as jest.Mock).mockResolvedValue(2);
      ((prisma as any).blockLog.findMany as jest.Mock).mockResolvedValue(mockBlockLogs);

      const result = await userAccountService.getAllBlockLogs(page, limit);

      expect(result.success).toBe(true);
      expect(result.data?.logs).toEqual(mockBlockLogs);
      expect(result.data?.total).toBe(2);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
      expect(result.data?.totalPages).toBe(1);
    });

    it('should handle database errors', async () => {
      ((prisma as any).blockLog.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userAccountService.getAllBlockLogs();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get block logs');
    });
  });

  describe('getBlockedUsersStatistics', () => {
    it('should get blocked users statistics successfully', async () => {
      const mockStats = {
        totalBlockedUsers: 10,
        recentlyBlocked: 5,
        blockedByReason: {
          'Violation of terms': 3,
          'Suspicious activity': 2,
        },
      };

      (prisma.user.count as jest.Mock).mockResolvedValue(mockStats.totalBlockedUsers);
      ((prisma as any).blockLog.count as jest.Mock).mockResolvedValue(mockStats.recentlyBlocked);
      ((prisma as any).blockLog.groupBy as jest.Mock).mockResolvedValue([
        { reason: 'Violation of terms', _count: { reason: 3 } },
        { reason: 'Suspicious activity', _count: { reason: 2 } },
      ]);

      const result = await userAccountService.getBlockedUsersStatistics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });

    it('should handle database errors', async () => {
      (prisma.user.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await userAccountService.getBlockedUsersStatistics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get blocked users statistics');
    });
  });
});
