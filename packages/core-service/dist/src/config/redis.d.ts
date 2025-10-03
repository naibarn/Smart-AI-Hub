import { RedisClientType } from 'redis';
export declare const redisClient: RedisClientType;
/**
 * Connect to Redis with error handling
 */
export declare const connectRedis: () => Promise<void>;
/**
 * Disconnect Redis client
 */
export declare const disconnectRedis: () => Promise<void>;
/**
 * Check Redis connection status
 */
export declare const isRedisConnected: () => boolean;
/**
 * Execute Redis command with error handling
 */
export declare const executeRedisCommand: <T>(command: () => Promise<T>) => Promise<T | null>;
export default redisClient;
//# sourceMappingURL=redis.d.ts.map