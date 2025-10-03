"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_mock_1 = require("../__mocks__/prisma.mock");
const redis_mock_1 = require("../__mocks__/redis.mock");
// Mock Prisma Client with comprehensive implementation
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => (0, prisma_mock_1.createMockPrismaClient)()),
}));
// Mock Redis with comprehensive implementation
jest.mock('../config/redis', () => (0, redis_mock_1.createMockRedisClient)());
// Mock Redis Service with comprehensive implementation
jest.mock('../services/redis.service', () => ({
    RedisService: (0, redis_mock_1.createMockRedisService)(),
}));
// Mock Credit and Permission Services
jest.mock('../services/credit.service', () => {
    const { mockCreditService } = require('../__mocks__/services.mock');
    return { CreditService: mockCreditService };
});
jest.mock('../services/permission.service', () => {
    const { mockPermissionService } = require('../__mocks__/services.mock');
    return { PermissionService: mockPermissionService };
});
// Mock JWT
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(),
    JsonWebTokenError: jest.fn(),
    TokenExpiredError: jest.fn(),
}));
// Global test setup
beforeEach(() => {
    jest.clearAllMocks();
});
afterEach(() => {
    jest.restoreAllMocks();
});
//# sourceMappingURL=setup.js.map