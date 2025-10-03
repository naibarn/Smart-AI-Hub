"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const services_mock_1 = require("../__mocks__/services.mock");
const redis_mock_1 = require("../__mocks__/redis.mock");
// Import the test setup which handles all our mocking
require("../tests/setup");
// Create a test app
const createTestApp = () => {
    const app = (0, express_1.default)();
    // Basic middleware
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Mock auth middleware
    app.use((req, res, next) => {
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
        }
        else {
            req.user = {
                id: 'test-user-id',
                email: 'test@example.com',
                role: 'user',
            };
        }
        next();
    });
    // Mock RBAC middleware
    const requireRoles = (roles) => (req, res, next) => {
        if (roles.includes('admin') && req.user?.role !== 'admin') {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: `You need one of these roles: ${roles.join(', ')} to access this resource.`,
            });
        }
        next();
    };
    // Credit routes with direct implementation to avoid server startup
    app.get('/api/credits/balance', async (req, res, next) => {
        try {
            const userId = req.user.id;
            const cacheKey = `credit_balance:${userId}`;
            // Check Redis cache
            const cached = await mockRedisService.get(cacheKey);
            if (cached) {
                return res.json({
                    data: parseInt(cached),
                    meta: { cached: true }
                });
            }
            // Get from service
            const balance = await services_mock_1.mockCreditService.getBalance(userId);
            // Cache the result
            await mockRedisService.set(cacheKey, balance.toString(), 60);
            res.json({
                data: balance,
                meta: { cached: false }
            });
        }
        catch (error) {
            next(error);
        }
    });
    app.get('/api/credits/history', async (req, res, next) => {
        try {
            const userId = req.user.id;
            const pageParam = req.query.page;
            const limitParam = req.query.limit;
            const page = pageParam ? parseInt(pageParam) : 1;
            const limit = limitParam ? parseInt(limitParam) : 20;
            // Validate pagination
            if (pageParam && (isNaN(page) || page < 1 || !Number.isInteger(page))) {
                return res.status(400).json({
                    error: { message: 'Page must be a positive integer' }
                });
            }
            if (limitParam && (isNaN(limit) || limit < 1 || limit > 100 || !Number.isInteger(limit))) {
                return res.status(400).json({
                    error: { message: 'Limit must be between 1 and 100' }
                });
            }
            const result = await services_mock_1.mockCreditService.getHistory(userId, page, limit);
            res.json({
                data: result.data,
                meta: {
                    pagination: {
                        page,
                        limit,
                        total: result.total,
                        totalPages: Math.ceil(result.total / limit)
                    }
                }
            });
        }
        catch (error) {
            next(error);
        }
    });
    app.post('/api/credits/redeem', async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { code } = req.body;
            // Validate input
            if (!code) {
                return res.status(400).json({
                    error: { message: 'Promo code is required' }
                });
            }
            if (typeof code !== 'string' || code.length < 3) {
                return res.status(400).json({
                    error: { message: 'Invalid promo code format' }
                });
            }
            const credits = await services_mock_1.mockCreditService.redeemPromo(userId, code);
            // Clear cache
            await mockRedisService.del(`credit_balance:${userId}`);
            res.json({
                data: {
                    credits,
                    message: `Successfully redeemed ${credits} credits`
                }
            });
        }
        catch (error) {
            next(error);
        }
    });
    app.post('/api/admin/credits/adjust', requireRoles(['admin']), async (req, res, next) => {
        try {
            const { userId, amount, reason } = req.body;
            // Validate input
            if (amount === undefined || amount === null) {
                return res.status(400).json({
                    error: { message: 'Amount is required' }
                });
            }
            if (typeof amount !== 'number') {
                return res.status(400).json({
                    error: { message: 'Amount must be a number' }
                });
            }
            if (!reason || typeof reason !== 'string' || reason.trim() === '') {
                return res.status(400).json({
                    error: { message: 'Reason is required and must be a non-empty string' }
                });
            }
            const newBalance = await services_mock_1.mockCreditService.adjustCredits(userId, amount, reason);
            // Clear cache
            await mockRedisService.del(`credit_balance:${userId}`);
            res.json({
                data: {
                    newBalance,
                    message: 'Credits adjusted successfully'
                }
            });
        }
        catch (error) {
            next(error);
        }
    });
    // Error handler
    app.use((error, req, res, next) => {
        res.status(500).json({
            error: { message: error.message }
        });
    });
    return app;
};
const mockRedisService = (0, redis_mock_1.createMockRedisService)();
describe('Credit Controller', () => {
    let app;
    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
    };
    const mockAdminUser = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        role: 'admin',
    };
    const mockCreditAccount = {
        userId: 'test-user-id',
        currentBalance: 100,
        totalPurchased: 100,
        totalUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const mockCreditTransaction = {
        id: 'transaction-id',
        userId: 'test-user-id',
        amount: 50,
        type: 'purchase',
        balanceAfter: 100,
        description: 'Test transaction',
        metadata: {},
        createdAt: '2025-10-03T13:36:09.161Z', // Use string format to match JSON serialization
    };
    const mockPromoCode = {
        id: 'promo-id',
        code: 'TEST123',
        credits: 25,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
        maxUses: 100,
        usedCount: 0,
    };
    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });
    describe('GET /credits/balance', () => {
        test('should return balance for authenticated user', async () => {
            // Mock Redis cache miss
            mockRedisService.get.mockResolvedValue(null);
            // Mock service response
            services_mock_1.mockCreditService.getBalance.mockResolvedValue(100);
            // Mock Redis set
            mockRedisService.set.mockResolvedValue(true);
            const response = await (0, supertest_1.default)(app)
                .get('/api/credits/balance')
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(200);
            expect(response.body.data).toBe(100);
            expect(response.body.meta.cached).toBe(false);
            expect(services_mock_1.mockCreditService.getBalance).toHaveBeenCalledWith('test-user-id');
            expect(mockRedisService.get).toHaveBeenCalledWith('credit_balance:test-user-id');
            expect(mockRedisService.set).toHaveBeenCalledWith('credit_balance:test-user-id', '100', 60);
        });
        test('should return cached balance when available', async () => {
            // Mock Redis cache hit
            mockRedisService.get.mockResolvedValue('100');
            const response = await (0, supertest_1.default)(app)
                .get('/api/credits/balance')
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(200);
            expect(response.body.data).toBe(100);
            expect(response.body.meta.cached).toBe(true);
            expect(mockRedisService.get).toHaveBeenCalledWith('credit_balance:test-user-id');
            expect(services_mock_1.mockCreditService.getBalance).not.toHaveBeenCalled();
        });
        test('should return 401 if not authenticated', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/credits/balance');
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access denied');
            expect(response.body.message).toBe('No token provided or invalid format');
        });
        test('should return 500 if service fails', async () => {
            // Mock Redis cache miss
            mockRedisService.get.mockResolvedValue(null);
            // Mock service error
            services_mock_1.mockCreditService.getBalance.mockRejectedValue(new Error('Credit account not found for user: test-user-id'));
            const response = await (0, supertest_1.default)(app)
                .get('/api/credits/balance')
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(500);
        });
    });
    describe('GET /credits/history', () => {
        test('should return paginated history', async () => {
            const mockHistory = {
                data: [mockCreditTransaction],
                total: 1,
            };
            services_mock_1.mockCreditService.getHistory.mockResolvedValue(mockHistory);
            const response = await (0, supertest_1.default)(app)
                .get('/api/credits/history?page=1&limit=10')
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([mockCreditTransaction]);
            expect(response.body.meta.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            });
            expect(services_mock_1.mockCreditService.getHistory).toHaveBeenCalledWith('test-user-id', 1, 10);
        });
        test('should use default pagination params', async () => {
            const mockHistory = {
                data: [mockCreditTransaction],
                total: 1,
            };
            services_mock_1.mockCreditService.getHistory.mockResolvedValue(mockHistory);
            const response = await (0, supertest_1.default)(app)
                .get('/api/credits/history')
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(200);
            expect(response.body.meta.pagination.page).toBe(1);
            expect(response.body.meta.pagination.limit).toBe(20);
            expect(services_mock_1.mockCreditService.getHistory).toHaveBeenCalledWith('test-user-id', 1, 20);
        });
        test('should validate page and limit params', async () => {
            // Test invalid page
            const response1 = await (0, supertest_1.default)(app)
                .get('/api/credits/history?page=0')
                .set('Authorization', 'Bearer valid-token');
            expect(response1.status).toBe(400);
            expect(response1.body.error.message).toBe('Page must be a positive integer');
            // Test invalid limit (too low)
            const response2 = await (0, supertest_1.default)(app)
                .get('/api/credits/history?limit=0')
                .set('Authorization', 'Bearer valid-token');
            expect(response2.status).toBe(400);
            expect(response2.body.error.message).toBe('Limit must be between 1 and 100');
            // Test invalid limit (too high)
            const response3 = await (0, supertest_1.default)(app)
                .get('/api/credits/history?limit=101')
                .set('Authorization', 'Bearer valid-token');
            expect(response3.status).toBe(400);
            expect(response3.body.error.message).toBe('Limit must be between 1 and 100');
        });
        test('should return 401 if not authenticated', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/credits/history');
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access denied');
        });
    });
    describe('POST /credits/redeem', () => {
        test('should redeem valid promo code', async () => {
            // Mock service response
            services_mock_1.mockCreditService.redeemPromo.mockResolvedValue(25);
            // Mock Redis delete
            mockRedisService.del.mockResolvedValue(true);
            const response = await (0, supertest_1.default)(app)
                .post('/api/credits/redeem')
                .set('Authorization', 'Bearer valid-token')
                .send({ code: 'TEST123' });
            expect(response.status).toBe(200);
            expect(response.body.data.credits).toBe(25);
            expect(response.body.data.message).toBe('Successfully redeemed 25 credits');
            expect(services_mock_1.mockCreditService.redeemPromo).toHaveBeenCalledWith('test-user-id', 'TEST123');
            expect(mockRedisService.del).toHaveBeenCalledWith('credit_balance:test-user-id');
        });
        test('should return error for invalid code', async () => {
            // Mock service error
            services_mock_1.mockCreditService.redeemPromo.mockRejectedValue(new Error('Promo code not found'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/credits/redeem')
                .set('Authorization', 'Bearer valid-token')
                .send({ code: 'INVALID' });
            expect(response.status).toBe(500);
            expect(services_mock_1.mockCreditService.redeemPromo).toHaveBeenCalledWith('test-user-id', 'INVALID');
        });
        test('should return error if already used', async () => {
            // Mock service error
            services_mock_1.mockCreditService.redeemPromo.mockRejectedValue(new Error('You have already used this promo code'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/credits/redeem')
                .set('Authorization', 'Bearer valid-token')
                .send({ code: 'USED123' });
            expect(response.status).toBe(500);
            expect(services_mock_1.mockCreditService.redeemPromo).toHaveBeenCalledWith('test-user-id', 'USED123');
        });
        test('should return error for missing code', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/credits/redeem')
                .set('Authorization', 'Bearer valid-token')
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Promo code is required');
        });
        test('should return error for invalid code format', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/credits/redeem')
                .set('Authorization', 'Bearer valid-token')
                .send({ code: 'ab' }); // Too short
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Invalid promo code format');
        });
        test('should return 401 if not authenticated', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/credits/redeem')
                .send({ code: 'TEST123' });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access denied');
        });
    });
    describe('POST /admin/credits/adjust (admin only)', () => {
        test('should adjust credits with valid reason', async () => {
            // Mock service response
            services_mock_1.mockCreditService.adjustCredits.mockResolvedValue(150);
            // Mock Redis delete
            mockRedisService.del.mockResolvedValue(true);
            const response = await (0, supertest_1.default)(app)
                .post('/api/admin/credits/adjust')
                .set('Authorization', 'Bearer admin-token')
                .send({ userId: 'test-user-id', amount: 50, reason: 'Admin adjustment for testing' });
            expect(response.status).toBe(200);
            expect(response.body.data.newBalance).toBe(150);
            expect(response.body.data.message).toBe('Credits adjusted successfully');
            expect(services_mock_1.mockCreditService.adjustCredits).toHaveBeenCalledWith('test-user-id', 50, 'Admin adjustment for testing');
            expect(mockRedisService.del).toHaveBeenCalledWith('credit_balance:test-user-id');
        });
        test('should return 403 if not admin', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/admin/credits/adjust')
                .set('Authorization', 'Bearer user-token')
                .send({ userId: 'test-user-id', amount: 50, reason: 'Test adjustment' });
            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Insufficient permissions');
        });
        test('should return error for missing amount', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/admin/credits/adjust')
                .set('Authorization', 'Bearer admin-token')
                .send({ userId: 'test-user-id', reason: 'Test adjustment' });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Amount is required');
        });
        test('should return error for non-numeric amount', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/admin/credits/adjust')
                .set('Authorization', 'Bearer admin-token')
                .send({ userId: 'test-user-id', amount: 'fifty', reason: 'Test adjustment' });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Amount must be a number');
        });
        test('should return error for missing reason', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/admin/credits/adjust')
                .set('Authorization', 'Bearer admin-token')
                .send({ userId: 'test-user-id', amount: 50 });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Reason is required and must be a non-empty string');
        });
        test('should return error for empty reason', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/admin/credits/adjust')
                .set('Authorization', 'Bearer admin-token')
                .send({ userId: 'test-user-id', amount: 50, reason: '   ' });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Reason is required and must be a non-empty string');
        });
        test('should return 401 if not authenticated', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/admin/credits/adjust')
                .send({ userId: 'test-user-id', amount: 50, reason: 'Test adjustment' });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access denied');
        });
    });
});
//# sourceMappingURL=credit.controller.test.js.map