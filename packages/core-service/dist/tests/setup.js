"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    Promise.resolve().then(() => __importStar(require('../__mocks__/services.mock'))).then(({ mockCreditService }) => {
        return { CreditService: mockCreditService };
    });
});
jest.mock('../services/permission.service', () => {
    Promise.resolve().then(() => __importStar(require('../__mocks__/services.mock'))).then(({ mockPermissionService }) => {
        return { PermissionService: mockPermissionService };
    });
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