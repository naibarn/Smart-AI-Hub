# Promo System Data Model

## Overview

The Promo System data model provides a comprehensive structure for managing promotional codes, tracking redemptions, and analyzing campaign effectiveness. This model supports various types of promotional campaigns while maintaining data integrity and performance.

## Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐
│   PromoCode     │◄──────┤ PromoRedemption  │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │       │ id (PK)          │
│ code (UNIQUE)   │       │ userId (FK)      │
│ credits         │       │ codeId (FK)      │
│ maxUses         │       │ credits          │
│ usedCount       │       │ redeemedAt       │
│ expiresAt       │       └──────────────────┘
│ active          │
│ createdAt       │
└─────────────────┘
```

## Data Models

### PromoCode

The `PromoCode` entity represents promotional codes that can be redeemed for credits.

#### Prisma Schema

```prisma
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
  @@index([expiresAt])
  @@index([active])
  @@map("promo_codes")
}
```

#### Field Descriptions

| Field     | Type      | Description               | Constraints                                  |
| --------- | --------- | ------------------------- | -------------------------------------------- |
| id        | String    | Primary key identifier    | UUID, Required                               |
| code      | String    | Unique promo code string  | 3-50 chars, alphanumeric + hyphens, Required |
| credits   | Int       | Number of credits awarded | Positive integer, Required                   |
| maxUses   | Int?      | Maximum redemption limit  | Positive integer or null, Optional           |
| usedCount | Int       | Current redemption count  | Non-negative integer, Default: 0             |
| expiresAt | DateTime? | Expiration date           | Future date or null, Optional                |
| active    | Boolean   | Activation status         | Boolean, Default: true                       |
| createdAt | DateTime  | Creation timestamp        | Auto-generated, Required                     |

#### Validation Rules

```typescript
const promoCodeValidation = {
  code: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Za-z0-9-]+$/,
    unique: true,
  },
  credits: {
    required: true,
    min: 1,
    max: 10000,
    integer: true,
  },
  maxUses: {
    min: 1,
    max: 1000000,
    integer: true,
    optional: true,
  },
  expiresAt: {
    after: new Date(),
    optional: true,
  },
};
```

### PromoRedemption

The `PromoRedemption` entity tracks when users redeem promotional codes.

#### Prisma Schema

```prisma
model PromoRedemption {
  id        String   @id @default(uuid())
  userId    String
  codeId    String
  credits   Int
  redeemedAt DateTime @default(now())

  code PromoCode @relation(fields: [codeId], references: [id])

  @@unique([userId, codeId])
  @@index([userId])
  @@index([codeId])
  @@index([redeemedAt])
  @@map("promo_redemptions")
}
```

#### Field Descriptions

| Field      | Type     | Description                 | Constraints                |
| ---------- | -------- | --------------------------- | -------------------------- |
| id         | String   | Primary key identifier      | UUID, Required             |
| userId     | String   | User who redeemed the code  | UUID, Required             |
| codeId     | String   | Reference to the promo code | UUID, Required             |
| credits    | Int      | Credits awarded             | Positive integer, Required |
| redeemedAt | DateTime | Redemption timestamp        | Auto-generated, Required   |

#### Validation Rules

```typescript
const promoRedemptionValidation = {
  userId: {
    required: true,
    format: 'uuid',
  },
  codeId: {
    required: true,
    format: 'uuid',
  },
  credits: {
    required: true,
    min: 1,
    max: 10000,
    integer: true,
  },
};
```

## Database Schema

### SQL Schema (PostgreSQL)

```sql
-- Promo Codes Table
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    max_uses INTEGER CHECK (max_uses > 0),
    used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for Promo Codes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_expires_at ON promo_codes(expires_at);
CREATE INDEX idx_promo_codes_active ON promo_codes(active);

-- Promo Redemptions Table
CREATE TABLE promo_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    code_id UUID NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_redemptions_code
        FOREIGN KEY (code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,

    CONSTRAINT unique_user_code
        UNIQUE (user_id, code_id)
);

