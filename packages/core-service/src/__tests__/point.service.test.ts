import { PrismaClient, PointTransactionType } from '@prisma/client';
import * as pointService from '../services/point.service';
import * as creditService from '../services/credit.service';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma: any = {
    pointAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    pointTransaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    dailyLoginReward: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    exchangeRate: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    autoTopupLog: {
      create: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    creditAccount: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock Credit Service
jest.mock('../services/credit.service', () => ({
  getBalance: jest.fn(),
  deductCredits: jest.fn(),
}));

// Mock Analytics Service
jest.mock('../services/analytics.service', () => ({
  recordUsage: jest.fn(),
}));

// Mock Shared errors
jest.mock('@smart-ai-hub/shared', () => ({
  createNotFoundError: jest.fn((message) => new Error(message)),
  createInternalServerError: jest.fn((message) => new Error(message)),
}));

// Get the mocked Prisma instance
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient: MockedPrismaClient } = require('@prisma/client');
const mockPrisma = new MockedPrismaClient();
const mockCreditService = creditService as jest.Mocked<typeof creditService>;

describe('PointService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return user points balance', async () => {
      const userId = 'user-123';
      const mockPointAccount = { balance: 1000 };

      mockPrisma.pointAccount.findUnique.mockResolvedValue(mockPointAccount as any);

      const balance = await pointService.getBalance(userId);

      expect(balance).toBe(1000);
      expect(mockPrisma.pointAccount.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw error if point account not found', async () => {
      const userId = 'user-123';

      mockPrisma.pointAccount.findUnique.mockResolvedValue(null);

      await expect(pointService.getBalance(userId)).rejects.toThrow(
        'Point account not found for user: user-123'
      );
    });
  });

  describe('getHistory', () => {
    it('should return paginated transaction history', async () => {
      const userId = 'user-123';
      const page = 1;
      const limit = 20;
      const mockTransactions = [
        { id: 'tx-1', userId, amount: 100, type: 'purchase' as PointTransactionType },
        { id: 'tx-2', userId, amount: -50, type: 'usage' as PointTransactionType },
      ];

      mockPrisma.pointTransaction.findMany.mockResolvedValue(mockTransactions as any);
      mockPrisma.pointTransaction.count.mockResolvedValue(2);

      const result = await pointService.getHistory(userId, page, limit);

      expect(result).toEqual({
        data: mockTransactions,
        total: 2,
      });
    });
  });

  describe('addPoints', () => {
    it('should add points and create transaction record', async () => {
      const userId = 'user-123';
      const amount = 500;
      const type = 'reward' as PointTransactionType;
      const description = 'Test reward';
      const mockPointAccount = { balance: 1000 };
      const mockUpdatedAccount = { balance: 1500 };
      const mockTransaction = { id: 'tx-123', userId, amount, type, description };

      mockPrisma.pointAccount.findUnique.mockResolvedValue(mockPointAccount as any);
      mockPrisma.pointAccount.update.mockResolvedValue(mockUpdatedAccount as any);
      mockPrisma.pointTransaction.create.mockResolvedValue(mockTransaction as any);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      const result = await pointService.addPoints(userId, amount, type, description);

      expect(result).toEqual({
        new_balance: 1500,
        transaction_id: 'tx-123',
      });
    });

    it('should throw error if amount is not positive', async () => {
      const userId = 'user-123';
      const amount = -100;
      const type = 'reward' as PointTransactionType;
      const description = 'Test reward';

      await expect(pointService.addPoints(userId, amount, type, description)).rejects.toThrow(
        'Amount must be positive'
      );
    });
  });

  describe('deductPoints', () => {
    it('should deduct points and create transaction record', async () => {
      const userId = 'user-123';
      const amount = 100;
      const description = 'Test usage';
      const mockPointAccount = { balance: 1000 };
      const mockUpdatedAccount = { balance: 900 };
      const mockTransaction = {
        id: 'tx-123',
        userId,
        amount: -100,
        type: 'usage' as PointTransactionType,
      };

      mockPrisma.pointAccount.findUnique.mockResolvedValue(mockPointAccount as any);
      mockPrisma.pointAccount.update.mockResolvedValue(mockUpdatedAccount as any);
      mockPrisma.pointTransaction.create.mockResolvedValue(mockTransaction as any);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
      jest.spyOn(pointService, 'checkAndTriggerAutoTopup').mockResolvedValue(false);

      const result = await pointService.deductPoints(userId, amount, description);

      expect(result.status).toBe('ok');
      expect(result.new_balance).toBe(900);
      expect(result.transaction_id).toBe('tx-123');
    });

    it('should throw error if insufficient points', async () => {
      const userId = 'user-123';
      const amount = 1500;
      const description = 'Test usage';
      const mockPointAccount = { balance: 1000 };

      mockPrisma.pointAccount.findUnique.mockResolvedValue(mockPointAccount as any);
      jest.spyOn(pointService, 'checkAndTriggerAutoTopup').mockResolvedValue(false);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      await expect(pointService.deductPoints(userId, amount, description)).rejects.toThrow(
        'Insufficient points'
      );
    });
  });

  describe('exchangeCreditsToPoints', () => {
    it('should exchange credits to points at correct rate', async () => {
      const userId = 'user-123';
      const creditAmount = 100;
      const rate = 1000;
      const pointsToReceive = creditAmount * rate;
      const mockCreditAccount = { balance: 500 };
      const mockUpdatedCreditAccount = { balance: 400 };
      const mockPointAccount = { balance: 1000 };
      const mockUpdatedPointAccount = { balance: 1000 + pointsToReceive };
      const mockTransaction = {
        id: 'tx-123',
        userId,
        amount: pointsToReceive,
        type: 'exchange' as PointTransactionType,
      };

      mockPrisma.creditAccount.findUnique.mockResolvedValue(mockCreditAccount as any);
      mockCreditService.deductCredits.mockResolvedValue({
        status: 'ok',
        new_balance: 400,
        transaction_id: 'credit-tx-123',
      } as any);
      mockPrisma.pointAccount.findUnique.mockResolvedValue(mockPointAccount as any);
      mockPrisma.pointAccount.update.mockResolvedValue(mockUpdatedPointAccount as any);
      mockPrisma.pointTransaction.create.mockResolvedValue(mockTransaction as any);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
      jest.spyOn(pointService, 'getExchangeRate').mockResolvedValue(rate);

      const result = await pointService.exchangeCreditsToPoints(userId, creditAmount);

      expect(result.pointsReceived).toBe(pointsToReceive);
      expect(mockCreditService.deductCredits).toHaveBeenCalledWith(
        userId,
        'exchange_to_points',
        creditAmount,
        {
          exchangeToPoints: true,
        }
      );
    });

    it('should throw error if credit amount is not positive', async () => {
      const userId = 'user-123';
      const creditAmount = -100;

      await expect(pointService.exchangeCreditsToPoints(userId, creditAmount)).rejects.toThrow(
        'Credit amount must be positive'
      );
    });
  });

  describe('claimDailyReward', () => {
    it('should claim daily reward successfully', async () => {
      const userId = 'user-123';
      const mockUser = { id: userId, profile: { preferences: { timezone: 'UTC' } } };
      const mockRewardAmount = 50;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.dailyLoginReward.findUnique.mockResolvedValue(null as any);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
      jest.spyOn(pointService, 'addPointsInTransaction').mockResolvedValue({
        new_balance: 1050,
        transaction_id: 'tx-123',
      } as any);
      jest.spyOn(pointService, 'getExchangeRate').mockResolvedValue(mockRewardAmount);

      const result = await pointService.claimDailyReward(userId);

      expect(result.points).toBe(mockRewardAmount);
      expect(result.message).toContain('Successfully claimed');
    });

    it('should throw error if daily reward already claimed', async () => {
      const userId = 'user-123';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingReward = { id: 'reward-1', userId, claimedAt: today };
      const mockUser = { id: userId, profile: { preferences: { timezone: 'UTC' } } };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.dailyLoginReward.findUnique.mockResolvedValue(existingReward as any);

      await expect(pointService.claimDailyReward(userId)).rejects.toThrow(
        'Daily reward already claimed for today'
      );
    });

    // Note: Test for disabled daily rewards moved to separate file
    // point.service.daily-rewards.test.ts
  });

  describe('getDailyRewardStatus', () => {
    it('should return canClaim true if not claimed today', async () => {
      const userId = 'user-123';
      const mockUser = { id: userId, profile: { preferences: { timezone: 'UTC' } } };
      const mockRewardAmount = 50;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.dailyLoginReward.findUnique.mockResolvedValue(null as any);
      jest.spyOn(pointService, 'getExchangeRate').mockResolvedValue(mockRewardAmount);

      const status = await pointService.getDailyRewardStatus(userId);

      expect(status.canClaim).toBe(true);
      expect(status.rewardAmount).toBe(mockRewardAmount);
    });

    it('should return canClaim false with next claim date if already claimed', async () => {
      const userId = 'user-123';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const existingReward = { id: 'reward-1', userId, claimedAt: today };
      const mockUser = { id: userId, profile: { preferences: { timezone: 'UTC' } } };
      const mockRewardAmount = 50;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.dailyLoginReward.findUnique.mockResolvedValue(existingReward as any);
      jest.spyOn(pointService, 'getExchangeRate').mockResolvedValue(mockRewardAmount);

      const status = await pointService.getDailyRewardStatus(userId);

      expect(status.canClaim).toBe(false);
      expect(status.nextClaimDate).toEqual(tomorrow);
      expect(status.lastClaimDate).toEqual(existingReward.claimedAt);
    });
  });

  describe('adjustPoints', () => {
    it('should adjust user points with reason', async () => {
      const userId = 'user-123';
      const amount = 500;
      const reason = 'Admin adjustment';
      const mockPointAccount = { balance: 1000 };
      const mockUpdatedAccount = { balance: 1500 };
      const mockTransaction = {
        id: 'tx-123',
        userId,
        amount,
        type: 'admin_adjustment' as PointTransactionType,
      };

      mockPrisma.pointAccount.findUnique.mockResolvedValue(mockPointAccount as any);
      mockPrisma.pointAccount.update.mockResolvedValue(mockUpdatedAccount as any);
      mockPrisma.pointTransaction.create.mockResolvedValue(mockTransaction as any);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      const newBalance = await pointService.adjustPoints(userId, amount, reason);

      expect(newBalance).toBe(1500);
      expect(mockPrisma.pointTransaction.create).toHaveBeenCalledWith({
        data: {
          userId,
          amount,
          type: 'admin_adjustment',
          balanceAfter: 1500,
          description: 'Admin adjustment: Admin adjustment',
        },
      });
    });

    it('should throw error if reason is empty', async () => {
      const userId = 'user-123';
      const amount = 500;
      const reason = '';

      await expect(pointService.adjustPoints(userId, amount, reason)).rejects.toThrow(
        'Reason is required for point adjustment'
      );
    });
  });

  describe('getExchangeRate', () => {
    it('should return exchange rate from database', async () => {
      const name = 'credit_to_points';
      const rate = 1000;
      const mockExchangeRate = { name, rate };

      mockPrisma.exchangeRate.findUnique.mockResolvedValue(mockExchangeRate as any);

      const result = await pointService.getExchangeRate(name);

      expect(result).toBe(rate);
      expect(mockPrisma.exchangeRate.findUnique).toHaveBeenCalledWith({
        where: { name },
      });
    });

    it('should return default rate if not found in database', async () => {
      const name = 'credit_to_points';

      mockPrisma.exchangeRate.findUnique.mockResolvedValue(null as any);

      const result = await pointService.getExchangeRate(name);

      expect(result).toBe(1000); // Default POINTS_PER_CREDIT
    });

    it('should throw error for unknown rate name', async () => {
      const name = 'unknown_rate';

      mockPrisma.exchangeRate.findUnique.mockResolvedValue(null as any);

      await expect(pointService.getExchangeRate(name)).rejects.toThrow(
        'Exchange rate not found: unknown_rate'
      );
    });
  });

  describe('updateExchangeRate', () => {
    it('should update existing exchange rate', async () => {
      const name = 'credit_to_points';
      const rate = 1200;
      const description = 'Updated rate';
      const mockUpdatedRate = { name, rate, description };

      mockPrisma.exchangeRate.upsert.mockResolvedValue(mockUpdatedRate as any);

      const result = await pointService.updateExchangeRate(name, rate, description);

      expect(result).toEqual(mockUpdatedRate);
      expect(mockPrisma.exchangeRate.upsert).toHaveBeenCalledWith({
        where: { name },
        update: { rate, description },
        create: { name, rate, description },
      });
    });

    it('should throw error if rate is not positive', async () => {
      const name = 'credit_to_points';
      const rate = -100;

      await expect(pointService.updateExchangeRate(name, rate)).rejects.toThrow(
        'Rate must be positive'
      );
    });
  });

  describe('getPointsStats', () => {
    it('should return points statistics', async () => {
      const mockTotalPointsResult = { _sum: { balance: 100000 } };
      const mockTotalUsers = 100;
      const mockActiveUsers = 75;
      const mockTotalTransactions = 5000;

      mockPrisma.pointAccount.aggregate.mockResolvedValue(mockTotalPointsResult as any);
      mockPrisma.pointAccount.count
        .mockResolvedValueOnce(mockTotalUsers)
        .mockResolvedValueOnce(mockActiveUsers);
      mockPrisma.pointTransaction.count.mockResolvedValue(mockTotalTransactions);

      const stats = await pointService.getPointsStats();

      expect(stats).toEqual({
        totalPoints: 100000,
        totalUsers: 100,
        activeUsers: 75,
        averageBalance: 1000,
        totalTransactions: 5000,
      });
    });
  });

  describe('purchasePoints', () => {
    it('should purchase points with payment details', async () => {
      const userId = 'user-123';
      const pointsAmount = 10000;
      const paymentDetails = {
        stripeSessionId: 'sess_123',
        stripePaymentIntentId: 'pi_123',
        amount: 100,
      };
      const mockPayment = { id: 'pay_123' };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma as any);
      });

      mockPrisma.payment.create.mockResolvedValue(mockPayment as any);

      // Mock addPointsInTransaction
      jest.spyOn(pointService, 'addPointsInTransaction').mockResolvedValue({
        new_balance: 11000,
        transaction_id: 'tx-123',
      } as any);

      const result = await pointService.purchasePoints(userId, pointsAmount, paymentDetails);

      expect(result.new_balance).toBe(11000);
      expect(result.transaction_id).toBe('tx-123');
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: {
          userId,
          amount: paymentDetails.amount,
          credits: 0,
          points: pointsAmount,
          status: 'completed',
          stripeSessionId: paymentDetails.stripeSessionId,
          stripePaymentIntentId: paymentDetails.stripePaymentIntentId,
        },
      });
    });

    it('should throw error if points amount is not positive', async () => {
      const userId = 'user-123';
      const pointsAmount = -1000;
      const paymentDetails = {
        stripeSessionId: 'sess_123',
        amount: 100,
      };

      await expect(
        pointService.purchasePoints(userId, pointsAmount, paymentDetails)
      ).rejects.toThrow('Points amount must be positive');
    });
  });
});
