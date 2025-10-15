import { createClient, RedisClientType } from 'redis';

// Redis client configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client with configuration
export const redisClient: RedisClientType = createClient({
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
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('end', () => {
  console.log('❌ Redis client disconnected');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis client reconnecting...');
});

/**
 * Connect to Redis with error handling
 */
export const connectRedis = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Redis connection established');
    }
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Don't throw error here to allow application to start
    // but log the issue for monitoring
  }
};

/**
 * Disconnect Redis client
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('Redis client disconnected gracefully');
    }
  } catch (error) {
    console.error('Error disconnecting Redis:', error);
  }
};

/**
 * Check Redis connection status
 */
export const isRedisConnected = (): boolean => {
  return redisClient.isOpen;
};

/**
 * Execute Redis command with error handling
 */
export const executeRedisCommand = async <T>(command: () => Promise<T>): Promise<T | null> => {
  try {
    if (!redisClient.isOpen) {
      await connectRedis();
    }
    return await command();
  } catch (error) {
    console.error('Redis command failed:', error);
    return null;
  }
};

// Export the client for direct use
export default redisClient;
