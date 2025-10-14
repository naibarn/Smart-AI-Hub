# API Gateway Service

## Overview

The API Gateway serves as the central entry point for all API requests to the Smart AI Hub platform. It handles request routing, authentication verification, rate limiting, and other cross-cutting concerns.

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.x
- **Port**: 3000
- **Language**: TypeScript 5.x

## Components

- **Express.js HTTP Server**: Core web server handling incoming requests
- **http-proxy-middleware**: Service routing and proxying to backend services
- **Rate Limiter**: Redis-backed rate limiting implementation
- **JWT Validation Middleware**: Authentication token verification
- **CORS Handler**: Cross-origin resource sharing management
- **Request Logger**: Winston-based request/response logging
- **Health Check Endpoint**: Service health monitoring

## Responsibilities

1. **Request Routing**: Direct incoming requests to appropriate backend services
2. **Authentication Verification**: Validate JWT tokens on protected routes
3. **Rate Limiting**: Enforce request rate limits based on user roles
4. **CORS Handling**: Manage cross-origin requests
5. **Request/Response Logging**: Log all API requests for monitoring and debugging
6. **Load Balancing**: Distribute load across service instances
7. **Health Checks**: Monitor service health and availability

## Routing Rules

```
/api/auth/*     → auth-service:3001
/api/users/*    → core-service:3002
/api/credits/*  → core-service:3002
/api/mcp/*      → mcp-server:3003
/api/ws/*       → mcp-server:3003 (WebSocket upgrade)
```

## Rate Limiting Configuration

The API Gateway implements role-based rate limiting:

```typescript
const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: async (req) => {
    const user = req.user;
    if (!user) return 10; // Guest

    switch (user.role) {
      case 'admin':
        return Number.POSITIVE_INFINITY;
      case 'manager':
        return 120;
      case 'user':
        return 60;
      default:
        return 10;
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
});
```

## Proxy Configuration

```typescript
const proxyConfig = {
  '/api/auth': {
    target: 'http://auth-service:3001',
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' },
  },
  '/api/users': {
    target: 'http://core-service:3002',
    changeOrigin: true,
  },
  '/api/mcp': {
    target: 'http://mcp-server:3003',
    changeOrigin: true,
    ws: true, // WebSocket support
  },
};
```

## Security Features

- JWT token validation for all protected routes
- Token blacklist checking via Redis
- Request size limits
- IP-based blocking for abusive clients
- Security headers implementation

## Monitoring

- Request/response logging with unique request IDs
- Performance metrics collection
- Error tracking and reporting
- Health check endpoints for monitoring systems