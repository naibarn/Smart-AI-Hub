import { PrismaClient } from '@prisma/client';
import * as analyticsService from '../services/analytics.service';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    usageLog: {
      create: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  })),
}));

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordUsage', () => {
    it('should record usage data successfully', async () => {
      const userId = 'user-123';
      const service = 'mcp';
      const model = 'gpt-4';
      const tokens = 1000;
      const credits = 100;
      const metadata = { endpoint: '/api/chat' };

      mockPrisma.usageLog.create.mockResolvedValue({} as any);

      await analyticsService.recordUsage(userId, service, model, tokens, credits, metadata);

      expect(mockPrisma.usageLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          service,
          model,
          tokens,
          credits,
          metadata,
        },
      });
    });

    it('should handle errors gracefully', async () => {
      const userId = 'user-123';
      const service = 'mcp';

      mockPrisma.usageLog.create.mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(analyticsService.recordUsage(userId, service)).resolves.toBeUndefined();
    });
  });

  describe('getUsageMetrics', () => {
    it('should return usage metrics', async () => {
      const filters = { startDate: new Date('2025-01-01') };

      mockPrisma.usageLog.count.mockResolvedValue(100);
      mockPrisma.usageLog.aggregate
        .mockResolvedValueOnce({ _sum: { tokens: 10000 } })
        .mockResolvedValueOnce({ _sum: { credits: 1000 } });

      const result = await analyticsService.getUsageMetrics(filters);

      expect(result).toEqual({
        totalRequests: 100,
        totalTokens: 10000,
        totalCredits: 1000,
      });
    });

    it('should handle zero values', async () => {
      mockPrisma.usageLog.count.mockResolvedValue(0);
      mockPrisma.usageLog.aggregate
        .mockResolvedValueOnce({ _sum: { tokens: null } })
        .mockResolvedValueOnce({ _sum: { credits: null } });

      const result = await analyticsService.getUsageMetrics();

      expect(result).toEqual({
        totalRequests: 0,
        totalTokens: 0,
        totalCredits: 0,
      });
    });
  });

  describe('getUsageByService', () => {
    it('should return usage grouped by service', async () => {
      const mockData = [
        {
          service: 'mcp',
          _count: { id: 80 },
          _sum: { tokens: 8000, credits: 800 },
        },
        {
          service: 'credits',
          _count: { id: 20 },
          _sum: { tokens: 2000, credits: 200 },
        },
      ];

      mockPrisma.usageLog.groupBy.mockResolvedValue(mockData as any);

      const result = await analyticsService.getUsageByService();

      expect(result).toEqual([
        {
          service: 'mcp',
          requests: 80,
          tokens: 8000,
          credits: 800,
        },
        {
          service: 'credits',
          requests: 20,
          tokens: 2000,
          credits: 200,
        },
      ]);
    });
  });

  describe('getUsageByModel', () => {
    it('should return usage grouped by model', async () => {
      const mockData = [
        {
          model: 'gpt-4',
          _count: { id: 60 },
          _sum: { tokens: 6000, credits: 600 },
        },
        {
          model: 'claude-3',
          _count: { id: 40 },
          _sum: { tokens: 4000, credits: 400 },
        },
      ];

      mockPrisma.usageLog.groupBy.mockResolvedValue(mockData as any);

      const result = await analyticsService.getUsageByModel();

      expect(result).toEqual([
        {
          model: 'gpt-4',
          requests: 60,
          tokens: 6000,
          credits: 600,
        },
        {
          model: 'claude-3',
          requests: 40,
          tokens: 4000,
          credits: 400,
        },
      ]);
    });
  });

  describe('getTopUsers', () => {
    it('should return top users by usage', async () => {
      const mockUsageData = [
        {
          userId: 'user-1',
          _count: { id: 50 },
          _sum: { tokens: 5000, credits: 500 },
          _max: { createdAt: new Date('2025-01-01T12:00:00Z') },
        },
        {
          userId: 'user-2',
          _count: { id: 30 },
          _sum: { tokens: 3000, credits: 300 },
          _max: { createdAt: new Date('2025-01-01T10:00:00Z') },
        },
      ];

      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];

      mockPrisma.usageLog.groupBy.mockResolvedValue(mockUsageData as any);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers as any);

      const result = await analyticsService.getTopUsers({}, 10);

      expect(result).toEqual([
        {
          userId: 'user-1',
          email: 'user1@example.com',
          totalRequests: 50,
          totalTokens: 5000,
          totalCredits: 500,
          lastActivity: new Date('2025-01-01T12:00:00Z'),
        },
        {
          userId: 'user-2',
          email: 'user2@example.com',
          totalRequests: 30,
          totalTokens: 3000,
          totalCredits: 300,
          lastActivity: new Date('2025-01-01T10:00:00Z'),
        },
      ]);
    });
  });

  describe('getUsageDataForExport', () => {
    it('should return paginated usage data for export', async () => {
      const mockUsageData = [
        {
          id: 'log-1',
          userId: 'user-1',
          user: { email: 'user1@example.com' },
          service: 'mcp',
          model: 'gpt-4',
          tokens: 1000,
          credits: 100,
          metadata: { endpoint: '/api/chat' },
          createdAt: new Date('2025-01-01T12:00:00Z'),
        },
      ];

      mockPrisma.usageLog.count.mockResolvedValue(1);
      mockPrisma.usageLog.findMany.mockResolvedValue(mockUsageData as any);

      const result = await analyticsService.getUsageDataForExport({}, 1, 10);

      expect(result).toEqual({
        data: [
          {
            id: 'log-1',
            userId: 'user-1',
            email: 'user1@example.com',
            service: 'mcp',
            model: 'gpt-4',
            tokens: 1000,
            credits: 100,
            metadata: '{"endpoint":"/api/chat"}',
            createdAt: '2025-01-01T12:00:00.000Z',
          },
        ],
        total: 1,
      });
    });
  });

  describe('getDashboardData', () => {
    it('should return comprehensive dashboard data', async () => {
      const mockOverview = {
        totalRequests: 100,
        totalTokens: 10000,
        totalCredits: 1000,
      };

      const mockServices = [
        {
          service: 'mcp',
          requests: 80,
          tokens: 8000,
          credits: 800,
        },
      ];

      const mockModels = [
        {
          model: 'gpt-4',
          requests: 60,
          tokens: 6000,
          credits: 600,
        },
      ];

      const mockTimeSeries = [
        {
          period: '2025-01-01',
          requests: 50,
          tokens: 5000,
          credits: 500,
          uniqueUsers: 10,
        },
      ];

      const mockTopUsers = [
        {
          userId: 'user-1',
          email: 'user1@example.com',
          totalRequests: 20,
          totalTokens: 2000,
          totalCredits: 200,
          lastActivity: new Date('2025-01-01T12:00:00Z'),
        },
      ];

      jest.spyOn(analyticsService, 'getUsageMetrics').mockResolvedValue(mockOverview);
      jest.spyOn(analyticsService, 'getUsageByService').mockResolvedValue(mockServices);
      jest.spyOn(analyticsService, 'getUsageByModel').mockResolvedValue(mockModels);
      jest.spyOn(analyticsService, 'getUsageTimeSeries').mockResolvedValue(mockTimeSeries);
      jest.spyOn(analyticsService, 'getTopUsers').mockResolvedValue(mockTopUsers);

      const result = await analyticsService.getDashboardData();

      expect(result).toEqual({
        overview: mockOverview,
        services: mockServices,
        models: mockModels,
        timeSeries: mockTimeSeries,
        topUsers: mockTopUsers,
      });
    });
  });
});