-- Indexes for Promo Redemptions
CREATE INDEX idx_promo_redemptions_user_id ON promo_redemptions(user_id);
CREATE INDEX idx_promo_redemptions_code_id ON promo_redemptions(code_id);
CREATE INDEX idx_promo_redemptions_redeemed_at ON promo_redemptions(redeemed_at);
```

## Business Logic Constraints

### Promo Code Validation

1. **Uniqueness**: Each promo code must be unique across the system
2. **Format**: Codes must be 3-50 characters, alphanumeric with hyphens
3. **Case Insensitivity**: Codes are stored in a consistent case but matched case-insensitively
4. **Expiration**: Expired codes cannot be redeemed
5. **Usage Limits**: Codes cannot be redeemed beyond their max usage limit
6. **Activation**: Inactive codes cannot be redeemed

### Redemption Constraints

1. **One Per User**: Each user can only redeem a specific promo code once
2. **Atomic Operations**: Redemption must be atomic to prevent race conditions
3. **Credit Allocation**: Credits must be added to user accounts immediately upon successful redemption
4. **Audit Trail**: All redemption attempts must be logged

### Data Integrity

1. **Referential Integrity**: Redemptions must reference valid promo codes
2. **Cascade Deletion**: Deleting a promo code should delete associated redemptions
3. **Consistent Counters**: Used count must be updated atomically during redemption

## Performance Considerations

### Indexing Strategy

1. **Primary Lookups**: Index on `code` field for fast promo code lookups
2. **User Queries**: Index on `userId` for efficient user redemption history
3. **Time-based Queries**: Index on `redeemedAt` for analytics queries
4. **Status Queries**: Index on `active` and `expiresAt` for filtering

### Query Optimization

```sql
-- Efficient promo code validation
SELECT id, credits, expires_at, active, max_uses, used_count
FROM promo_codes
WHERE code = $1 AND active = true
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (max_uses IS NULL OR used_count < max_uses);

-- Efficient user redemption check
SELECT id FROM promo_redemptions
WHERE user_id = $1 AND code_id = $2;

-- Analytics query for redemption trends
SELECT DATE(redeemed_at) as date, COUNT(*) as redemptions, SUM(credits) as credits
FROM promo_redemptions
WHERE redeemed_at BETWEEN $1 AND $2
GROUP BY DATE(redeemed_at)
ORDER BY date;
```

### Scaling Considerations

1. **Read Replicas**: Analytics queries can be served from read replicas
2. **Partitioning**: Consider time-based partitioning for large redemption tables
3. **Caching**: Frequently accessed promo codes can be cached
4. **Rate Limiting**: Implement rate limiting for redemption endpoints

## Security Considerations

### Data Protection

1. **Input Validation**: All inputs must be validated and sanitized
2. **SQL Injection Prevention**: Use parameterized queries
3. **Access Control**: Implement proper authorization for admin operations
4. **Audit Logging**: Log all admin operations and redemption attempts

### Business Security

1. **Fraud Prevention**: Implement rate limiting and anomaly detection
2. **Code Generation**: Use cryptographically secure random code generation
3. **Expiration Enforcement**: Strictly enforce expiration dates
4. **Usage Tracking**: Monitor for unusual redemption patterns

## Migration Strategy

### Initial Migration

```sql
-- Create tables
CREATE TABLE promo_codes (...);
CREATE TABLE promo_redemptions (...);

-- Create indexes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
-- ... other indexes

