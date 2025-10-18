# Smart AI Hub - Developer Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Authentication & Authorization](#authentication--authorization)
8. [Points System Implementation](#points-system-implementation)
9. [Multi-tier Hierarchy](#multi-tier-hierarchy)
10. [Security Implementation](#security-implementation)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Monitoring & Logging](#monitoring--logging)
14. [Troubleshooting](#troubleshooting)
15. [Contributing Guidelines](#contributing-guidelines)

## Introduction

This developer guide provides comprehensive information for developers working on the Smart AI Hub Points System. It covers the architecture, implementation details, development workflow, and best practices for contributing to the project.

## Architecture Overview

The Smart AI Hub Points System is built with a microservices architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │  Auth Service   │
│   (React/TS)    │◄──►│   (Express)     │◄──►│   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌────────┼────────┐
                       │                 │
                ┌───────────┐    ┌─────────────┐
                │Core Service│    │MCP Server   │
                │(Express)   │    │(WebSocket)  │
                └───────────┘    └─────────────┘
                       │
                ┌───────────┐
                │Database   │
                │(PostgreSQL)│
                └───────────┘
```

### Key Components

- **Frontend**: React/TypeScript application for user interface
- **API Gateway**: Central entry point for all client requests
- **Auth Service**: Handles authentication and authorization
- **Core Service**: Implements business logic for points, transfers, etc.
- **MCP Server**: WebSocket server for real-time notifications
- **Database**: PostgreSQL for data persistence

## Development Environment Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git
- Docker (optional but recommended)

### Local Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/smart-ai-hub/points-system.git
   cd points-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   cd packages/frontend && npm install
   cd ../core-service && npm install
   cd ../auth-service && npm install
   cd ../mcp-server && npm install
   cd ../..
   ```

3. **Set up the database**

   ```bash
   # Create database
   createdb smart_ai_hub

   # Run migrations
   cd packages/core-service
   npm run migrate

   # Seed test data
   npm run seed
   ```

4. **Configure environment variables**

   ```bash
   # Copy environment templates
   cp packages/core-service/.env.example packages/core-service/.env
   cp packages/auth-service/.env.example packages/auth-service/.env
   cp packages/frontend/.env.example packages/frontend/.env

   # Edit environment files with your configuration
   ```

5. **Start development servers**

   ```bash
   # Start all services
   npm run dev

   # Or start services individually
   npm run dev:frontend
   npm run dev:api-gateway
   npm run dev:core-service
   npm run dev:auth-service
   npm run dev:mcp-server
   ```

### Docker Setup

1. **Build and start containers**

   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**

   ```bash
   docker-compose exec core-service npm run migrate
   ```

3. **Seed test data**
   ```bash
   docker-compose exec core-service npm run seed
   ```

## Project Structure

```
smart-ai-hub/
├── packages/
│   ├── frontend/           # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── public/
│   │   └── package.json
│   ├── core-service/       # Core business logic
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   └── utils/
│   │   ├── prisma/
│   │   └── package.json
│   ├── auth-service/       # Authentication service
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   └── utils/
│   │   └── package.json
│   ├── mcp-server/         # WebSocket server
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   └── package.json
│   └── shared/             # Shared utilities
│       ├── logger/
│       ├── monitoring/
│       └── types/
├── tests/
│   ├── e2e/               # End-to-end tests
│   ├── security/          # Security tests
│   └── performance/       # Performance tests
├── docs/                  # Documentation
├── scripts/               # Build and deployment scripts
└── docker-compose.yml
```

## Database Schema

### Key Tables

#### Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255),
  verified BOOLEAN DEFAULT false,
  tier VARCHAR(50) NOT NULL DEFAULT 'general',
  parent_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Credit Accounts

```sql
CREATE TABLE credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  points INTEGER DEFAULT 10000,
  credits INTEGER DEFAULT 1000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Transfers

```sql
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'points' or 'credits'
  status VARCHAR(20) DEFAULT 'completed',
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Referral Codes

```sql
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  code VARCHAR(10) UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Blocks

```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id),
  blocked_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Relationships

- Users have a hierarchical relationship via `parent_id`
- Each user has one credit account
- Users can have multiple referral codes
- Users can block multiple other users
- Transfers link sender and recipient users

## API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/login

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "tier": "general"
  }
}
```

#### POST /api/v1/auth/register

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "referralCode": "referral-code" // optional
}
```

### User Endpoints

#### GET /api/v1/users/profile

Authorization: Bearer token

Response:

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "tier": "general",
  "creditAccount": {
    "points": 10000,
    "credits": 1000
  }
}
```

#### GET /api/v1/users

Authorization: Bearer token

Query parameters:

- `search`: Search term
- `tier`: Filter by tier
- `page`: Page number
- `limit`: Results per page

Response:

```json
{
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "tier": "general"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Transfer Endpoints

#### POST /api/v1/transfer

Authorization: Bearer token

```json
{
  "recipientId": "recipient-id",
  "amount": 1000,
  "type": "points",
  "message": "Optional message"
}
```

Response:

```json
{
  "id": "transfer-id",
  "senderId": "sender-id",
  "recipientId": "recipient-id",
  "amount": 1000,
  "type": "points",
  "status": "completed",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

#### GET /api/v1/transfers

Authorization: Bearer token

Query parameters:

- `type`: Filter by type ('points' or 'credits')
- `status`: Filter by status
- `page`: Page number
- `limit`: Results per page

### Points System Endpoints

#### GET /api/v1/points/balance

Authorization: Bearer token

Response:

```json
{
  "points": 10000,
  "credits": 1000
}
```

#### POST /api/v1/points/daily-reward

Authorization: Bearer token

Response:

```json
{
  "rewardAmount": 100,
  "claimedAt": "2023-01-01T00:00:00Z"
}
```

#### POST /api/v1/points/exchange

Authorization: Bearer token

```json
{
  "pointsAmount": 1000
}
```

Response:

```json
{
  "pointsExchanged": 1000,
  "creditsReceived": 67, // based on current exchange rate
  "exchangeRate": 15 // points per credit
}
```

### Referral Endpoints

#### GET /api/v1/referral/code

Authorization: Bearer token

Response:

```json
{
  "code": "REF123",
  "active": true,
  "createdAt": "2023-01-01T00:00:00Z"
}
```

#### POST /api/v1/referral/code

Authorization: Bearer token

Response:

```json
{
  "code": "NEW456",
  "active": true,
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### Block Endpoints

#### POST /api/v1/block

Authorization: Bearer token

```json
{
  "userId": "user-to-block-id",
  "reason": "Optional reason"
}
```

#### DELETE /api/v1/block/:userId

Authorization: Bearer token

## Authentication & Authorization

### JWT Implementation

The system uses JWT (JSON Web Tokens) for authentication:

```typescript
// Generate token
const token = jwt.sign({ userId: user.id, tier: user.tier }, process.env.JWT_SECRET, {
  expiresIn: '24h',
});

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Authorization Middleware

Authorization is handled by middleware that checks user permissions:

```typescript
export const requireTier = (minimumTier: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userTier = req.user?.tier;

    if (!hasRequiredTier(userTier, minimumTier)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
```

### Tier Hierarchy

The system enforces a tier hierarchy for authorization:

```typescript
const tierHierarchy = {
  general: 0,
  admin: 1,
  organization: 2,
  agency: 3,
  administrator: 4,
};

function hasRequiredTier(userTier: string, requiredTier: string): boolean {
  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}
```

## Points System Implementation

### Credit Account Service

```typescript
export class CreditAccountService {
  async getBalance(userId: string): Promise<{ points: number; credits: number }> {
    const account = await prisma.creditAccount.findUnique({
      where: { userId },
    });

    return {
      points: account.points,
      credits: account.credits,
    };
  }

  async updateBalance(userId: string, pointsChange: number, creditsChange: number): Promise<void> {
    await prisma.creditAccount.update({
      where: { userId },
      data: {
        points: { increment: pointsChange },
        credits: { increment: creditsChange },
      },
    });
  }
}
```

### Transfer Service

```typescript
export class TransferService {
  async createTransfer(
    senderId: string,
    recipientId: string,
    amount: number,
    type: 'points' | 'credits',
    message?: string
  ): Promise<Transfer> {
    // Validate transfer
    await this.validateTransfer(senderId, recipientId, amount, type);

    // Create transfer record
    const transfer = await prisma.transfer.create({
      data: {
        senderId,
        recipientId,
        amount,
        type,
        message,
      },
    });

    // Update balances
    await this.updateBalances(senderId, recipientId, amount, type);

    // Send notification
    await this.sendTransferNotification(transfer);

    return transfer;
  }

  private async validateTransfer(
    senderId: string,
    recipientId: string,
    amount: number,
    type: 'points' | 'credits'
  ): Promise<void> {
    // Check sender has sufficient balance
    const senderBalance = await this.creditAccountService.getBalance(senderId);
    const balanceType = type === 'points' ? senderBalance.points : senderBalance.credits;

    if (balanceType < amount) {
      throw new Error('Insufficient balance');
    }

    // Check recipient is visible to sender
    const isVisible = await this.visibilityService.canSeeUser(senderId, recipientId);
    if (!isVisible) {
      throw new Error('Recipient not found');
    }

    // Check recipient is not blocked
    const isBlocked = await this.blockService.isBlocked(senderId, recipientId);
    if (isBlocked) {
      throw new Error('Cannot transfer to blocked user');
    }
  }
}
```

## Multi-tier Hierarchy

### Visibility Service

```typescript
export class VisibilityService {
  async canSeeUser(viewerId: string, targetUserId: string): Promise<boolean> {
    const viewer = await prisma.user.findUnique({ where: { id: viewerId } });
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

    if (!viewer || !targetUser) {
      return false;
    }

    // Users can always see themselves
    if (viewerId === targetUserId) {
      return true;
    }

    // Administrators can see everyone
    if (viewer.tier === 'administrator') {
      return true;
    }

    // Check hierarchy visibility
    return this.isInHierarchy(viewer, targetUser);
  }

  private isInHierarchy(viewer: User, targetUser: User): boolean {
    // Implement hierarchy visibility logic based on tier
    switch (viewer.tier) {
      case 'agency':
        return this.isInAgencyHierarchy(viewer, targetUser);
      case 'organization':
        return this.isInOrganizationHierarchy(viewer, targetUser);
      case 'admin':
        return this.isInAdminHierarchy(viewer, targetUser);
      case 'general':
        return false; // General users can only see themselves
      default:
        return false;
    }
  }
}
```

### User Hierarchy Service

```typescript
export class UserHierarchyService {
  async getUsersVisibleToUser(userId: string): Promise<User[]> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return [];
    }

    switch (user.tier) {
      case 'administrator':
        return this.getAllUsers();
      case 'agency':
        return this.getAgencyUsers(userId);
      case 'organization':
        return this.getOrganizationUsers(userId);
      case 'admin':
        return this.getAdminVisibleUsers(userId);
      case 'general':
        return [user];
      default:
        return [];
    }
  }

  private async getAgencyUsers(agencyId: string): Promise<User[]> {
    // Get all organizations under this agency and their users
    return prisma.user.findMany({
      where: {
        OR: [
          { parentId: agencyId },
          { parent: { parentId: agencyId } },
          { parent: { parent: { parentId: agencyId } } },
        ],
      },
    });
  }
}
```

## Security Implementation

### Input Validation

```typescript
export const validateTransfer = (req: Request, res: Response, next: NextFunction) => {
  const { recipientId, amount, type } = req.body;

  // Validate recipient ID
  if (!recipientId || !isValidUUID(recipientId)) {
    return res.status(400).json({ message: 'Invalid recipient ID' });
  }

  // Validate amount
  if (!amount || amount <= 0 || amount > 1000000) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  // Validate type
  if (!type || !['points', 'credits'].includes(type)) {
    return res.status(400).json({ message: 'Invalid transfer type' });
  }

  next();
};
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message: `Please try again later`,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Apply to sensitive endpoints
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes
export const transferRateLimit = createRateLimit(60 * 1000, 10); // 10 requests per minute
```

### Security Headers

```typescript
import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

### Encryption

```typescript
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const encryptSensitiveData = (data: string): string => {
  const algorithm = 'aes-256-cbc';
  const key = process.env.ENCRYPTION_KEY;
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
};
```

## Testing

### Unit Testing

```typescript
// creditAccountService.test.ts
import { CreditAccountService } from '../services/creditAccountService';

describe('CreditAccountService', () => {
  let service: CreditAccountService;

  beforeEach(() => {
    service = new CreditAccountService();
  });

  describe('getBalance', () => {
    it('should return the correct balance for a user', async () => {
      const userId = 'user-id';
      const expectedBalance = { points: 10000, credits: 1000 };

      jest.spyOn(prisma.creditAccount, 'findUnique').mockResolvedValue(expectedBalance as any);

      const result = await service.getBalance(userId);

      expect(result).toEqual(expectedBalance);
    });
  });

  describe('updateBalance', () => {
    it('should update the balance correctly', async () => {
      const userId = 'user-id';
      const pointsChange = 1000;
      const creditsChange = 50;

      jest.spyOn(prisma.creditAccount, 'update').mockResolvedValue({} as any);

      await service.updateBalance(userId, pointsChange, creditsChange);

      expect(prisma.creditAccount.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          points: { increment: pointsChange },
          credits: { increment: creditsChange },
        },
      });
    });
  });
});
```

### Integration Testing

```typescript
// transfer.integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { setupTestDatabase, cleanupTestDatabase } from '../testUtils';

describe('Transfer API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/v1/transfer', () => {
    it('should transfer points successfully', async () => {
      const senderToken = await getAuthToken('sender@example.com');
      const recipientId = 'recipient-id';

      const response = await request(app)
        .post('/api/v1/transfer')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          recipientId,
          amount: 1000,
          type: 'points',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');

      // Verify balances were updated
      const senderBalance = await getUserBalance('sender-id');
      getUserBalance(recipientId);

      expect(senderBalance.points).toBe(9000); // 10000 - 1000
      expect(recipientBalance.points).toBe(11000); // 10000 + 1000
    });

    it('should reject transfer with insufficient balance', async () => {
      const senderToken = await getAuthToken('sender@example.com');
      const recipientId = 'recipient-id';

      const response = await request(app)
        .post('/api/v1/transfer')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          recipientId,
          amount: 999999, // More than balance
          type: 'points',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient balance');
    });
  });
});
```

### E2E Testing

```typescript
// transfer-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Transfer Flow', () => {
  test('should transfer points successfully', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Navigate to transfer
    await page.click('[data-testid="transfer-nav"]');

    // Fill transfer form
    await page.selectOption('[data-testid="transfer-type"]', 'points');
    await page.selectOption('[data-testid="recipient"]', 'recipient-user-id');
    await page.fill('[data-testid="amount"]', '1000');
    await page.fill('[data-testid="message"]', 'Test transfer');

    // Submit transfer
    await page.click('[data-testid="transfer-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Verify balance updated
    const balanceElement = await page.locator('[data-testid="points-balance"]');
    const balance = await balanceElement.textContent();
    expect(balance).toBe('9000'); // 10000 - 1000
  });
});
```

## Deployment

### Production Environment Setup

1. **Environment Variables**

   ```bash
   # Database
   DATABASE_URL=postgresql://user:password@host:port/database

   # JWT
   JWT_SECRET=your-super-secret-jwt-key

   # Encryption
   ENCRYPTION_KEY=your-32-character-encryption-key

   # External Services
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=noreply@smarthub.com
   SMTP_PASS=smtp-password

   # Monitoring
   SENTRY_DSN=https://your-sentry-dsn
   ```

2. **Docker Configuration**

   ```dockerfile
   # Dockerfile.prod
   FROM node:18-alpine AS builder

   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS runner

   WORKDIR /app
   COPY --from=builder /app/node_modules ./node_modules
   COPY . .

   EXPOSE 3001
   CMD ["npm", "start"]
   ```

3. **Docker Compose for Production**

   ```yaml
   version: '3.8'

   services:
     core-service:
       build:
         context: ./packages/core-service
         dockerfile: Dockerfile.prod
       environment:
         - NODE_ENV=production
         - DATABASE_URL=${DATABASE_URL}
       ports:
         - '3001:3001'
       depends_on:
         - postgres

     postgres:
       image: postgres:14
       environment:
         - POSTGRES_DB=smart_ai_hub
         - POSTGRES_USER=${DB_USER}
         - POSTGRES_PASSWORD=${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data

   volumes:
     postgres_data:
   ```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          # Deploy commands
          ssh user@server 'cd /app && git pull && docker-compose up -d --build'
```

## Monitoring & Logging

### Logging Configuration

```typescript
// logger/index.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'core-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

### Metrics Collection

```typescript
// monitoring/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Define metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
});

const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
});

// Export metrics
export { httpRequestsTotal, httpRequestDuration, activeUsers, register };
```

### Error Tracking

```typescript
// errorTracking.ts
import * as Sentry from '@sentry/node';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
};

export const captureException = (error: Error, context?: any) => {
  Sentry.captureException(error, {
    extra: context,
  });
};
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Problem**: Application can't connect to database
**Solution**:

1. Check DATABASE_URL environment variable
2. Verify database is running
3. Check network connectivity
4. Verify database credentials

#### Authentication Failures

**Problem**: JWT token verification fails
**Solution**:

1. Check JWT_SECRET environment variable
2. Verify token is not expired
3. Check token format
4. Verify token is being sent in Authorization header

#### Transfer Failures

**Problem**: Transfers are failing
**Solution**:

1. Check user balances
2. Verify visibility rules
3. Check for blocks
4. Review transfer validation logic

#### Performance Issues

**Problem**: Slow API responses
**Solution**:

1. Check database query performance
2. Add database indexes
3. Implement caching
4. Optimize complex queries

### Debugging Tips

1. **Enable Debug Logging**

   ```bash
   LOG_LEVEL=debug npm start
   ```

2. **Use Database Query Logging**

   ```typescript
   // In development
   prisma.$on('query', (e) => {
     console.log('Query: ' + e.query);
     console.log('Params: ' + e.params);
     console.log('Duration: ' + e.duration + 'ms');
   });
   ```

3. **Profile API Endpoints**

   ```typescript
   import { performance } from 'perf_hooks';

   app.use((req, res, next) => {
     const start = performance.now();

     res.on('finish', () => {
       const duration = performance.now() - start;
       console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
     });

     next();
   });
   ```

## Contributing Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Pull Request Process

1. Create a feature branch from main
2. Implement your changes with tests
3. Ensure all tests pass
4. Update documentation if needed
5. Submit a pull request with a clear description

### Code Review Guidelines

- Review for functionality and correctness
- Check for security vulnerabilities
- Verify test coverage
- Ensure code follows project standards
- Check for performance implications

### Testing Requirements

- Unit tests for all new functions
- Integration tests for API endpoints
- E2E tests for user flows
- Security tests for sensitive operations

---

_This developer guide is regularly updated to reflect the latest implementation details. Last updated: October 2023_
const recipientBalance = await
