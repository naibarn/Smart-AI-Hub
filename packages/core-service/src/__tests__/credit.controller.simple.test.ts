import request from 'supertest';
import express from 'express';
import * as creditController from '../controllers/credit.controller';
import RedisService from '../services/redis.service';
import * as creditService from '../services/credit.service';

// Mock the dependencies using proper Jest pattern to avoid hoisting issues
jest.mock('../config/redis', () => ({
  executeRedisCommand: jest.fn(),
}));

jest.mock('../services/credit.service', () => ({
  getBalance: jest.fn(),
  getHistory: jest.fn(),
  redeemPromo: jest.fn(),
  adjustCredits: jest.fn(),
}));

// Also mock the RedisService since that's what's actually imported
jest.mock('../services/redis.service', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  RedisService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

// Now we can safely get references to the mocked functions
// Get references to mocked functions using jest.mocked
import { executeRedisCommand } from '../config/redis';
import * as creditServiceModule from '../services/credit.service';
import RedisServiceModule from '../services/redis.service';

const mockGetBalance = jest.mocked(creditServiceModule.getBalance);
const mockRedeemPromo = jest.mocked(creditServiceModule.redeemPromo);
const mockAdjustCredits = jest.mocked(creditServiceModule.adjustCredits);
const mockGetHistory = jest.mocked(creditServiceModule.getHistory);
const mockRedisService = jest.mocked(RedisServiceModule);
const MockRedisServiceClass = jest.mocked(RedisServiceModule);
const mockExecuteRedisCommand = jest.mocked(executeRedisCommand);

// Create a test app with our controller
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided or invalid format',
    });
  }
  
  // For testing, we'll set a mock user based on the token
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
};

// Mock RBAC middleware
const mockRequirePermission = (resource: string, action: string) => (req: any, res: any, next: any) => {
  next();
};

const mockRequireRoles = (roles: string[]) => (req: any, res: any, next: any) => {
  if (roles.includes('admin') && req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: `You need one of these roles: ${roles.join(', ')} to access this resource.`,
    });
  }
  next();
};

// Apply routes
app.get('/credits/balance', mockAuth, mockRequirePermission('credits', 'read'), creditController.getBalance);
app.get('/credits/history', mockAuth, mockRequirePermission('credits', 'read'), creditController.getHistory);
app.post('/credits/redeem', mockAuth, mockRequirePermission('credits', 'write'), creditController.redeemPromoCode);
app.post('/admin/credits/adjust', mockAuth, mockRequireRoles(['admin', 'superadmin']), creditController.adjustCredits);

// Mock error handler with debugging
app.use((err: any, req: any, res: any, next: any) => {
  // Suppress error logging in tests to keep output clean
  // console.error('Test Error Handler:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    message: err.message || 'Internal server error',
  });
});

describe('Credit Controller (Simple)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBalance.mockResolvedValue(100);
    mockGetHistory.mockResolvedValue({ data: [], total: 0 });
    mockRedeemPromo.mockResolvedValue(25);
    mockAdjustCredits.mockResolvedValue(150);
    
    // Mock RedisService methods
    mockRedisService.get.mockResolvedValue(null);
    mockRedisService.set.mockResolvedValue(true);
    mockRedisService.del.mockResolvedValue(true);
    MockRedisServiceClass.get.mockResolvedValue(null);
    MockRedisServiceClass.set.mockResolvedValue(true);
    MockRedisServiceClass.del.mockResolvedValue(true);
  });

  describe('GET /credits/balance', () => {
    test('should return balance for authenticated user', async () => {
      // Mock Redis cache miss
      mockExecuteRedisCommand.mockResolvedValue(null);
      mockRedisService.get.mockResolvedValue(null);

      // Mock service response
      mockGetBalance.mockResolvedValue(100);

      const response = await request(app)
        .get('/credits/balance')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toBe(100);
      expect(response.body.meta.cached).toBe(false);
      expect(mockGetBalance).toHaveBeenCalledWith('test-user-id');
    });

    test('should return cached balance when available', async () => {
      // Mock Redis cache hit
      mockRedisService.get.mockResolvedValue('100');

      const response = await request(app)
        .get('/credits/balance')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toBe(100);
      expect(response.body.meta.cached).toBe(true);
      expect(mockGetBalance).not.toHaveBeenCalled();
    });

    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/credits/balance');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('GET /credits/history', () => {
    test('should return paginated history', async () => {
      const mockTransaction = {
        id: 'transaction-id',
        userId: 'test-user-id',
        amount: 50,
        type: 'purchase' as const,
        balanceAfter: 100,
        description: 'Test transaction',
        metadata: {},
        createdAt: new Date(),
      };

      const mockHistory = {
        data: [mockTransaction],
        total: 1,
      };

      mockGetHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/credits/history?page=1&limit=10')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(mockGetHistory).toHaveBeenCalledWith('test-user-id', 1, 10);
    });

    test('should use default pagination params', async () => {
      const mockHistory = {
        data: [],
        total: 0,
      };

      mockGetHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/credits/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.meta.pagination.page).toBe(1);
      expect(response.body.meta.pagination.limit).toBe(20);
      expect(mockGetHistory).toHaveBeenCalledWith('test-user-id', 1, 20);
    });
  });

  describe('POST /credits/redeem', () => {
    test('should redeem valid promo code', async () => {
      // Mock service response
      mockRedeemPromo.mockResolvedValue(25);

      const response = await request(app)
        .post('/credits/redeem')
        .set('Authorization', 'Bearer valid-token')
        .send({ code: 'TEST123' });

      expect(response.status).toBe(200);
      expect(response.body.data.credits).toBe(25);
      expect(response.body.data.message).toBe('Successfully redeemed 25 credits');
      expect(mockRedeemPromo).toHaveBeenCalledWith('test-user-id', 'TEST123');
    });

    test('should return error for missing code', async () => {
      const response = await request(app)
        .post('/credits/redeem')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Promo code is required');
    });
  });

  describe('POST /admin/credits/adjust', () => {
    test('should adjust credits with valid reason', async () => {
      // Mock service response
      mockAdjustCredits.mockResolvedValue(150);

      const response = await request(app)
        .post('/admin/credits/adjust')
        .set('Authorization', 'Bearer admin-token')
        .send({ userId: 'test-user-id', amount: 50, reason: 'Admin adjustment for testing' });

      expect(response.status).toBe(200);
      expect(response.body.data.newBalance).toBe(150);
      expect(response.body.data.message).toBe('Credits adjusted successfully');
      expect(mockAdjustCredits).toHaveBeenCalledWith('test-user-id', 50, 'Admin adjustment for testing');
    });

    test('should return 403 if not admin', async () => {
      const response = await request(app)
        .post('/admin/credits/adjust')
        .set('Authorization', 'Bearer user-token')
        .send({ userId: 'test-user-id', amount: 50, reason: 'Test adjustment' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should return error for missing amount', async () => {
      const response = await request(app)
        .post('/admin/credits/adjust')
        .set('Authorization', 'Bearer admin-token')
        .send({ userId: 'test-user-id', reason: 'Test adjustment' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Amount is required');
    });
  });
});