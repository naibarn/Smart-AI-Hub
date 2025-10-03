"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRedisDefaults = exports.mockRedisConfig = exports.createMockRedisClient = exports.createMockRedisService = void 0;
const globals_1 = require("@jest/globals");
// Mock Redis Service
const createMockRedisService = () => ({
    get: globals_1.jest.fn(),
    set: globals_1.jest.fn(),
    setEx: globals_1.jest.fn(),
    del: globals_1.jest.fn(),
    exists: globals_1.jest.fn(),
    expire: globals_1.jest.fn(),
    ttl: globals_1.jest.fn(),
    incr: globals_1.jest.fn(),
    incrBy: globals_1.jest.fn(),
    lPush: globals_1.jest.fn(),
    rPop: globals_1.jest.fn(),
    lLen: globals_1.jest.fn(),
    lRange: globals_1.jest.fn(),
    sAdd: globals_1.jest.fn(),
    sRem: globals_1.jest.fn(),
    sIsMember: globals_1.jest.fn(),
    sMembers: globals_1.jest.fn(),
    keys: globals_1.jest.fn(),
});
exports.createMockRedisService = createMockRedisService;
// Mock Redis Client
const createMockRedisClient = () => ({
    isOpen: true,
    get: globals_1.jest.fn(),
    set: globals_1.jest.fn(),
    setEx: globals_1.jest.fn(),
    del: globals_1.jest.fn(),
    exists: globals_1.jest.fn(),
    expire: globals_1.jest.fn(),
    ttl: globals_1.jest.fn(),
    incr: globals_1.jest.fn(),
    incrBy: globals_1.jest.fn(),
    lPush: globals_1.jest.fn(),
    rPop: globals_1.jest.fn(),
    lLen: globals_1.jest.fn(),
    lRange: globals_1.jest.fn(),
    sAdd: globals_1.jest.fn(),
    sRem: globals_1.jest.fn(),
    sIsMember: globals_1.jest.fn(),
    sMembers: globals_1.jest.fn(),
    keys: globals_1.jest.fn(),
    connect: globals_1.jest.fn(),
    quit: globals_1.jest.fn(),
    on: globals_1.jest.fn(),
});
exports.createMockRedisClient = createMockRedisClient;
// Mock Redis Config
exports.mockRedisConfig = {
    redisClient: (0, exports.createMockRedisClient)(),
    connectRedis: globals_1.jest.fn(),
    disconnectRedis: globals_1.jest.fn(),
    executeRedisCommand: globals_1.jest.fn(),
};
// Setup default behaviors
const setupRedisDefaults = (mockRedisService) => {
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
exports.setupRedisDefaults = setupRedisDefaults;
exports.default = exports.createMockRedisService;
//# sourceMappingURL=redis.mock.js.map