-- Insert initial data if migrating from existing system
INSERT INTO promo_codes (id, code, credits, ...)
SELECT id, code, credits, ... FROM old_promo_system;
```

### Data Migration

```typescript
// Example migration script
async function migratePromoCodes() {
  const oldCodes = await db.oldPromoCodes.findMany();

  for (const oldCode of oldCodes) {
    await db.promoCode.create({
      data: {
        id: generateUUID(),
        code: oldCode.code.toUpperCase(),
        credits: oldCode.creditAmount,
        maxUses: oldCode.usageLimit,
        expiresAt: oldCode.expiryDate,
        active: oldCode.isActive,
        createdAt: oldCode.createdAt,
      },
    });
  }
}
```

## Analytics and Reporting

### Key Metrics

1. **Redemption Rate**: Percentage of codes that have been redeemed
2. **Usage Velocity**: Speed at which codes are being redeemed
3. **Campaign Effectiveness**: ROI of promotional campaigns
4. **User Acquisition**: New users acquired through promo codes

### Sample Queries

```sql
-- Top performing promo codes
SELECT
    pc.code,
    COUNT(pr.id) as redemption_count,
    SUM(pr.credits) as total_credits,
    COUNT(DISTINCT pr.user_id) as unique_users
FROM promo_codes pc
LEFT JOIN promo_redemptions pr ON pc.id = pr.code_id
WHERE pc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY pc.id, pc.code
ORDER BY redemption_count DESC
LIMIT 10;

-- Redemption trends over time
SELECT
    DATE_TRUNC('week', redeemed_at) as week,
    COUNT(*) as redemptions,
    SUM(credits) as credits_issued,
    COUNT(DISTINCT user_id) as unique_users
FROM promo_redemptions
WHERE redeemed_at >= NOW() - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', redeemed_at)
ORDER BY week;
```

## Integration Points

### User Management System

```typescript
interface UserService {
  validateUser(userId: string): Promise<boolean>;
  addCredits(userId: string, amount: number): Promise<void>;
  getUserBalance(userId: string): Promise<number>;
}
```

### Financial System

```typescript
interface FinancialService {
  recordTransaction(transaction: CreditTransaction): Promise<void>;
  getTransactionHistory(userId: string): Promise<Transaction[]>;
}
```

### Notification System

```typescript
interface NotificationService {
  sendRedemptionConfirmation(userId: string, redemption: PromoRedemption): Promise<void>;
  sendPromoExpirationWarning(codeId: string): Promise<void>;
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('PromoCode Model', () => {
  test('should validate promo code creation', async () => {
    const promoCode = await PromoCode.create({
      code: 'TEST123',
      credits: 100,
      maxUses: 1000,
    });

    expect(promoCode.code).toBe('TEST123');
    expect(promoCode.credits).toBe(100);
    expect(promoCode.active).toBe(true);
  });

  test('should prevent duplicate codes', async () => {
    await PromoCode.create({ code: 'DUPLICATE', credits: 50 });

    await expect(PromoCode.create({ code: 'DUPLICATE', credits: 75 })).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
describe('Promo Redemption Flow', () => {
  test('should complete full redemption flow', async () => {
    const user = await createTestUser();
    const promoCode = await createTestPromoCode();

    const redemption = await redeemPromoCode(user.id, promoCode.code);

    expect(redemption.success).toBe(true);
    expect(redemption.creditsAdded).toBe(promoCode.credits);

    const userBalance = await getUserBalance(user.id);
    expect(userBalance).toBe(promoCode.credits);
  });
});
```

## Future Enhancements

### Advanced Promo Types

```prisma
model AdvancedPromoCode {
  // ... existing fields

  type        PromoType @default(STANDARD)
  discountType DiscountType?
  discountValue Decimal?
  minPurchase   Decimal?

  // Targeting criteria
  userSegments  String[]
  regions       String[]

  // Conditional logic
  conditions    Json?
}

enum PromoType {
  STANDARD
  PERCENTAGE
  FIXED_AMOUNT
  BOGO
  TIERED
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}
```

### Campaign Management

```prisma
model PromoCampaign {
  id          String   @id @default(uuid())
  name        String
  description String?
  startDate   DateTime
  endDate     DateTime
  budget      Decimal?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  promoCodes  PromoCode[]

  @@map("promo_campaigns")
}
```

## Cross-References

- [EPIC-002: Financial System & Credits](../004-financial-system/data-model.md) - Credit account management
- [FEAT-001: User Management & Profiles](../002-user-management/data-model.md) - User data model
- [API Specification](./contracts/api-spec.json) - Detailed API documentation
