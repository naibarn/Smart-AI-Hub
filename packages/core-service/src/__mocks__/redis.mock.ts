import { jest } from '@jest/globals';

// Mock Redis Service
export const createMockRedisService = () => ({
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  incr: jest.fn(),
  incrBy: jest.fn(),
  lPush: jest.fn(),
  rPop: jest.fn(),
  lLen: jest.fn(),
  lRange: jest.fn(),
  sAdd: jest.fn(),
  sRem: jest.fn(),
  sIsMember: jest.fn(),
  sMembers: jest.fn(),
  keys: jest.fn(),
});

// Mock Redis Client
export const createMockRedisClient = () => ({
  isOpen: true,
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  incr: jest.fn(),
  incrBy: jest.fn(),
  lPush: jest.fn(),
  rPop: jest.fn(),
  lLen: jest.fn(),
  lRange: jest.fn(),
  sAdd: jest.fn(),
  sRem: jest.fn(),
  sIsMember: jest.fn(),
  sMembers: jest.fn(),
  keys: jest.fn(),
  connect: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
});

// Mock Redis Config
export const mockRedisConfig = {
  redisClient: createMockRedisClient(),
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
  executeRedisCommand: jest.fn(),
};

// Setup default behaviors
export const setupRedisDefaults = (mockRedisService: any) => {
  mockRedisService.get.mockResolvedValue(null);
  mockRedisService.set.mockResolvedValue(true);
  mockRedisService.setEx.mockResolvedValue(true);
  mockRedisService.del.mockResolvedValue(1);
  mockRedisService.exists.mockResolvedValue(0);
  mockRedisService.expire.mockResolvedValue(true);
  mockRedisService.ttl.mockResolvedValue(-1);
  mockRedisService.incr.mockResolvedValue(1);
  mockRedisService.incrBy.mockResolvedValue(1);
  mockRedisService.keys.mockResolvedValue([]);
};

export default createMockRedisService;
