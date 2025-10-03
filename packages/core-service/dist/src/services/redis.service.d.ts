/**
 * Redis Service - Provides common Redis operations with error handling
 */
export declare class RedisService {
    /**
     * Set a key-value pair with optional expiration
     * @param key - Redis key
     * @param value - Value to store
     * @param ttlSeconds - Time to live in seconds (optional)
     * @returns Promise<boolean> - True if successful
     */
    static set(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
    /**
     * Get value by key
     * @param key - Redis key
     * @returns Promise<string | null> - Value or null if not found
     */
    static get(key: string): Promise<string | null>;
    /**
     * Delete a key
     * @param key - Redis key
     * @returns Promise<boolean> - True if key was deleted
     */
    static del(key: string): Promise<boolean>;
    /**
     * Check if key exists
     * @param key - Redis key
     * @returns Promise<boolean> - True if key exists
     */
    static exists(key: string): Promise<boolean>;
    /**
     * Set expiration on existing key
     * @param key - Redis key
     * @param ttlSeconds - Time to live in seconds
     * @returns Promise<boolean> - True if successful
     */
    static expire(key: string, ttlSeconds: number): Promise<boolean>;
    /**
     * Get remaining time to live for a key
     * @param key - Redis key
     * @returns Promise<number> - TTL in seconds, -1 if no expiration, -2 if key doesn't exist
     */
    static ttl(key: string): Promise<number>;
    /**
     * Increment a numeric value
     * @param key - Redis key
     * @returns Promise<number | null> - New value after increment
     */
    static incr(key: string): Promise<number | null>;
    /**
     * Increment a numeric value by a specified amount
     * @param key - Redis key
     * @param increment - Amount to increment by
     * @returns Promise<number | null> - New value after increment
     */
    static incrBy(key: string, increment: number): Promise<number | null>;
    /**
     * Add item to a list (left push)
     * @param key - Redis key
     * @param value - Value to add
     * @returns Promise<number | null> - New list length
     */
    static lPush(key: string, value: string): Promise<number | null>;
    /**
     * Remove and get item from a list (right pop)
     * @param key - Redis key
     * @returns Promise<string | null> - Popped value or null if list is empty
     */
    static rPop(key: string): Promise<string | null>;
    /**
     * Get list length
     * @param key - Redis key
     * @returns Promise<number> - List length
     */
    static lLen(key: string): Promise<number>;
    /**
     * Get all items in a list
     * @param key - Redis key
     * @returns Promise<string[]> - Array of list items
     */
    static lRange(key: string): Promise<string[]>;
    /**
     * Add item to a set
     * @param key - Redis key
     * @param value - Value to add
     * @returns Promise<boolean> - True if item was added (wasn't already in set)
     */
    static sAdd(key: string, value: string): Promise<boolean>;
    /**
     * Remove item from a set
     * @param key - Redis key
     * @param value - Value to remove
     * @returns Promise<boolean> - True if item was removed
     */
    static sRem(key: string, value: string): Promise<boolean>;
    /**
     * Check if item exists in a set
     * @param key - Redis key
     * @param value - Value to check
     * @returns Promise<boolean> - True if item exists in set
     */
    static sIsMember(key: string, value: string): Promise<boolean>;
    /**
     * Get all items in a set
     * @param key - Redis key
     * @returns Promise<string[]> - Array of set items
     */
    static sMembers(key: string): Promise<string[]>;
}
export default RedisService;
//# sourceMappingURL=redis.service.d.ts.map