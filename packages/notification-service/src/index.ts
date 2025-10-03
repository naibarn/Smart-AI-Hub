import { redisSubscriber, connectRedisClients } from '@shared/redis-client';

async function startSubscriber() {
  try {
    await connectRedisClients();

    redisSubscriber.subscribe('user-events', (message: string) => {
      try {
        const event = JSON.parse(message);
        if (event.type === 'USER_REGISTERED') {
          console.log(`Received USER_REGISTERED event for email: ${event.email}`);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  } catch (error) {
    console.error('Error starting subscriber:', error);
  }
}

startSubscriber();