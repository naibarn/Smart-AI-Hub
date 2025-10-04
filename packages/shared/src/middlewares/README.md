# JWT Authentication Middleware

This directory contains JWT authentication middleware for Express applications.

## Files

- `auth.middleware.ts` - Main JWT authentication middleware
- `auth.example.ts` - Example usage of the middleware
- `README.md` - This documentation file

## Features

The JWT authentication middleware provides:

1. **Token Extraction**: Extracts JWT token from Authorization header (Bearer token format)
2. **Token Verification**: Verifies token signature using `jwt.verify`
3. **Blacklist Checking**: Checks if token is not in blacklist (Redis)
4. **User Attachment**: Attaches user object to `req.user = { id, email, role }`
5. **Error Handling**: Proper error responses for different authentication failures

## Installation

Make sure you have the required dependencies installed:

```bash
npm install express jsonwebtoken redis
npm install -D @types/express @types/jsonwebtoken
```

## Usage

### Basic Usage

```typescript
import express from 'express';
import { authenticateJWT, connectAuthRedis } from '@shared/redis-client';

const app = express();

// Initialize Redis connection for auth middleware
connectAuthRedis().catch(console.error);

// Protected route
app.get('/users/me', authenticateJWT, (req, res) => {
  // User is authenticated and req.user is available
  res.json({
    message: 'User profile',
    user: req.user, // { id, email, role }
  });
});
```

### Role-Based Access Control

```typescript
import { requireRole } from '@shared/redis-client';

// Admin-only route
app.get('/admin/dashboard', authenticateJWT, requireRole('admin'), (req, res) => {
  // User is authenticated and has admin role
  res.json({
    message: 'Admin dashboard',
    user: req.user,
  });
});
```

## JWT Payload Interface

The middleware expects JWT tokens with the following payload structure:

```typescript
interface JWTPayload {
  sub: string; // User ID
  email: string; // User email
  role: string; // User role
  iat: number; // Issued at
  exp: number; // Expiration time
  jti: string; // JWT ID (for blacklist)
}
```

## Error Handling

The middleware returns appropriate HTTP status codes and error messages:

- **401** - No token provided or invalid format
- **401** - Token expired
- **401** - Invalid token
- **401** - Token revoked (in blacklist)
- **403** - Insufficient permissions (when using `requireRole`)
- **500** - Internal server error

## Environment Variables

The middleware uses the following environment variables:

- `JWT_SECRET` - Secret key for JWT verification (default: 'your-super-secret-key-change-in-production')
- `REDIS_URL` - Redis connection URL (default: 'redis://localhost:6379')

## Redis Blacklist

The middleware uses Redis to maintain a blacklist of revoked tokens. Blacklist keys are stored with the format:

```
blacklist:{jti}
```

Where `{jti}` is the JWT ID from the token payload.

## Initialization

Make sure to initialize the Redis connection when your application starts:

```typescript
import { connectAuthRedis, disconnectAuthRedis } from '@shared/redis-client';

// On application startup
connectAuthRedis().catch(console.error);

// On application shutdown
process.on('SIGTERM', async () => {
  await disconnectAuthRedis();
  process.exit(0);
});
```

## Example Request

```bash
# Protected route request
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/users/me
```

## Response Examples

### Successful Authentication

```json
{
  "message": "User profile",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Authentication Errors

```json
{
  "error": "Token expired",
  "message": "Your token has expired. Please login again."
}
```

```json
{
  "error": "Token revoked",
  "message": "The provided token has been revoked."
}
```
