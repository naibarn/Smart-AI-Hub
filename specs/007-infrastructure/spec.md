---
title: "Infrastructure Services"
author: "Development Team"
version: "1.0.0"
status: "active"
priority: "high"
created_at: "2025-01-15"
updated_at: "2025-01-15"
type: "specification"
description: "Comprehensive specification for infrastructure services including API Gateway and Core Service"
spec_id: "EPIC-003"
---

# Infrastructure Services

## Overview

This specification defines the infrastructure services that form the backbone of the Smart AI Hub platform. It encompasses the API Gateway, which serves as the central entry point for all API requests, and the Core Service, which handles primary business logic including user management, access control, and financial operations.

## Technology Stack

### API Gateway
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.x
- **Port**: 3000
- **Language**: TypeScript 5.x

### Core Service
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.x
- **Port**: 3002
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+

## Components

### API Gateway Components
- **Express.js HTTP Server**: Core web server handling incoming requests
- **http-proxy-middleware**: Service routing and proxying to backend services
- **Rate Limiter**: Redis-backed rate limiting implementation
- **JWT Validation Middleware**: Authentication token verification
- **CORS Handler**: Cross-origin resource sharing management
- **Request Logger**: Winston-based request/response logging
- **Health Check Endpoint**: Service health monitoring

### Core Service Components
- **User Management Service**: CRUD operations for user accounts
- **Role & Permission Service**: RBAC implementation
- **Credit Management Service**: Track and manage user credits
- **Transaction Processing Service**: Handle credit transactions
- **Usage Analytics Service**: Track and analyze service usage
- **Promotional Code Service**: Manage promo codes and redemptions
- **Sora2 Integration Service**: Session-based authentication for video generation

## API Gateway Responsibilities

1. **Request Routing**: Direct incoming requests to appropriate backend services
2. **Authentication Verification**: Validate JWT tokens on protected routes
3. **Rate Limiting**: Enforce request rate limits based on user roles
4. **CORS Handling**: Manage cross-origin requests
5. **Request/Response Logging**: Log all API requests for monitoring and debugging
6. **Load Balancing**: Distribute load across service instances
7. **Health Checks**: Monitor service health and availability

## Core Service Responsibilities

1. **User Management**: CRUD operations for user accounts
2. **Role & Permission Management**: RBAC implementation
3. **Credit Account Management**: Track and manage user credits
4. **Transaction Processing**: Handle credit transactions
5. **Usage Analytics**: Track and analyze service usage
6. **Promotional Code System**: Manage promo codes and redemptions
7. **Sora2 Video Generator Integration**: Session-based authentication for video generation

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
    message: 'Too many requests, try again later',
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

## Database Schema

### User Model
```typescript
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String?
  verified      Boolean  @default(false)
  googleId      String?  @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  roles         UserRole[]
  creditAccount CreditAccount?
  usageLogs     UsageLog[]

  @@index([email])
  @@map("users")
}
```

### Credit Account Model
```typescript
model CreditAccount {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions CreditTransaction[]

  @@index([userId])
  @@map("credit_accounts")
}
```

### Credit Transaction Model
```typescript
model CreditTransaction {
  id          String   @id @default(uuid())
  accountId   String
  amount      Int
  type        String   // debit, credit
  reason      String   // purchase, usage, refund, promo
  metadata    Json?
  createdAt   DateTime @default(now())

  account CreditAccount @relation(fields: [accountId], references: [id])

  @@index([accountId, createdAt])
  @@map("credit_transactions")
}
```

## Business Logic

### Credit Deduction with Atomic Transactions
The service ensures atomic credit deduction operations:

```typescript
async function deductCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: any
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Lock the credit account
    const account = await tx.creditAccount.findUnique({
      where: { userId },
      select: { id: true, balance: true },
    });

    if (!account) {
      throw new AppError('ACCOUNT_NOT_FOUND', 'Credit account not found');
    }

    if (account.balance < amount) {
      throw new AppError('INSUFFICIENT_CREDITS', 'Not enough credits');
    }

    // 2. Update balance
    await tx.creditAccount.update({
      where: { id: account.id },
      data: { balance: { decrement: amount } },
    });

    // 3. Create transaction record
    await tx.creditTransaction.create({
      data: {
        accountId: account.id,
        amount: -amount,
        type: 'debit',
        reason,
        metadata,
      },
    });
  });
}
```

### Usage Calculation & Billing
- Track token usage for each LLM provider
- Calculate credit costs based on usage
- Generate billing reports
- Handle usage limits and quotas

### Role Hierarchy Enforcement
- Implement role-based access control
- Enforce role hierarchy (admin > manager > user > guest)
- Cache permissions for performance
- Support dynamic permission assignments

## Security Features

- JWT token validation for all protected routes
- Token blacklist checking via Redis
- Request size limits
- IP-based blocking for abusive clients
- Security headers implementation
- RBAC middleware for endpoint protection
- Audit logging for all data changes
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- Rate limiting on sensitive operations

## Performance Optimizations

- Database connection pooling
- Redis caching for frequently accessed data
- Database query optimization
- Pagination for large result sets
- Background job processing for heavy operations

## Integration Points

- **Authentication Service**: User verification and role lookup
- **MCP Server**: Credit deduction for usage
- **Payment System**: Credit purchases and refunds
- **Notification Service**: Low balance alerts
- **Analytics Service**: Usage metrics and reporting

## Monitoring

- Request/response logging with unique request IDs
- Performance metrics collection
- Error tracking and reporting
- Health check endpoints for monitoring systems
- Health check endpoints shall be implemented
- Performance metrics must be collected and monitored
- Error logging shall be comprehensive and searchable
- Alert thresholds must be configured for critical issues

## Deployment Requirements

- Service shall be containerized for consistent deployment
- Configuration must be externalized and environment-specific
- Rolling updates shall be supported for zero-downtime deployment
- Backup and recovery procedures must be documented and tested

## Acceptance Criteria

- All requirements shall be implemented according to specifications
- System shall pass all automated and manual tests
- Performance shall meet defined benchmarks
- Security requirements shall be fully implemented
- Documentation shall be complete and accurate
- User acceptance shall be obtained from all stakeholders

## Implementation Approach

- Development shall follow agile methodology with iterative sprints
- Code shall be reviewed through peer review processes
- Continuous integration and deployment shall be implemented
- Testing shall occur at multiple levels (unit, integration, system)
- Quality gates shall be established at each development stage