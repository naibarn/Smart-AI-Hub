import { PrismaClient } from '@prisma/client';
import { createMockPrismaClient } from '../__mocks__/prisma.mock';
import { createMockRedisService, createMockRedisClient } from '../__mocks__/redis.mock';

// Mock Prisma Client with comprehensive implementation
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => createMockPrismaClient()),
}));

// Mock Redis with comprehensive implementation
jest.mock('../config/redis', () => createMockRedisClient());

// Mock Redis Service with comprehensive implementation
jest.mock('../services/redis.service', () => ({
  RedisService: createMockRedisService(),
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