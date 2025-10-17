import { PrismaClient, PointTransactionType } from '@prisma/client';

// Set environment variable before importing the service
process.env.DAILY_REWARD_ENABLED = 'false';

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

// Import the service AFTER setting environment variable
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pointService = require('../services/point.service');

describe('PointService with Daily Rewards Disabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset environment variable for other tests
    process.env.DAILY_REWARD_ENABLED = 'true';
  });

  describe('claimDailyReward', () => {
    it('should throw error if daily rewards are disabled', async () => {
      const userId = 'user-123';

      // Mock no existing reward and user
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        profile: { preferences: { timezone: 'UTC' } },
      } as any);
      mockPrisma.dailyLoginReward.findUnique.mockResolvedValue(null as any);

      await expect(pointService.claimDailyReward(userId)).rejects.toThrow(
        'Daily rewards are currently disabled'
      );
    });
  });
});
