# Data Model Specification: Financial System & Credits

## Overview

This document defines the data models for the Financial System & Credits epic (EPIC-002), which manages user credit accounts, financial transactions, and payment processing within the system.

## Database Schema

### Credit Accounts Table

```sql
CREATE TABLE credit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign key constraint
ALTER TABLE credit_accounts ADD CONSTRAINT fk_credit_accounts_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX idx_credit_accounts_user_id ON credit_accounts(user_id);
CREATE INDEX idx_credit_accounts_balance ON credit_accounts(balance);
```

### Credit Transactions Table

```sql
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    amount BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign key constraint
ALTER TABLE credit_transactions ADD CONSTRAINT fk_credit_transactions_account_id 
    FOREIGN KEY (account_id) REFERENCES credit_accounts(id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX idx_credit_transactions_account_id ON credit_transactions(account_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_account_created ON credit_transactions(account_id, created_at DESC);
```

### Payment Transactions Table (Optional for future use)

```sql
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    amount BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign key constraint
ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_account_id 
    FOREIGN KEY (account_id) REFERENCES credit_accounts(id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX idx_payment_transactions_account_id ON payment_transactions(account_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider_tx_id ON payment_transactions(provider_transaction_id);
```

## Prisma Schema Definition

```prisma
model CreditAccount {
  id        String   @id @default(uuid())
  userId    String   @unique @map("user_id")
  balance   BigInt   @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  user         User @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions CreditTransaction[]
  payments     PaymentTransaction[]

  @@index([userId])
  @@index([balance])
  @@map("credit_accounts")
}

model CreditTransaction {
  id          String   @id @default(uuid())
  accountId   String   @map("account_id")
  amount      BigInt
  type        String   // purchase, usage, refund, bonus
  description String?
  metadata    Json?
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  account CreditAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([createdAt])
  @@index([type])
  @@index([accountId, createdAt(sort: Desc)])
  @@map("credit_transactions")
}

model PaymentTransaction {
  id                    String   @id @default(uuid())
  accountId             String   @map("account_id")
  amount                BigInt
  paymentMethod         String   @map("payment_method")
  paymentProvider       String   @map("payment_provider")
  providerTransactionId String?  @map("provider_transaction_id")
  status                String
  failureReason         String?  @map("failure_reason")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  // Relations
  account CreditAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([status])
  @@index([providerTransactionId])
  @@map("payment_transactions")
}
```

## Entity Relationships

### CreditAccount Entity
- **Primary Key**: id (UUID)
- **Unique Fields**: userId
- **Attributes**:
  - `userId`: Reference to the user account
  - `balance`: Current credit balance (BigInt for large values)
  - `createdAt`: Account creation timestamp
  - `updatedAt`: Last update timestamp
- **Relationships**:
  - One-to-one with User
  - One-to-many with CreditTransaction
  - One-to-many with PaymentTransaction

### CreditTransaction Entity
- **Primary Key**: id (UUID)
- **Attributes**:
  - `accountId`: Reference to the credit account
  - `amount`: Transaction amount (positive for credits, negative for debits)
  - `type`: Transaction type (purchase, usage, refund, bonus)
  - `description`: Optional transaction description
  - `metadata`: Additional transaction data in JSON format
  - `createdAt`: Transaction timestamp
- **Relationships**:
  - Many-to-one with CreditAccount

### PaymentTransaction Entity
- **Primary Key**: id (UUID)
- **Attributes**:
  - `accountId`: Reference to the credit account
  - `amount`: Payment amount
  - `paymentMethod`: Payment method used (credit_card, paypal, etc.)
  - `paymentProvider`: Payment processor (stripe, paypal, etc.)
  - `providerTransactionId`: Transaction ID from payment provider
  - `status`: Payment status (pending, completed, failed, refunded)
  - `failureReason`: Reason for payment failure (if applicable)
  - `createdAt`: Transaction creation timestamp
  - `updatedAt`: Last update timestamp
- **Relationships**:
  - Many-to-one with CreditAccount

## Data Validation Rules

### CreditAccount Entity Validation
- **userId**: Must reference an existing user, must be unique
- **balance**: Must be a non-negative integer, default to 0
- **createdAt**: Automatically set to current timestamp
- **updatedAt**: Automatically updated on changes

