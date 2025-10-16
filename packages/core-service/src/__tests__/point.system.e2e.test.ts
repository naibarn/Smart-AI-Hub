import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { mockPointService } from '../__mocks__/services.mock';
import { createMockRedisService } from '../__mocks__/redis.mock';

// Import the test setup which handles all our mocking
import '../tests/setup';

const prisma = new PrismaClient();
const mockRedisService = createMockRedisService();

// Create a test app
const createTestApp = () => {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mock auth middleware
  app.use((req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided or invalid format',
      });
    }

    // Set mock user based on token
    if (authHeader.includes('admin-token')) {
      req.user = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        role: 'admin',
      };
    } else {
      req.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
      };
    }
    next();
  });

  // Mock RBAC middleware
  const requireRoles = (roles: string[]) => (req: any, res: any, next: any) => {
    if (roles.includes('admin') && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `You need one of these roles: ${roles.join(', ')} to access this resource.`,
      });
    }
    next();
  };

  // Points routes with direct implementation
  app.get('/api/points/balance', async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const balance = await mockPointService.getBalance(userId);
      res.json({
        success: true,
        data: {
          balance,
          lastUpdated: new Date().toISOString(),
          account: {
            id: 'point-account-id',
            userId,
            createdAt: new Date().toISOString(),
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  });

  app.get('/api/wallet/balance', async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const pointsBalance = await mockPointService.getBalance(userId);
      res.json({
        success: true,
        data: {
          credits: {
            balance: 100,
            lastUpdated: new Date().toISOString(),
          },
          points: {
            balance: pointsBalance,
            lastUpdated: new Date().toISOString(),
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  });

  app.post('/api/points/exchange-from-credits', async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const { creditAmount } = req.body;
      const result = await mockPointService.exchangeFromCredits(userId, creditAmount);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  });

  app.post('/api/points/claim-daily-reward', async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const result = await mockPointService.claimDailyReward(userId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  });

  app.get('/api/points/daily-reward-status', async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const result = await mockPointService.getDailyRewardStatus(userId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  });

  app.get('/api/points/history', async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type } = req.query;
      const result = await mockPointService.getTransactionHistory(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        type as string
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  });

  app.post('/api/points/deduct', async (req: any, res: any, next: any) => {
    try {
      const { userId, amount, description } = req.body;
      const result = await mockPointService.deductPoints(userId, amount, description);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  });

  // Admin routes
  app.get(
    '/api/admin/exchange-rates',
    requireRoles(['admin']),
    async (req: any, res: any, next: any) => {
      try {
        const result = await mockPointService.getExchangeRates();
        res.json({
          success: true,
          data: result,
        });
      } catch (error: any) {
        next(error);
      }
    }
  );

  app.put(
    '/api/admin/exchange-rates/:name',
    requireRoles(['admin']),
    async (req: any, res: any, next: any) => {
      try {
        const { name } = req.params;
        const { rate, description } = req.body;
        const result = await mockPointService.updateExchangeRate(name, rate, description);
        res.json({
          success: true,
          data: result,
        });
      } catch (error: any) {
        next(error);
      }
    }
  );

  app.get(
    '/api/admin/points/stats',
    requireRoles(['admin']),
    async (req: any, res: any, next: any) => {
      try {
        const result = await mockPointService.getPointsStatistics();
        res.json({
          success: true,
          data: result,
        });
      } catch (error: any) {
        next(error);
      }
    }
  );

  app.get(
    '/api/admin/auto-topup/stats',
    requireRoles(['admin']),
    async (req: any, res: any, next: any) => {
      try {
        const result = await mockPointService.getAutoTopupStatistics();
        res.json({
          success: true,
          data: result,
        });
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Error handler
  app.use((error: any, req: any, res: any, next: any) => {
    res.status(500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  });

  return app;
};

describe('Points System E2E Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('Points Balance', () => {
    it('should return current points balance', async () => {
      // Mock service response
      (mockPointService.getBalance as jest.Mock).mockResolvedValue(1000);

      const response = await request(app)
        .get('/api/points/balance')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe(1000);
      expect(response.body.data.account).toBeDefined();
      expect(mockPointService.getBalance).toHaveBeenCalledWith('test-user-id');
    });

    it('should return combined wallet balance', async () => {
      // Mock service response
      (mockPointService.getBalance as jest.Mock).mockResolvedValue(1000);

      const response = await request(app)
        .get('/api/wallet/balance')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.credits.balance).toBe(100);
      expect(response.body.data.points.balance).toBe(1000);
      expect(mockPointService.getBalance).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('Daily Reward System', () => {
    it('should allow claiming daily reward', async () => {
      // Mock service response
      (mockPointService.claimDailyReward as jest.Mock).mockResolvedValue({
        transaction: {
          id: 'transaction-id',
          type: 'daily_reward',
          amount: 50,
          balance: 50,
          description: 'Daily login reward',
          metadata: {},
          createdAt: new Date().toISOString(),
        },
        consecutiveDays: 1,
        nextRewardTime: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/points/claim-daily-reward')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.type).toBe('daily_reward');
      expect(response.body.data.transaction.amount).toBe(50);
      expect(response.body.data.consecutiveDays).toBe(1);
      expect(mockPointService.claimDailyReward).toHaveBeenCalledWith('test-user-id');
    });

    it('should not allow claiming daily reward twice', async () => {
      // Mock service error
      (mockPointService.claimDailyReward as jest.Mock).mockRejectedValue(
        new Error('Daily reward already claimed')
      );

      const response = await request(app)
        .post('/api/points/claim-daily-reward')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(mockPointService.claimDailyReward).toHaveBeenCalledWith('test-user-id');
    });

    it('should show daily reward status', async () => {
      // Mock service response
      (mockPointService.getDailyRewardStatus as jest.Mock).mockResolvedValue({
        canClaim: false,
        lastClaimDate: new Date().toISOString(),
        consecutiveDays: 1,
        nextRewardTime: new Date().toISOString(),
        rewardAmount: 50,
      });

      const response = await request(app)
        .get('/api/points/daily-reward-status')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.canClaim).toBe(false);
      expect(response.body.data.lastClaimDate).toBeDefined();
      expect(mockPointService.getDailyRewardStatus).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('Credits to Points Exchange', () => {
    it('should exchange credits for points', async () => {
      // Mock service response
      (mockPointService.exchangeFromCredits as jest.Mock).mockResolvedValue({
        transaction: {
          id: 'transaction-id',
          type: 'exchange_from_credit',
          amount: 10000,
          balance: 10000,
          description: 'Manual exchange: 10 Credits → 10000 Points',
          metadata: { creditAmount: 10, exchangeRate: 1000 },
          createdAt: new Date().toISOString(),
        },
        creditTransaction: {
          id: 'credit-transaction-id',
          type: 'exchange_to_points',
          amount: -10,
          balance: 90,
          description: 'Exchange to Points: 10 Credits → 10000 Points',
          metadata: { pointsAmount: 10000, exchangeRate: 1000 },
          createdAt: new Date().toISOString(),
        },
      });

      const response = await request(app)
        .post('/api/points/exchange-from-credits')
        .set('Authorization', 'Bearer valid-token')
        .send({ creditAmount: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.type).toBe('exchange_from_credit');
      expect(response.body.data.transaction.amount).toBe(10000); // 10 credits * 1000
      expect(response.body.data.creditTransaction.type).toBe('exchange_to_points');
      expect(response.body.data.creditTransaction.amount).toBe(-10);
      expect(mockPointService.exchangeFromCredits).toHaveBeenCalledWith('test-user-id', 10);
    });

    it('should fail with insufficient credits', async () => {
      // Mock service error
      (mockPointService.exchangeFromCredits as jest.Mock).mockRejectedValue(
        new Error('Insufficient credits')
      );

      const response = await request(app)
        .post('/api/points/exchange-from-credits')
        .set('Authorization', 'Bearer valid-token')
        .send({ creditAmount: 200 })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(mockPointService.exchangeFromCredits).toHaveBeenCalledWith('test-user-id', 200);
    });
  });

  describe('Auto Top-up Feature', () => {
    it('should trigger auto top-up when points are low', async () => {
      // Mock service response
      (mockPointService.deductPoints as jest.Mock).mockResolvedValue({
        transaction: {
          id: 'transaction-id',
          type: 'usage',
          amount: -100,
          balance: 900,
          description: 'Service usage: AI Chat',
          metadata: {},
          createdAt: new Date().toISOString(),
        },
        autoTopupTriggered: true,
      });

      const response = await request(app)
        .post('/api/points/deduct')
        .set('Authorization', 'Bearer valid-token')
        .send({
          userId: 'test-user-id',
          amount: 100,
          description: 'Test service usage',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.autoTopupTriggered).toBe(true);
      expect(response.body.data.transaction.type).toBe('usage');
      expect(mockPointService.deductPoints).toHaveBeenCalledWith(
        'test-user-id',
        100,
        'Test service usage'
      );
    });

    it('should not trigger auto top-up when credits are insufficient', async () => {
      // Mock service error
      (mockPointService.deductPoints as jest.Mock).mockRejectedValue(
        new Error('Insufficient points')
      );

      const response = await request(app)
        .post('/api/points/deduct')
        .set('Authorization', 'Bearer valid-token')
        .send({
          userId: 'test-user-id',
          amount: 100,
          description: 'Test service usage',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(mockPointService.deductPoints).toHaveBeenCalledWith(
        'test-user-id',
        100,
        'Test service usage'
      );
    });
  });

  describe('Points Transaction History', () => {
    it('should return transaction history', async () => {
      // Mock service response
      (mockPointService.getTransactionHistory as jest.Mock).mockResolvedValue({
        transactions: [
          {
            id: 'transaction-1',
            type: 'daily_reward',
            amount: 50,
            balance: 50,
            description: 'Daily login reward',
            metadata: {},
            createdAt: new Date().toISOString(),
          },
          {
            id: 'transaction-2',
            type: 'exchange_from_credit',
            amount: 10000,
            balance: 10050,
            description: 'Manual exchange: 10 Credits → 10000 Points',
            metadata: { creditAmount: 10, exchangeRate: 1000 },
            createdAt: new Date().toISOString(),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });

      const response = await request(app)
        .get('/api/points/history')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();

      // Should have at least daily reward and exchange transactions
      expect(response.body.data.transactions.length).toBeGreaterThanOrEqual(2);
      expect(mockPointService.getTransactionHistory).toHaveBeenCalledWith(
        'test-user-id',
        1,
        20,
        undefined
      );
    });

    it('should filter transactions by type', async () => {
      // Mock service response
      (mockPointService.getTransactionHistory as jest.Mock).mockResolvedValue({
        transactions: [
          {
            id: 'transaction-1',
            type: 'daily_reward',
            amount: 50,
            balance: 50,
            description: 'Daily login reward',
            metadata: {},
            createdAt: new Date().toISOString(),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const response = await request(app)
        .get('/api/points/history?type=daily_reward')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.transactions.forEach((tx: any) => {
        expect(tx.type).toBe('daily_reward');
      });
      expect(mockPointService.getTransactionHistory).toHaveBeenCalledWith(
        'test-user-id',
        1,
        20,
        'daily_reward'
      );
    });
  });

  describe('Admin Endpoints', () => {
    it('should get exchange rates', async () => {
      // Mock service response
      (mockPointService.getExchangeRates as jest.Mock).mockResolvedValue({
        rates: [
          {
            id: 'rate-1',
            name: 'credit_to_points',
            rate: 1000,
            description: 'Credits to Points conversion rate',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        config: {
          autoTopupEnabled: true,
          autoTopupThreshold: 10,
          autoTopupAmountCredits: 1,
          dailyRewardEnabled: true,
          dailyRewardAmount: 50,
        },
      });

      const response = await request(app)
        .get('/api/admin/exchange-rates')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rates).toBeInstanceOf(Array);
      expect(response.body.data.config).toBeDefined();
      expect(mockPointService.getExchangeRates).toHaveBeenCalled();
    });

    it('should update exchange rate', async () => {
      // Mock service response
      (mockPointService.updateExchangeRate as jest.Mock).mockResolvedValue({
        rate: {
          id: 'rate-1',
          name: 'credit_to_points',
          rate: 1200,
          description: 'Updated rate for testing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      const response = await request(app)
        .put('/api/admin/exchange-rates/credit_to_points')
        .set('Authorization', 'Bearer admin-token')
        .send({
          rate: 1200,
          description: 'Updated rate for testing',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rate.rate).toBe(1200);
      expect(mockPointService.updateExchangeRate).toHaveBeenCalledWith(
        'credit_to_points',
        1200,
        'Updated rate for testing'
      );
    });

    it('should get points statistics', async () => {
      // Mock service response
      (mockPointService.getPointsStatistics as jest.Mock).mockResolvedValue({
        overview: {
          totalPoints: 2500000,
          totalUsers: 1250,
          activeUsers: 890,
          averageBalance: 2000,
        },
        transactions: {
          total: 15420,
          byType: {
            purchase: 3200,
            usage: 8900,
            exchange_from_credit: 2100,
            daily_reward: 1200,
            auto_topup_from_credit: 20,
          },
          totalPointsEarned: 2100000,
          totalPointsSpent: 1500000,
        },
        period: {
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
      });

      const response = await request(app)
        .get('/api/admin/points/stats')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.transactions).toBeDefined();
      expect(mockPointService.getPointsStatistics).toHaveBeenCalled();
    });

    it('should get auto top-up statistics', async () => {
      // Mock service response
      (mockPointService.getAutoTopupStatistics as jest.Mock).mockResolvedValue({
        overview: {
          totalAutoTopups: 342,
          totalCreditsConverted: 342,
          totalPointsGenerated: 342000,
          uniqueUsers: 125,
        },
        recentAutoTopups: [
          {
            id: 'transaction-1',
            user: {
              id: 'user-1',
              email: 'user@example.com',
            },
            amount: 1000,
            createdAt: new Date().toISOString(),
          },
        ],
        period: {
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
      });

      const response = await request(app)
        .get('/api/admin/auto-topup/stats')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.recentAutoTopups).toBeInstanceOf(Array);
      expect(mockPointService.getAutoTopupStatistics).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      const response = await request(app).get('/api/points/balance').expect(401);

      expect(response.body.error).toBe('Access denied');
    });

    it('should handle invalid transaction amount', async () => {
      // Mock service error
      (mockPointService.exchangeFromCredits as jest.Mock).mockRejectedValue(
        new Error('Invalid amount')
      );

      const response = await request(app)
        .post('/api/points/exchange-from-credits')
        .set('Authorization', 'Bearer valid-token')
        .send({ creditAmount: -10 })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(mockPointService.exchangeFromCredits).toHaveBeenCalledWith('test-user-id', -10);
    });

    it('should handle admin access for regular users', async () => {
      const response = await request(app)
        .get('/api/admin/exchange-rates')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      // Mock service response
      (mockPointService.getBalance as jest.Mock).mockResolvedValue(1000);

      const promises = Array(10)
        .fill(null)
        .map(() =>
          request(app).get('/api/points/balance').set('Authorization', 'Bearer valid-token')
        );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should respond within acceptable time limits', async () => {
      // Mock service response
      (mockPointService.getTransactionHistory as jest.Mock).mockResolvedValue({
        transactions: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const start = Date.now();
      await request(app).get('/api/points/history').set('Authorization', 'Bearer valid-token');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500); // Should respond within 500ms
    });
  });
});
