import Redis from 'ioredis';
import logger from './logger';

// Redis client for Bull queue and caching
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

// Connect to Redis
const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
    logger.info('Redis client connected');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Disconnect from Redis
const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.disconnect();
    logger.info('Redis client disconnected');
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
  }
};

// Test Redis connection
const testRedisConnection = async (): Promise<boolean> => {
  try {
    const result = await redis.ping();
    logger.info('Redis ping result:', result);
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis ping failed:', error);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectRedis();
});

process.on('SIGTERM', async () => {
  await disconnectRedis();
});

export { redis, connectRedis, disconnectRedis, testRedisConnection };
