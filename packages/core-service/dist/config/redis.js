"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeRedisCommand = exports.isRedisConnected = exports.disconnectRedis = exports.connectRedis = exports.redisClient = void 0;
const redis_1 = require("redis");
// Redis client configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// Create Redis client with configuration
exports.redisClient = (0, redis_1.createClient)({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            // Exponential backoff with max delay of 30 seconds
            const delay = Math.min(retries * 50, 30000);
            console.log(`Redis reconnecting in ${delay}ms...`);
            return delay;
        },
        connectTimeout: 5000, // 5 seconds
    },
    // Add retry mechanism for commands
    disableOfflineQueue: false,
});
// Event listeners for connection status
exports.redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});
exports.redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
});
exports.redisClient.on('ready', () => {
    console.log('✅ Redis client ready');
});
exports.redisClient.on('end', () => {
    console.log('❌ Redis client disconnected');
});
exports.redisClient.on('reconnecting', () => {
    console.log('🔄 Redis client reconnecting...');
});
/**
 * Connect to Redis with error handling
 */
const connectRedis = async () => {
    try {
        if (!exports.redisClient.isOpen) {
            await exports.redisClient.connect();
            console.log('Redis connection established');
        }
    }
    catch (error) {
        console.error('Failed to connect to Redis:', error);
        // Don't throw error here to allow application to start
        // but log the issue for monitoring
    }
};
exports.connectRedis = connectRedis;
/**
 * Disconnect Redis client
 */
const disconnectRedis = async () => {
    try {
        if (exports.redisClient.isOpen) {
            await exports.redisClient.quit();
            console.log('Redis client disconnected gracefully');
        }
    }
    catch (error) {
        console.error('Error disconnecting Redis:', error);
    }
};
exports.disconnectRedis = disconnectRedis;
/**
 * Check Redis connection status
 */
const isRedisConnected = () => {
    return exports.redisClient.isOpen;
};
exports.isRedisConnected = isRedisConnected;
/**
 * Execute Redis command with error handling
 */
const executeRedisCommand = async (command) => {
    try {
        if (!exports.redisClient.isOpen) {
            await (0, exports.connectRedis)();
        }
        return await command();
    }
    catch (error) {
        console.error('Redis command failed:', error);
        return null;
    }
};
exports.executeRedisCommand = executeRedisCommand;
// Export the client for direct use
exports.default = exports.redisClient;
//# sourceMappingURL=redis.js.map