### CreditTransaction Entity Validation
- **accountId**: Must reference an existing credit account
- **amount**: Must be an integer, positive for credits, negative for debits
- **type**: Must be one of: purchase, usage, refund, bonus
- **description**: Optional but recommended for audit purposes
- **metadata**: Optional JSON object for additional data
- **createdAt**: Automatically set to current timestamp

### PaymentTransaction Entity Validation
- **accountId**: Must reference an existing credit account
- **amount**: Must be a positive integer
- **paymentMethod**: Must be a valid payment method
- **paymentProvider`: Must be a valid payment provider
- **status**: Must be one of: pending, completed, failed, refunded
- **failureReason**: Required if status is failed
- **createdAt**: Automatically set to current timestamp
- **updatedAt**: Automatically updated on changes

## Security Considerations

### Financial Data Protection
- All financial data must be encrypted at rest
- Access to financial data must be strictly controlled
- Financial operations must be auditable and traceable
- Sensitive payment information must never be stored

### Transaction Integrity
- All financial transactions must be atomic
- Database transactions must ensure consistency
- Concurrent operations must be properly synchronized
- System must prevent race conditions in credit operations

### Audit Requirements
- All financial operations must be logged with full details
- Audit logs must be immutable and tamper-proof
- Audit logs must be retained for regulatory compliance
- Financial reports must be generated from audit data

## Performance Optimization

### Indexing Strategy
- Primary key indexes on all tables
- Unique index on user_id in credit_accounts
- Composite indexes on account_id + created_at for transaction history
- Indexes on frequently queried fields (type, status)
- Regular index maintenance and monitoring

### Query Optimization
- Use efficient queries for balance checks
- Optimize transaction history queries with proper pagination
- Use database transactions for multi-step operations
- Implement connection pooling for high-volume operations

### Caching Strategy
- Cache user credit balances with appropriate TTL
- Cache frequently accessed transaction summaries
- Implement cache invalidation on balance changes
- Consider distributed caching for high availability

## Migration Strategy

### Initial Migration
```sql
-- Create credit_accounts table
CREATE TABLE credit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_transactions table
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    amount BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_transactions table
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    amount BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE credit_accounts ADD CONSTRAINT fk_credit_accounts_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE credit_transactions ADD CONSTRAINT fk_credit_transactions_account_id 
    FOREIGN KEY (account_id) REFERENCES credit_accounts(id) ON DELETE CASCADE;

ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_account_id 
    FOREIGN KEY (account_id) REFERENCES credit_accounts(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_credit_accounts_user_id ON credit_accounts(user_id);
CREATE INDEX idx_credit_accounts_balance ON credit_accounts(balance);
CREATE INDEX idx_credit_transactions_account_id ON credit_transactions(account_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_account_created ON credit_transactions(account_id, created_at DESC);
CREATE INDEX idx_payment_transactions_account_id ON payment_transactions(account_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider_tx_id ON payment_transactions(provider_transaction_id);
```

### Data Migration
```sql
-- Create credit accounts for existing users
INSERT INTO credit_accounts (user_id, balance, created_at, updated_at)
SELECT id, 0, NOW(), NOW() FROM users
WHERE id NOT IN (SELECT user_id FROM credit_accounts);

-- Add initial bonus credits for existing users (optional)
INSERT INTO credit_transactions (account_id, amount, type, description, created_at)
SELECT ca.id, 100, 'bonus', 'Welcome bonus credits', NOW()
FROM credit_accounts ca
WHERE ca.user_id IN (SELECT id FROM users WHERE created_at < '2025-01-01')
AND NOT EXISTS (
    SELECT 1 FROM credit_transactions ct 
    WHERE ct.account_id = ca.id AND ct.type = 'bonus'
);
```

### Future Schema Changes
- All schema changes must maintain backward compatibility
- Use database migrations for all structural changes
- Test migrations thoroughly before production deployment
- Maintain rollback procedures for all migrations

## Cross-References

- [Financial System Specification](spec.md)
- [User Management & Profiles](../002-user-management/spec.md)
- [Promo System & Discounts](../005-promo-system/spec.md)
- [API Specification](contracts/api-spec.json)