# Core Service

## Overview

The Core Service handles the primary business logic of the Smart AI Hub platform, including user management, role-based access control, credit accounting, and usage analytics. It serves as the central hub for managing platform resources and user interactions.

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.x
- **Port**: 3002
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+

## Responsibilities

1. **User Management**: CRUD operations for user accounts
2. **Role & Permission Management**: RBAC implementation
3. **Credit Account Management**: Track and manage user credits
4. **Transaction Processing**: Handle credit transactions
5. **Usage Analytics**: Track and analyze service usage
6. **Promotional Code System**: Manage promo codes and redemptions
7. **Sora2 Video Generator Integration**: Session-based authentication for video generation

## Database Tables

### Roles and Permissions
```sql
roles, permissions, user_roles, role_permissions
```

### Credit Management
```sql
credit_accounts, credit_transactions
```

### Promotional System
```sql
promo_codes, promo_redemptions
```

### Usage Tracking
```sql
usage_logs
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

## Credit Management APIs

### Check Credit Balance
```
GET /api/credits/balance
Response: {
  "userId": "uuid",
  "balance": 1000,
  "currency": "credits",
  "lastUpdated": "2025-01-01T00:00:00Z"
}
```

### Deduct Credits for Video Generation
```
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
```

### Get Credit Transaction History
```
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

## Database Schema (Key Models)

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

## Security Features

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