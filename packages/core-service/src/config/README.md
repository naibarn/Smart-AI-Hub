# Redis Configuration

This directory contains the Redis configuration for the core-service.

## Files

- `redis.ts` - Redis client configuration with connection management and error handling
- `../services/redis.service.ts` - Service layer providing common Redis operations

## Usage

### Basic Configuration

The Redis client is configured to connect to the Redis URL specified in the `REDIS_URL` environment variable. If not provided, it defaults to `redis://localhost:6379`.

```typescript
import { redisClient, connectRedis } from '../config/redis';

// The client is automatically connected when the application starts
// You can also manually connect if needed
await connectRedis();
```

### Using RedisService

The `RedisService` provides a convenient wrapper around Redis operations with built-in error handling:

```typescript
import RedisService from '../services/redis.service';

// Set a value with optional expiration
await RedisService.set('key', 'value', 60); // Expires in 60 seconds

// Get a value
const value = await RedisService.get('key');

// Delete a key
await RedisService.del('key');

// Check if a key exists
const exists = await RedisService.exists('key');

// Increment a counter
const newValue = await RedisService.incr('counter');
```

### Connection Events

The Redis client emits several events that you can listen to:

- `connect` - When the client connects to Redis
- `ready` - When the client is ready to accept commands
- `error` - When an error occurs
- `end` - When the client disconnects
- `reconnecting` - When the client is attempting to reconnect

### Reconnection Logic

The Redis client is configured with automatic reconnection using exponential backoff:

- Initial delay: 50ms
- Maximum delay: 30 seconds
- The client will continue trying to reconnect until successful

### Graceful Shutdown

The application automatically handles graceful shutdown of the Redis connection when receiving SIGINT or SIGTERM signals.

## Environment Variables

- `REDIS_URL` - Redis connection URL (default: `redis://localhost:6379`)

## Error Handling

All Redis operations include error handling to prevent the application from crashing if Redis is unavailable. The RedisService wrapper returns null or default values when operations fail, allowing the application to continue functioning.

## Examples

### Caching Pattern

```typescript
import RedisService from '../services/redis.service';

// Check cache first
const cachedData = await RedisService.get('user:123');
if (cachedData) {
  return JSON.parse(cachedData);
}

// Get from database if not in cache
const data = await getUserFromDatabase(123);

// Cache the result for 5 minutes
await RedisService.set('user:123', JSON.stringify(data), 300);

return data;
```

### Rate Limiting

```typescript
import RedisService from '../services/redis.service';

// Increment request counter
const requests = await RedisService.incr(`rate_limit:${userId}`);

// Set expiration on first request
if (requests === 1) {
  await RedisService.expire(`rate_limit:${userId}`, 60); // 1 minute window
}

// Check if rate limit exceeded
if (requests > 10) {
  throw new Error('Rate limit exceeded');
}