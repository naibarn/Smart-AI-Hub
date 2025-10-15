import { redisClient, executeRedisCommand } from '../config/redis';

/**
 * Redis Service - Provides common Redis operations with error handling
 */
export class RedisService {
  /**
   * Set a key-value pair with optional expiration
   * @param key - Redis key
   * @param value - Value to store
   * @param ttlSeconds - Time to live in seconds (optional)
   * @returns Promise<boolean> - True if successful
   */
  static async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    const result = await executeRedisCommand(async () => {
      if (ttlSeconds) {
        await redisClient.setEx(key, ttlSeconds, value);
      } else {
        await redisClient.set(key, value);
      }
      return true;
    });
    return result ?? false;
  }

  /**
   * Get value by key
   * @param key - Redis key
   * @returns Promise<string | null> - Value or null if not found
   */
  static async get(key: string): Promise<string | null> {
    return executeRedisCommand(async () => {
      return await redisClient.get(key);
    });
  }

  /**
   * Delete a key
   * @param key - Redis key
   * @returns Promise<boolean> - True if key was deleted
   */
  static async del(key: string): Promise<boolean> {
    const result = await executeRedisCommand(async () => {
      const delResult = await redisClient.del(key);
      return delResult > 0;
    });
    return result ?? false;
  }

  /**
   * Check if key exists
   * @param key - Redis key
   * @returns Promise<boolean> - True if key exists
   */
  static async exists(key: string): Promise<boolean> {
    const result = await executeRedisCommand(async () => {
      const existsResult = await redisClient.exists(key);
      return existsResult === 1;
    });
    return result ?? false;
  }

  /**
   * Set expiration on existing key
   * @param key - Redis key
   * @param ttlSeconds - Time to live in seconds
   * @returns Promise<boolean> - True if successful
   */
  static async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await executeRedisCommand(async () => {
      const expireResult = await redisClient.expire(key, ttlSeconds);
      return (expireResult as unknown as number) === 1;
    });
    return result ?? false;
  }

  /**
   * Get remaining time to live for a key
   * @param key - Redis key
   * @returns Promise<number> - TTL in seconds, -1 if no expiration, -2 if key doesn't exist
   */
  static async ttl(key: string): Promise<number> {
    const result = await executeRedisCommand(async () => {
      return await redisClient.ttl(key);
    });
    return result ?? -2;
  }

  /**
   * Increment a numeric value
   * @param key - Redis key
   * @returns Promise<number | null> - New value after increment
   */
  static async incr(key: string): Promise<number | null> {
    return executeRedisCommand(async () => {
      return await redisClient.incr(key);
    });
  }

  /**
   * Increment a numeric value by a specified amount
   * @param key - Redis key
   * @param increment - Amount to increment by
   * @returns Promise<number | null> - New value after increment
   */
  static async incrBy(key: string, increment: number): Promise<number | null> {
    return executeRedisCommand(async () => {
      return await redisClient.incrBy(key, increment);
    });
  }

  /**
   * Add item to a list (left push)
   * @param key - Redis key
   * @param value - Value to add
   * @returns Promise<number | null> - New list length
   */
  static async lPush(key: string, value: string): Promise<number | null> {
    return executeRedisCommand(async () => {
      return await redisClient.lPush(key, value);
    });
  }

  /**
   * Remove and get item from a list (right pop)
   * @param key - Redis key
   * @returns Promise<string | null> - Popped value or null if list is empty
   */
  static async rPop(key: string): Promise<string | null> {
    return executeRedisCommand(async () => {
      return await redisClient.rPop(key);
    });
  }

  /**
   * Get list length
   * @param key - Redis key
   * @returns Promise<number> - List length
   */
  static async lLen(key: string): Promise<number> {
    const result = await executeRedisCommand(async () => {
      return await redisClient.lLen(key);
    });
    return result ?? 0;
  }

  /**
   * Get all items in a list
   * @param key - Redis key
   * @returns Promise<string[]> - Array of list items
   */
  static async lRange(key: string): Promise<string[]> {
    const result = await executeRedisCommand(async () => {
      return await redisClient.lRange(key, 0, -1);
    });
    return result ?? [];
  }

  /**
   * Add item to a set
   * @param key - Redis key
   * @param value - Value to add
   * @returns Promise<boolean> - True if item was added (wasn't already in set)
   */
  static async sAdd(key: string, value: string): Promise<boolean> {
    const result = await executeRedisCommand(async () => {
      const addResult = await redisClient.sAdd(key, value);
      return addResult > 0;
    });
    return result ?? false;
  }

  /**
   * Remove item from a set
   * @param key - Redis key
   * @param value - Value to remove
   * @returns Promise<boolean> - True if item was removed
   */
  static async sRem(key: string, value: string): Promise<boolean> {
    const result = await executeRedisCommand(async () => {
      const remResult = await redisClient.sRem(key, value);
      return remResult > 0;
    });
    return result ?? false;
  }

  /**
   * Check if item exists in a set
   * @param key - Redis key
   * @param value - Value to check
   * @returns Promise<boolean> - True if item exists in set
   */
  static async sIsMember(key: string, value: string): Promise<boolean> {
    const result = await executeRedisCommand(async () => {
      return await redisClient.sIsMember(key, value);
    });
    return result ?? false;
  }

  /**
   * Get all items in a set
   * @param key - Redis key
   * @returns Promise<string[]> - Array of set items
   */
  static async sMembers(key: string): Promise<string[]> {
    const result = await executeRedisCommand(async () => {
      return await redisClient.sMembers(key);
    });
    return result ?? [];
  }
}

export default RedisService;
