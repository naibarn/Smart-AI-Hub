---
title: "architecture"
author: "Development Team"
version: "1.0.0"
---
# Smart AI Hub Architecture

## Document Information

**Version**: 2.1
**Last Updated**: 2025-10-13
**Status**: Active Development
**Maintainers**: Architecture Team

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Monorepo Structure](#monorepo-structure)
4. [Services Details](#services-details)
5. [Data Architecture](#data-architecture)
6. [Session Storage (Redis)](#session-storage-redis)
7. [Security Architecture](#security-architecture)
8. [Error Handling & Resilience](#error-handling--resilience)
9. [Observability](#observability)
10. [Deployment Architecture](#deployment-architecture)
11. [Diagrams](#diagrams)

---

## Overview

Smart AI Hub is a cloud-native, microservices-based platform built with Node.js, TypeScript, React, and Docker. The architecture follows industry best practices for scalability, security, and maintainability.

### Design Principles

- **Microservices**: Independent, deployable services
- **API-First**: Well-defined contracts between services
- **Security by Default**: Zero-trust architecture
- **Observability**: Comprehensive logging, metrics, and tracing
- **Resilience**: Fault tolerance and graceful degradation

### Technology Stack Summary

```yaml
Backend:
  Runtime: Node.js 20 LTS
  Language: TypeScript 5.x
  Framework: Express.js 4.x
  Database: PostgreSQL 15+
  Cache: Redis 7+
  Queue: BullMQ

Frontend:
  Framework: React 18
  Build Tool: Vite 5.x
  UI Library: Material-UI v5
  State: Redux Toolkit

Infrastructure:
  Containers: Docker 24+
  Proxy: Nginx 1.24+
  Monitoring: Prometheus + Grafana
  Logging: Winston + Elasticsearch
```

---

## System Architecture

### High-Level Architecture (C4 Model - Level 1)

```
┌─────────────────────────────────────────────────────────────┐
│                        External Systems                      │
├─────────────────────────────────────────────────────────────┤
│  Google OAuth  │  OpenAI API  │  Stripe  │  SendGrid       │
└────────┬────────────────┬──────────┬──────────────┬─────────┘
         │                │          │              │
         │                │          │              │
┌────────▼────────────────▼──────────▼──────────────▼─────────┐
│                      Smart AI Hub Platform                   │
│  ┌────────────┐  ┌──────────┐  ┌─────────┐  ┌───────────┐ │
│  │   Web UI   │  │  Mobile  │  │   API   │  │  Webhooks │ │
│  │  (React)   │  │  (Future)│  │  Client │  │           │ │
│  └──────┬─────┘  └─────┬────┘  └────┬────┘  └─────┬─────┘ │
│         │              │            │             │        │
│  ┌──────▼──────────────▼────────────▼─────────────▼──────┐ │
│  │              Nginx Reverse Proxy + SSL                 │ │
│  └──────┬──────────────────────────────────────────┬──────┘ │
│         │                                           │        │
│  ┌──────▼───────────────────────────────────────────▼─────┐ │
│  │                  API Gateway (Port 3000)               │ │
│  │  - Request Routing    - Rate Limiting                 │ │
│  │  - Authentication     - CORS                          │ │
│  │  - Load Balancing     - Request Logging               │ │
│  └──┬────────┬────────┬────────┬────────────────────────┘ │
│     │        │        │        │                          │
│  ┌──▼──┐  ┌─▼───┐  ┌─▼───┐  ┌─▼───┐                      │
│  │Auth │  │Core │  │ MCP │  │Queue│                      │
│  │3001 │  │3002 │  │3003 │  │     │                      │
│  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘                      │
│     │        │        │        │                          │
│  ┌──▼────────▼────────▼────────▼──────┐                   │
│  │     Shared Data Layer               │                   │
│  │  ┌──────────┐      ┌──────────┐   │                   │
│  │  │PostgreSQL│      │  Redis   │   │                   │
│  │  │  (Main)  │      │ (Cache)  │   │                   │
│  │  └──────────┘      └──────────┘   │                   │
│  │                      ┌──────────┐ │                   │
│  │                      │Session   │ │                   │
│  │                      │Storage   │ │                   │
│  │                      └──────────┘ │                   │
│  └──────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Container Architecture (C4 Model - Level 2)

```
┌───────────────────────────────────────────────────────────────┐
│                      API Gateway Service                       │
├───────────────────────────────────────────────────────────────┤
│  Components:                                                   │
│  • Express.js HTTP Server                                     │
│  • http-proxy-middleware (Service Routing)                    │
│  • Rate Limiter (Redis-backed)                                │
│  • JWT Validation Middleware                                  │
│  • CORS Handler                                               │
│  • Request Logger (Winston)                                   │
│  • Health Check Endpoint                                      │
│                                                               │
│  Routing Rules:                                               │
│  /api/auth/*     → auth-service:3001                         │
│  /api/users/*    → core-service:3002                         │
│  /api/credits/*  → core-service:3002                         │
│  /api/mcp/*      → mcp-server:3003                           │
│  /api/ws/*       → mcp-server:3003 (WebSocket upgrade)       │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                   Authentication Service                       │
├───────────────────────────────────────────────────────────────┤
│  Responsibilities:                                            │
│  • User registration & login                                  │
│  • JWT token generation & validation                          │
│  • OAuth 2.0 integration (Google)                            │
│  • Password hashing (bcrypt)                                  │
│  • Email verification                                         │
│  • Password reset                                             │
│                                                               │
│  Database Tables:                                             │
│  • users (id, email, password_hash, verified)                │
│  • refresh_tokens (token, user_id, expires_at)               │
│  • verification_tokens (token, user_id, type, expires_at)    │
│                                                               │
│  External Dependencies:                                       │
│  • PostgreSQL (user data)                                    │
│  • Redis (token blacklist, rate limiting, sessions)          │
│  • SendGrid (email service)                                  │
│  • Google OAuth 2.0                                          │
│  • Sora2 Video API                                           │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                      Core Service                              │
├───────────────────────────────────────────────────────────────┤
│  Responsibilities:                                            │
│  • User management (CRUD)                                     │
│  • Role & permission management                               │
│  • Credit account management                                  │
│  • Transaction processing                                     │
│  • Usage analytics                                            │
│  • Promotional code system                                    │
│                                                               │
│  Database Tables:                                             │
│  • roles, permissions, user_roles                            │
│  • credit_accounts, credit_transactions                      │
│  • promo_codes, promo_redemptions                            │
│  • usage_logs                                                 │
│                                                               │
│  Business Logic:                                              │
│  • Credit deduction with atomic transactions                 │
│  • Usage calculation & billing                                │
│  • Role hierarchy enforcement                                 │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                        MCP Server                              │
├───────────────────────────────────────────────────────────────┤
│  Responsibilities:                                            │
│  • LLM provider integration (OpenAI, Claude)                 │
│  • WebSocket real-time communication                         │
│  • Request/response transformation                           │
│  • Token usage tracking                                       │
│  • Provider fallback logic                                    │
│                                                               │
│  Components:                                                  │
│  • WebSocket Server (ws library)                             │
│  • OpenAI Client Wrapper                                     │
│  • Anthropic Client Wrapper                                  │
│  • Request Queue (BullMQ)                                    │
│  • Circuit Breaker (opossum)                                 │
│                                                               │
│  Workflow:                                                    │
│  1. Validate JWT & check credits                             │
│  2. Route to appropriate LLM provider                        │
│  3. Transform request to provider format                     │
│  4. Send request with retry logic                            │
│  5. Stream response via WebSocket                            │
│  6. Log usage & deduct credits                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
smart-ai-hub/
├── packages/
│   ├── shared/                    # Shared utilities & types
│   │   ├── src/
│   │   │   ├── types/            # TypeScript interfaces
│   │   │   │   ├── user.ts
│   │   │   │   ├── credit.ts
│   │   │   │   └── api.ts
│   │   │   ├── utils/            # Utility functions
│   │   │   │   ├── logger.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── errors.ts
│   │   │   ├── constants/        # Shared constants
│   │   │   │   ├── roles.ts
│   │   │   │   └── error-codes.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api-gateway/               # API Gateway (Port 3000)
│   │   ├── src/
│   │   │   ├── config/           # Configuration
│   │   │   │   ├── index.ts
│   │   │   │   └── routes.ts
│   │   │   ├── middlewares/      # Middlewares
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rateLimit.ts
│   │   │   │   ├── cors.ts
│   │   │   │   └── errorHandler.ts
│   │   │   ├── proxy/            # Proxy configuration
│   │   │   │   └── index.ts
│   │   │   ├── server.ts         # Express server
│   │   │   └── index.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── auth-service/              # Authentication (Port 3001)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── passport.ts   # Passport strategies
│   │   │   │   └── jwt.ts        # JWT configuration
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── oauth.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── token.service.ts
│   │   │   │   └── email.service.ts
│   │   │   ├── routes/
│   │   │   │   └── auth.routes.ts
│   │   │   ├── middlewares/
│   │   │   │   └── jwt.middleware.ts
│   │   │   ├── validators/
│   │   │   │   └── auth.validator.ts
│   │   │   ├── server.ts
│   │   │   └── index.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── core-service/              # Core Business Logic (Port 3002)
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Database schema
│   │   │   └── migrations/       # DB migrations
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── credit.controller.ts
│   │   │   │   └── admin.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── credit.service.ts
│   │   │   │   ├── role.service.ts
│   │   │   │   └── promo.service.ts
│   │   │   ├── repositories/
│   │   │   │   ├── user.repository.ts
│   │   │   │   └── credit.repository.ts
│   │   │   ├── routes/
│   │   │   │   ├── user.routes.ts
│   │   │   │   └── credit.routes.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── rbac.middleware.ts
│   │   │   │   └── audit.middleware.ts
│   │   │   ├── validators/
│   │   │   │   └── schemas.ts
│   │   │   ├── database/
│   │   │   │   └── client.ts     # Prisma client
│   │   │   ├── server.ts
│   │   │   └── index.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── mcp-server/                # MCP Server (Port 3003)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── providers.ts  # LLM provider configs
│   │   │   ├── providers/
│   │   │   │   ├── openai.provider.ts
│   │   │   │   ├── claude.provider.ts
│   │   │   │   └── base.provider.ts
│   │   │   ├── services/
│   │   │   │   ├── llm.service.ts
│   │   │   │   ├── queue.service.ts
│   │   │   │   └── usage.service.ts
│   │   │   ├── websocket/
│   │   │   │   ├── server.ts
│   │   │   │   └── handlers.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.ws.ts
│   │   │   │   └── credit.check.ts
│   │   │   ├── utils/
│   │   │   │   ├── retry.ts
│   │   │   │   └── circuitBreaker.ts
│   │   │   ├── server.ts
│   │   │   └── index.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/                  # React Frontend (Port 3004)
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   │   ├── common/       # Reusable components
│       │   │   ├── auth/         # Auth-related components
│       │   │   ├── dashboard/    # Dashboard components
│       │   │   └── admin/        # Admin components
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── Register.tsx
│       │   │   ├── Dashboard.tsx
│       │   │   └── Admin.tsx
│       │   ├── store/            # Redux store
│       │   │   ├── slices/
│       │   │   │   ├── auth.slice.ts
│       │   │   │   ├── user.slice.ts
│       │   │   │   └── credit.slice.ts
│       │   │   └── store.ts
│       │   ├── services/         # API services
│       │   │   └── api.ts        # RTK Query API
│       │   ├── hooks/            # Custom hooks
│       │   ├── utils/
│       │   ├── types/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── Dockerfile
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                          # Documentation
│   ├── architecture/
│   │   ├── diagrams/
│   │   └── decisions/            # ADRs
│   ├── api/
│   │   └── openapi.yaml
│   └── deployment/
│
├── scripts/                       # Utility scripts
│   ├── setup.sh
│   ├── deploy.sh
│   └── backup.sh
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docker-compose.yml             # Base compose file
├── docker-compose.dev.yml         # Development
├── docker-compose.prod.yml        # Production
├── .env.example
├── package.json                   # Root package.json (workspaces)
├── tsconfig.base.json             # Base TypeScript config
├── tsconfig.json                  # Composite TS config
└── README.md
```

---

## Services Details

### API Gateway

**Technology**: Express.js + TypeScript  
**Port**: 3000  
**Responsibilities**:

- Central entry point for all API requests
- Service routing and load balancing
- Authentication verification (JWT)
- Rate limiting (Redis-backed)
- CORS handling
- Request/response logging
- Health checks

**Key Features**:

```typescript
// Rate Limiting Configuration
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

// Proxy Configuration
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

### Authentication Service

**Technology**: Express.js + Passport.js + JWT  
**Port**: 3001  
**Database**: PostgreSQL (users, tokens)

**Endpoints**:

```typescript
POST /register; // User registration
POST /login; // User login
POST /logout; // User logout (blacklist token)
POST /refresh; // Refresh access token
POST /verify-email; // Email verification
POST /forgot-password; // Request password reset
POST /reset-password; // Reset password
GET /me; // Current user info
GET /oauth/google; // Google OAuth initiate
GET /oauth/google/callback; // Google OAuth callback
GET /oauth/sora2; // Sora2 OAuth initiate
GET /oauth/sora2/callback; // Sora2 OAuth callback
POST /oauth/session/verify; // Verify session code
POST /oauth/session/confirm; // Confirm session with parameters
```

**JWT Configuration**:

```typescript
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
    algorithm: 'HS256',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256',
  },
};

// Token Payload Structure
interface JWTPayload {
  sub: string; // User ID
  email: string;
  roles: string[]; // Array of role IDs
  permissions: string[]; // Cached permissions array
  iat: number; // Issued at
  exp: number; // Expiration
  jti: string; // JWT ID (for revocation)
}
```

**Password Policy**:

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character
- Bcrypt cost factor: 12

### Core Service

**Technology**: Express.js + Prisma + PostgreSQL  
**Port**: 3002  
**Responsibilities**:

- User CRUD operations
- Role & permission management
- Credit account management
- Transaction processing
- Usage analytics
- Promotional codes
- Sora2 Video Generator integration
- Session-based authentication for video generation

**Database Schema** (Prisma):

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

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

model Role {
  id          String   @id @default(uuid())
  name        String   @unique // admin, manager, user, guest
  description String?
  isSystem    Boolean  @default(false) // System roles cannot be deleted

  users       UserRole[]
  permissions RolePermission[]

  @@map("roles")
}

model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  resource    String   // users, credits, services
  action      String   // create, read, update, delete

  roles       RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}

model UserRole {
  userId    String
  roleId    String
  assignedAt DateTime @default(now())

  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}

model RolePermission {
  roleId       String
  permissionId String

  role       Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}

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

model PromoCode {
  id          String   @id @default(uuid())
  code        String   @unique
  credits     Int
  maxUses     Int?
  usedCount   Int      @default(0)
  expiresAt   DateTime?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  redemptions PromoRedemption[]

  @@index([code])
  @@map("promo_codes")
}

model PromoRedemption {
  id        String   @id @default(uuid())
  userId    String
  codeId    String
  credits   Int
  redeemedAt DateTime @default(now())

  code PromoCode @relation(fields: [codeId], references: [id])

  @@unique([userId, codeId])
  @@index([userId])
  @@map("promo_redemptions")
}

model UsageLog {
  id         String   @id @default(uuid())
  userId     String
  service    String   // openai, claude
  model      String   // gpt-4, claude-3
  tokens     Int
  credits    Int
  metadata   Json?
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([service, createdAt])
  @@map("usage_logs")
}
```

**Credit Management APIs**:

```typescript
// Check credit balance
GET /api/credits/balance
Response: {
  "userId": "uuid",
  "balance": 1000,
  "currency": "credits",
  "lastUpdated": "2025-01-01T00:00:00Z"
}

// Deduct credits for video generation
POST /api/credits/deduct
Request: {
  "userId": "uuid",
  "amount": 100,
  "reason": "sora2_video_generation",
  "metadata": {
    "videoId": "uuid",
    "duration": 30,
    "resolution": "1080p"
  }
}
Response: {
  "success": true,
  "newBalance": 900,
  "transactionId": "uuid"
}

// Get credit transaction history
GET /api/credits/transactions?userId=uuid&limit=10&offset=0
Response: {
  "transactions": [
    {
      "id": "uuid",
      "amount": -100,
      "type": "debit",
      "reason": "sora2_video_generation",
      "createdAt": "2025-01-01T00:00:00Z",
      "metadata": {
        "videoId": "uuid",
        "duration": 30
      }
    }
  ],
  "total": 25,
  "hasMore": true
}
```

**Credit Deduction Flow**:

```typescript
// Atomic transaction for credit deduction
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

### MCP Server

**Technology**: Express.js + WebSocket (ws) + BullMQ
**Port**: 3003
**Responsibilities**:

- LLM provider integration
- Real-time communication
- Request routing to providers
- Response streaming
- Usage tracking
- Provider fallback
- Sora2 Video Generator API integration
- Custom GPT integration for video generation workflows

**WebSocket Protocol**:

```typescript
// Client → Server
interface MCPRequest {
  id: string;
  type: 'completion' | 'chat' | 'embedding';
  provider: 'openai' | 'claude' | 'auto';
  model: string;
  messages?: Message[];
  prompt?: string;
  stream: boolean;
  maxTokens?: number;
}

// Server → Client (Streaming)
interface MCPStreamChunk {
  id: string;
  type: 'chunk' | 'done' | 'error';
  data?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Server → Client (Non-streaming)
interface MCPResponse {
  id: string;
  type: 'completion';
  data: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    credits: number;
  };
  metadata: {
    model: string;
    provider: string;
    latency: number;
  };
}
```

**Provider Fallback Logic**:

```typescript
const providerPriority = ['openai', 'claude'];

async function executeWithFallback(request: MCPRequest): Promise<MCPResponse> {
  let lastError: Error;

  for (const provider of providerPriority) {
    try {
      const result = await providers[provider].execute(request);
      return result;
    } catch (error) {
      lastError = error;
      logger.warn(`Provider ${provider} failed, trying next`, { error });

      // If rate limited, add delay
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        await sleep(5000);
      }
    }
  }

  throw new AppError('ALL_PROVIDERS_FAILED', 'All LLM providers failed', { lastError });
}
```

**Sora2 Video Generator Integration**:

```typescript
// Sora2 API integration
interface Sora2VideoRequest {
  prompt: string;
  duration: number; // seconds
  resolution: '720p' | '1080p' | '4K';
  style?: string;
  aspectRatio?: string;
  userId: string;
  sessionId: string;
}

interface Sora2VideoResponse {
  videoId: string;
  status: 'processing' | 'completed' | 'failed';
  url?: string;
  thumbnailUrl?: string;
  duration: number;
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
}

// MCP Server Sora2 endpoints
app.post('/api/mcp/sora2/generate', authenticate, checkCredits, async (req, res) => {
  const { prompt, duration, resolution, style, aspectRatio } = req.body;
  const userId = req.user.id;
  const sessionId = req.session.id;
  
  // Check credits before generation
  const creditsRequired = calculateCreditsRequired(duration, resolution);
  const hasCredits = await creditService.checkBalance(userId, creditsRequired);
  
  if (!hasCredits) {
    return res.status(402).json({ error: 'Insufficient credits' });
  }
  
  // Create video generation request
  const videoRequest = await sora2Service.createVideoRequest({
    prompt,
    duration,
    resolution,
    style,
    aspectRatio,
    userId,
    sessionId
  });
  
  // Deduct credits (atomic transaction)
  await creditService.deductCredits(userId, creditsRequired, 'sora2_video_generation', {
    videoId: videoRequest.id,
    duration,
    resolution
  });
  
  res.json({
    videoId: videoRequest.id,
    status: 'processing',
    creditsUsed: creditsRequired,
    estimatedTime: estimateProcessingTime(duration, resolution)
  });
});

app.get('/api/mcp/sora2/status/:videoId', authenticate, async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.id;
  
  // Check if user owns this video
  const video = await sora2Service.getVideo(videoId);
  if (video.userId !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json({
    videoId: video.id,
    status: video.status,
    url: video.url,
    thumbnailUrl: video.thumbnailUrl,
    progress: video.progress,
    createdAt: video.createdAt
  });
});
```

**Custom GPT Integration for Video Workflows**:

```typescript
// Custom GPT integration for enhanced video generation
interface VideoWorkflowRequest {
  workflow: 'text-to-video' | 'image-to-video' | 'video-enhancement';
  input: {
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
  };
  parameters: {
    style?: string;
    duration?: number;
    resolution?: string;
    enhancementType?: string;
  };
  sessionId: string;
}

// Custom GPT-assisted video generation
app.post('/api/mcp/gpt/video-workflow', authenticate, async (req, res) => {
  const { workflow, input, parameters, sessionId } = req.body;
  
  // Step 1: Use Custom GPT to analyze and enhance the request
  const enhancedPrompt = await gptService.enhanceVideoPrompt({
    originalPrompt: input.text,
    workflow,
    parameters,
    sessionId
  });
  
  // Step 2: Generate video with Sora2 using enhanced prompt
  const videoRequest = await sora2Service.createVideoRequest({
    prompt: enhancedPrompt,
    duration: parameters.duration || 30,
    resolution: parameters.resolution || '1080p',
    style: parameters.style,
    userId: req.user.id,
    sessionId
  });
  
  res.json({
    workflowId: generateId(),
    videoId: videoRequest.id,
    enhancedPrompt,
    status: 'processing'
  });
});
```

**Circuit Breaker Pattern**:

```typescript
import CircuitBreaker from 'opossum';

const options = {
  timeout: 30000, // 30 seconds
  errorThresholdPercentage: 50,
  resetTimeout: 30000, // Try again after 30s
};

const breaker = new CircuitBreaker(callOpenAI, options);

breaker.on('open', () => {
  logger.error('Circuit breaker opened for OpenAI');
  // Switch to Claude
});

breaker.on('halfOpen', () => {
  logger.info('Circuit breaker half-open, testing OpenAI');
});
```

### Frontend

**Technology**: React 18 + Vite + Material-UI  
**Port**: 3004 (development), 80 (production via Nginx)

**Key Libraries**:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "@mui/material": "^5.14.0",
    "@reduxjs/toolkit": "^1.9.0",
    "react-router-dom": "^6.16.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.0",
    "@tanstack/react-query": "^4.35.0"
  }
}
```

**State Management**:

```typescript
// store/slices/auth.slice.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
  },
});
```

**API Service** (RTK Query):

```typescript
// services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Credits', 'Usage'],
  endpoints: (builder) => ({
    getUser: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    getCredits: builder.query<CreditBalance, void>({
      query: () => '/credits/balance',
      providesTags: ['Credits'],
    }),
    // ... more endpoints
  }),
});
```

---

## Data Architecture

### Database Design Principles

- **Normalized Schema**: 3NF for transactional data
- **Immutable Logs**: Append-only for audit trails
- **Soft Deletes**: Retain data for compliance
- **Indexing Strategy**: Compound indexes for common queries
- **Partitioning**: Time-based partitioning for large tables

### Connection Pooling

```typescript
// database/client.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
  connectionLimit: {
    max: 100,
    min: 10,
    idleTimeout: 30000,
  },
});

// Connection pool events
prisma.$on('query', (e) => {
  logger.debug('Query', {
    query: e.query,
    duration: e.duration,
    params: e.params,
  });
});

export default prisma;
```

### Caching Strategy

```typescript
// Redis caching layers
const CACHE_TTL = {
  USER: 300, // 5 minutes
  CREDITS: 60, // 1 minute
  PERMISSIONS: 3600, // 1 hour
  RATE_LIMIT: 60, // 1 minute
};

// Cache-aside pattern
async function getUser(userId: string): Promise<User> {
  const cacheKey = `user:${userId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss - fetch from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Update cache
  await redis.setex(cacheKey, CACHE_TTL.USER, JSON.stringify(user));

  return user;
}
```

### Database Migrations

```bash
# Development
npx prisma migrate dev --name add_promo_codes

# Production
npx prisma migrate deploy

# Rollback (manual)
npx prisma migrate reset --force
```

---

## Session Storage (Redis)

### Session Management for Sora2 Integration

```typescript
// Session storage structure in Redis
interface SessionData {
  sessionId: string;
  userId: string;
  oauthProvider: 'google' | 'sora2';
  oauthState: string;
  verificationCode: string;
  verifiedAt?: Date;
  expiresAt: Date;
  metadata: {
    userAgent: string;
    ipAddress: string;
    originalRequest: string;
  };
}

// Session service implementation
class SessionService {
  private redis: Redis;
  private readonly SESSION_TTL = 3600; // 1 hour

  async createSession(data: Omit<SessionData, 'sessionId' | 'expiresAt'>): Promise<string> {
    const sessionId = generateUUID();
    const sessionData: SessionData = {
      ...data,
      sessionId,
      expiresAt: new Date(Date.now() + this.SESSION_TTL * 1000)
    };

    await this.redis.setex(
      `session:${sessionId}`,
      this.SESSION_TTL,
      JSON.stringify(sessionData)
    );

    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    if (!data) return null;

    const session = JSON.parse(data) as SessionData;
    
    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      await this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  async verifySession(sessionId: string, verificationCode: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    if (session.verificationCode !== verificationCode) {
      return false;
    }

    // Mark session as verified
    session.verifiedAt = new Date();
    await this.redis.setex(
      `session:${sessionId}`,
      this.SESSION_TTL,
      JSON.stringify(session)
    );

    return true;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
}
```

### OAuth Flow with Verification Codes

```mermaid
sequenceDiagram
    participant C as Client
    participant AG as API Gateway
    participant AS as Auth Service
    participant S as Session Storage (Redis)
    participant OAuth as OAuth Provider (Google/Sora2)
    participant V as Verification Service

    C->>AG: Initiate OAuth
    AG->>AS: POST /oauth/google or /oauth/sora2
    AS->>S: Create session with verification code
    S-->>AS: sessionId
    AS->>V: Send verification code via email
    AS-->>AG: Return sessionId
    AG-->>C: 200 OK + sessionId

    C->>V: User enters verification code
    V->>C: Verify code

    C->>AG: POST /oauth/session/verify
    AG->>AS: { sessionId, verificationCode }
    AS->>S: Get session data
    S-->>AS: Session info
    AS->>AS: Verify code matches
    AS->>S: Mark session as verified
    AS-->>AG: Session verified
    AG-->>C: 200 OK + verification status

    C->>AG: POST /oauth/session/confirm
    AG->>AS: { sessionId, parameters }
    AS->>S: Get verified session
    S-->>AS: Session with OAuth state
    AS->>OAuth: Exchange code for tokens
    OAuth-->>AS: OAuth tokens
    AS->>AS: Create/update user account
    AS->>S: Delete session
    AS-->>AG: JWT tokens + user info
    AG-->>C: 200 OK + authentication complete
```

---

## Security Architecture

### Authentication Flow

```
┌─────────┐                                 ┌─────────────┐
│ Client  │                                 │ Auth Service│
└────┬────┘                                 └──────┬──────┘
     │                                             │
     │  1. POST /login                             │
     │  { email, password }                        │
     ├────────────────────────────────────────────>│
     │                                             │
     │                                             │ 2. Verify
     │                                             │    password
     │                                             │
     │  3. JWT tokens                              │
     │  { accessToken, refreshToken }              │
     │<────────────────────────────────────────────┤
     │                                             │
     │  4. Store tokens                            │
     ├─────────┐                                   │
     │         │                                   │
     │<────────┘                                   │
     │                                             │
     │  5. API request + Bearer token              │
     ├────────────────────────────────────────────>│
     │                                             │
     │                                             │ 6. Validate
     │                                             │    JWT
     │                                             │
     │  7. Protected resource                      │
     │<────────────────────────────────────────────┤
     │                                             │
```

### Authorization (RBAC)

The Smart AI Hub implements a comprehensive Role-Based Access Control (RBAC) system with many-to-many relationships between users, roles, and permissions.

```typescript
// middlewares/rbac.middleware.ts
function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Check cache first
    const cacheKey = `perms:${userId}:${resource}:${action}`;
    const cached = await redis.get(cacheKey);

    if (cached === 'true') {
      return next();
    }

    // Query database for permission check
    const hasPermission = await checkPermission(userId, resource, action, userRoles);

    if (!hasPermission) {
      throw new AppError('FORBIDDEN', `Insufficient permissions for ${action} on ${resource}`, 403);
    }

    // Cache the result with TTL
    await redis.setex(cacheKey, CACHE_TTL.PERMISSIONS, 'true');

    next();
  };
}

// Permission checking with many-to-many relationships
async function checkPermission(
  userId: string,
  resource: string,
  action: string,
  userRoles: string[] = []
): Promise<boolean> {
  // Check via JOIN query through UserRole and RolePermission tables
  const permission = await prisma.permission.findFirst({
    where: {
      resource,
      action,
      roles: {
        some: {
          users: {
            some: {
              userId
            }
          }
        }
      }
    }
  });

  return !!permission;
}

// Usage examples
router.delete('/users/:id', requirePermission('users', 'delete'), deleteUser);
router.post('/roles', requirePermission('roles', 'create'), createRole);
router.put('/permissions/:id', requirePermission('permissions', 'update'), updatePermission);
```

#### Junction Tables

The RBAC system uses two junction tables to implement many-to-many relationships:

1. **UserRole**: Links users to roles with assignment timestamps
2. **RolePermission**: Links roles to permissions with granted timestamps

These tables allow for flexible permission management where:
- Users can have multiple roles
- Roles can have multiple permissions
- The same permission can be assigned to multiple roles
- User permissions are the union of all permissions from all their roles

### API Key Management

```typescript
interface APIKey {
  id: string;
  userId: string;
  name: string;
  keyHash: string; // SHA-256 hash
  keyPrefix: string; // First 8 chars (visible)
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

// Generate API key
function generateAPIKey(): { key: string; hash: string; prefix: string } {
  const key = `sk_${randomBytes(32).toString('base64url')}`;
  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 12);

  return { key, hash, prefix };
}

// Validate API key
async function validateAPIKey(key: string): Promise<User | null> {
  const hash = createHash('sha256').update(key).digest('hex');

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { user: true },
  });

  if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
    return null;
  }

  // Update last used timestamp (async)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err) => logger.error('Failed to update API key', err));

  return apiKey.user;
}
```

### Content Security Policy

```typescript
// middlewares/security.ts
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.smartaihub.com'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

---

## Error Handling & Resilience

### Error Hierarchy

```typescript
// shared/utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super('AUTHENTICATION_ERROR', message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('AUTHORIZATION_ERROR', message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('RATE_LIMIT_EXCEEDED', 'Too many requests', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}
```

### Global Error Handler

```typescript
// middlewares/errorHandler.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Send to error tracking service
  Sentry.captureException(err, {
    tags: {
      requestId: req.id,
      path: req.path,
    },
  });

  // Determine status code and message
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
  }

  // Send response
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      requestId: req.id,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
      }),
    },
  });
}
```

### Retry Logic with Exponential Backoff

```typescript
// utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 30000, factor = 2 } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: error.message,
      });

      await sleep(delay);
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw lastError;
}
```

---

## Observability

### Structured Logging

```typescript
// shared/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME,
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Add request ID to all logs
export function addRequestId(requestId: string) {
  return logger.child({ requestId });
}

export default logger;
```

### Request Logging Middleware

```typescript
// middlewares/requestLogger.ts
import { v4 as uuidv4 } from 'uuid';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);

  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
    });
  });

  next();
}
```

### Metrics Collection (Prometheus)

```typescript
// utils/metrics.ts
import client from 'prom-client';

const register = new client.Registry();

// Default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

export const creditBalance = new client.Gauge({
  name: 'user_credit_balance',
  help: 'User credit balance',
  labelNames: ['userId'],
});

export const llmRequestTotal = new client.Counter({
  name: 'llm_requests_total',
  help: 'Total LLM API requests',
  labelNames: ['provider', 'model', 'status'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(creditBalance);
register.registerMetric(llmRequestTotal);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Health Checks

```typescript
// routes/health.ts
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: process.env.SERVICE_NAME,
    version: process.env.APP_VERSION,
    uptime: process.uptime(),
    checks: {},
  };

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'ok';
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = 'error';
  }

  // Redis check
  try {
    await redis.ping();
    health.checks.redis = 'ok';
  } catch (error) {
    health.status = 'degraded';
    health.checks.redis = 'error';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

## Deployment Architecture

### Docker Configuration

**Multi-stage Dockerfile** (Backend Services):

```dockerfile
# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/auth-service/package.json ./packages/auth-service/

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY packages/shared ./packages/shared
COPY packages/auth-service ./packages/auth-service
COPY tsconfig.base.json ./

# Build
RUN npm run build --workspace=@smart-ai-hub/auth-service

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/auth-service/dist ./dist
COPY --from=builder /app/packages/auth-service/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

**Docker Compose** (Production):

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER}']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  api-gateway:
    build:
      context: .
      dockerfile: packages/api-gateway/Dockerfile
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
      REDIS_URL: redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - frontend
      - backend
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

  auth-service:
    build:
      context: .
      dockerfile: packages/auth-service/Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend
    deploy:
      replicas: 2

  core-service:
    build:
      context: .
      dockerfile: packages/core-service/Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - backend
    deploy:
      replicas: 2

  mcp-server:
    build:
      context: .
      dockerfile: packages/mcp-server/Dockerfile
    environment:
      NODE_ENV: production
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      REDIS_URL: redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - backend
    deploy:
      replicas: 3

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api-gateway
    networks:
      - frontend

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3333:3000'
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - monitoring

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  frontend:
  backend:
  monitoring:
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker images
        run: docker-compose build

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker-compose push

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /opt/smart-ai-hub
            git pull
            docker-compose pull
            docker-compose up -d
            docker system prune -af
```

---

## Diagrams

### Authentication Flow Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant AG as API Gateway
    participant AS as Auth Service
    participant DB as Database
    participant R as Redis

    C->>AG: POST /api/auth/login
    AG->>AS: Forward request
    AS->>DB: Query user by email
    DB-->>AS: User data
    AS->>AS: Verify password (bcrypt)
    AS->>R: Check if token blacklisted
    R-->>AS: Not blacklisted
    AS->>AS: Generate JWT tokens
    AS->>R: Store refresh token
    AS-->>AG: JWT tokens
    AG-->>C: 200 OK + tokens

    Note over C,R: Subsequent requests

    C->>AG: GET /api/users (+ Bearer token)
    AG->>AG: Validate JWT
    AG->>R: Check token blacklist
    R-->>AG: Valid
    AG->>Core: Forward authorized request
    Core-->>AG: Response
    AG-->>C: 200 OK + data
```

### Credit Deduction Flow

```mermaid
sequenceDiagram
    participant Client
    participant MCP as MCP Server
    participant Core as Core Service
    participant DB as Database
    participant LLM as LLM Provider

    Client->>MCP: WebSocket: GPT request
    MCP->>Core: Check credit balance
    Core->>DB: Query credit_accounts
    DB-->>Core: Balance: 100
    Core-->>MCP: Sufficient credits

    MCP->>LLM: Forward request
    LLM-->>MCP: Stream response
    MCP-->>Client: Stream chunks

    LLM-->>MCP: Usage: 1000 tokens
    MCP->>MCP: Calculate credits (10)
    MCP->>Core: Deduct 10 credits
    Core->>DB: BEGIN TRANSACTION
    Core->>DB: UPDATE balance - 10
    Core->>DB: INSERT transaction log
    Core->>DB: COMMIT
    DB-->>Core: Success
    Core-->>MCP: Deduction complete
    MCP-->>Client: Final message + usage
```

### System Deployment Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
                   ┌─────▼─────┐
                   │  Cloudflare│
                   │    CDN     │
                   └─────┬─────┘
                         │
                         │
              ┌──────────▼──────────┐
              │   Load Balancer     │
              │   (DigitalOcean)    │
              └──────────┬──────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
   │ Server 1│      │ Server 2│     │ Server 3│
   │(Primary)│      │(Replica)│     │(Replica)│
   └────┬────┘      └────┬────┘     └────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
            ┌────────────▼────────────┐
            │   Docker Swarm/K8s      │
            │   Orchestration         │
            └────────────┬────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
   │ Gateway │      │  Auth   │     │  Core   │
   │ x2      │      │Service  │     │Service  │
   │         │      │  x2     │     │  x2     │
   └────┬────┘      └────┬────┘     └────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Data Layer        │
              │  ┌──────┐ ┌──────┐ │
              │  │ PG   │ │Redis │ │
              │  │Master│ │      │ │
              │  └──┬───┘ └──────┘ │
              │     │               │
              │  ┌──▼───┐ ┌──────┐ │
              │  │ PG   │ │ PG   │ │
              │  │Read 1│ │Read 2│ │
              │  └──────┘ └──────┘ │
              └─────────────────────┘
```
