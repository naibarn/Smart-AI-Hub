import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

export const redisPublisher = createClient({ url: redisUrl });

export const redisSubscriber = redisPublisher.duplicate();

export async function connectRedisClients() {
  try {
    await redisPublisher.connect();
    await redisSubscriber.connect();
    console.log('Successfully connected to Redis clients');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}