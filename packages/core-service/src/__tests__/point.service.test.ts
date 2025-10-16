import { PrismaClient } from '@prisma/client';
import * as pointService from '../services/point.service';
import * as creditService from '../services/credit.service';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    pointAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pointTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    dailyLoginReward: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    exchangeRate: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
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
    quit: jest.fn(),
  })),
}));

// Mock credit service
jest.mock('../services/credit.service');

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('Point Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return point balance for a user', async () => {
      const userId = 'user-123';
      const mockAccount = { userId, balance: 1000 };

      (mockPrisma.pointAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      const result = await pointService.getBalance(userId);

      expect(result).toBe(1000);
      expect(mockPrisma.pointAccount.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw error if account not found', async () => {
      const userId = 'user-123';

      (mockPrisma.pointAccount.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(pointService.getBalance(userId)).rejects.toThrow('Point account not found');
    });
  });

  describe('addPoints', () => {
    it('should add points to user account', async () => {
      const userId = 'user-123';
      const amount = 500;
      const mockAccount = { userId, balance: 1000 };
      const mockTransaction = { id: 'tx-123', userId, amount, type: 'purchase' };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.pointAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount);
      (mockPrisma.pointAccount.update as jest.Mock).mockResolvedValue({ ...mockAccount, balance: 1500 });
      (mockPrisma.pointTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await pointService.addPoints(userId, amount, 'purchase', 'Test purchase');

      expect(result.new_balance).toBe(1500);
      expect(result.transaction_id).toBe('tx-123');
    });

    it('should throw error for invalid amount', async () => {
      const userId = 'user-123';
      const amount = -100;

      await expect(pointService.addPoints(userId, amount, 'purchase')).rejects.toThrow('Amount must be positive');
    });
  });

  describe('deductPoints', () => {
    it('should deduct points from user account', async () => {
      const userId = 'user-123';
      const amount = 200;
      const mockAccount = { userId, balance: 1000 };
      const mockTransaction = { id: 'tx-123', userId, amount: -200, type: 'usage' };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.pointAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount);
      (mockPrisma.pointAccount.update as jest.Mock).mockResolvedValue({ ...mockAccount, balance: 800 });
      (mockPrisma.pointTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      // Mock auto top-up check to return false
      jest.spyOn(pointService, 'checkAndTriggerAutoTopup').mockResolvedValue(false);

      const result = await pointService.deductPoints(userId, amount, 'Test usage');

      expect(result.new_balance).toBe(800);
      expect(result.status).toBe('ok');
      expect(result.transaction_id).toBe('tx-123');
    });

    it('should throw error for insufficient points', async () => {
      const userId = 'user-123';
      const amount = 2000;
      const mockAccount = { userId, balance: 1000 };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.pointAccount.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      // Mock auto top-up check to return false
      jest.spyOn(pointService, 'checkAndTriggerAutoTopup').mockResolvedValue(false);

      await expect(pointService.deductPoints(userId, amount)).rejects.toThrow('Insufficient points');
    });
  });

  describe('exchangeCreditsToPoints', () => {
    it('should exchange credits to points', async () => {
      const userId = 'user-123';
      const creditAmount = 5;
      const pointsToReceive = 5000;

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Mock credit service
      (creditService.deductCredits as jest.Mock).mockResolvedValue({});
      jest.spyOn(pointService, 'addPointsInTransaction').mockResolvedValue({
        new_balance: 5000,
        transaction_id: 'tx-123',
      });

      // Mock getBalance functions
      jest.spyOn(pointService, 'getBalance').mockResolvedValue(5000);
      jest.spyOn(creditService, 'getBalance').mockResolvedValue(95);
      jest.spyOn(pointService, 'getExchangeRate').mockResolvedValue(1000);

      const result = await pointService.exchangeCreditsToPoints(userId, creditAmount);

      expect(result.newPointBalance).toBe(5000);
      expect(result.pointsReceived).toBe(pointsToReceive);
      expect(result.newCreditBalance).toBe(95);
    });

    it('should throw error for invalid credit amount', async () => {
      const userId = 'user-123';
      const creditAmount = -5;

      await expect(pointService.exchangeCreditsToPoints(userId, creditAmount)).rejects.toThrow('Credit amount must be positive');
    });
  });

  describe('claimDailyReward', () => {
    it('should claim daily reward successfully', async () => {
      const userId = 'user-123';
      const rewardAmount = 50;

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Mock user with timezone
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        profile: { preferences: { timezone: 'UTC' } },
      });

      // Mock existing reward check
      (mockPrisma.dailyLoginReward.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock reward creation and point addition
      (mockPrisma.dailyLoginReward.create as jest.Mock).mockResolvedValue({});
      jest.spyOn(pointService, 'addPointsInTransaction').mockResolvedValue({
        new_balance: 50,
        transaction_id: 'tx-123',
      });

      jest.spyOn(pointService, 'getExchangeRate').mockResolvedValue(50);

      const result = await pointService.claimDailyReward(userId);

      expect(result.points).toBe(rewardAmount);
      expect(result.message).toContain('Successfully claimed 50 points');
    });

    it('should throw error if reward already claimed', async () => {
      const userId = 'user-123';

      // Mock user with timezone
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        profile: { preferences: { timezone: 'UTC' } },
      });

      // Mock existing reward
      (mockPrisma.dailyLoginReward.findUnique as jest.Mock).mockResolvedValue({
        id: 'reward-123',
        userId,
        rewardDate: new Date(),
        points: 50,
      });

      jest.spyOn(pointService, 'getExchangeRate').mockResolvedValue(50);

      await expect(pointService.claimDailyReward(userId)).rejects.toThrow('Daily reward already claimed for today');
    });
  });

  describe('getDailyRewardStatus', () => {
    it('should return canClaim: true if reward not claimed today', async () => {
      const userId = 'user-123';
      const rewardAmount = 50;

      // Mock user with timezone
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        profile: { preferences: { timezone: 'UTC' } },
      });

      // Mock no existing reward
      (mockPrisma.dailyLoginReward.findUnique as jest.Mock).mockResolvedValue(null);

      jest.spyOn(pointService, 'getExchangeRate').mockResolvedValue(rewardAmount);

      const result = await pointService.getDailyRewardStatus(userId);

      expect(result.canClaim).toBe(true);
      expect(result.rewardAmount).toBe(rewardAmount);
    });

    it('should return canClaim: false if reward already claimed today', async () => {
      const userId = 'user-123';
      const rewardAmount = 50;

      // Mock user with timezone
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        profile: { preferences: { timezone: 'UTC' } },
      });

      // Mock existing reward
      (mockPrisma.dailyLoginReward.findUnique as jest.Mock).mockResolvedValue({
        id: 'reward-123',
        userId,
        rewardDate: new Date(),
        points: 50,
        claimedAt: new Date(),
      });

      jest.spyOn(pointService, 'getExchangeRate').mockResolvedValue(rewardAmount);

      const result = await pointService.getDailyRewardStatus(userId);

      expect(result.canClaim).toBe(false);
      expect(result.rewardAmount).toBe(rewardAmount);
      expect(result.nextClaimDate).toBeDefined();
    });
  });

  describe('getExchangeRate', () => {
    it('should return exchange rate from cache', async () => {
      const rateName = 'credit_to_points';
      const rateValue = 1000;

      // Mock Redis cache hit
      const mockRedisClient = require('redis').createClient();
      mockRedisClient.get.mockResolvedValue('1000');

      const result = await pointService.getExchangeRate(rateName);

      expect(result).toBe(rateValue);
      expect(mockRedisClient.get).toHaveBeenCalledWith('exchange_rate:credit_to_points');
    });

    it('should return default rate if not found in database', async () => {
      const rateName = 'credit_to_points';

      // Mock Redis cache miss
      const mockRedisClient = require('redis').createClient();
      mockRedisClient.get.mockResolvedValue(null);

      // Mock database miss
      (mockPrisma.exchangeRate.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await pointService.getExchangeRate(rateName);

      expect(result).toBe(1000); // Default POINTS_PER_CREDIT
    });
  });

  describe('adjustPoints', () => {
    it('should adjust user points', async () => {
      const userId = 'user-123';
      const amount = 200;
      const reason = 'Admin bonus';

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      (mockPrisma.pointAccount.findUnique as jest.Mock).mockResolvedValue({ userId, balance: 1000 });
      (mockPrisma.pointAccount.update as jest.Mock).mockResolvedValue({ userId, balance: 1200 });
      (mockPrisma.pointTransaction.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await pointService.adjustPoints(userId, amount, reason);

      expect(result).toBe(1200);
    });

    it('should throw error if reason is empty', async () => {
      const userId = 'user-123';
      const amount = 200;
      const reason = '';

      await expect(pointService.adjustPoints(userId, amount, reason)).rejects.toThrow('Reason is required for point adjustment');
    });
  });
});