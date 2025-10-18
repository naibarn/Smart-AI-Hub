# Infrastructure Services Data Model

## Overview

This document defines the data models for the Infrastructure Services, including the API Gateway and Core Service. The data models are implemented using Prisma ORM with PostgreSQL as the database.

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

#### Fields

- `id`: Unique identifier for the user (UUID)
- `email`: User's email address (unique)
- `passwordHash`: Hashed password for authentication
- `verified`: Whether the user's email has been verified
- `googleId`: Google OAuth ID for social login
- `createdAt`: Timestamp when the user was created
- `updatedAt`: Timestamp when the user was last updated

#### Relationships

- `roles`: One-to-many relationship with UserRole
- `creditAccount`: One-to-one relationship with CreditAccount
- `usageLogs`: One-to-many relationship with UsageLog

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

#### Fields

- `id`: Unique identifier for the credit account (UUID)
- `userId`: Reference to the user (unique)
- `balance`: Current credit balance
- `createdAt`: Timestamp when the account was created
- `updatedAt`: Timestamp when the account was last updated

#### Relationships

- `user`: Many-to-one relationship with User
- `transactions`: One-to-many relationship with CreditTransaction

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

#### Fields

- `id`: Unique identifier for the transaction (UUID)
- `accountId`: Reference to the credit account
- `amount`: Transaction amount (negative for debits, positive for credits)
- `type`: Transaction type (debit or credit)
- `reason`: Reason for the transaction
- `metadata`: Additional metadata in JSON format
- `createdAt`: Timestamp when the transaction was created

#### Relationships

- `account`: Many-to-one relationship with CreditAccount

### Usage Log Model

```typescript
model UsageLog {
  id          String   @id @default(uuid())
  userId      String
  service     String   // auth, core, mcp, etc.
  endpoint    String   // API endpoint used
  method      String   // HTTP method
  statusCode  Int      // HTTP response status
  duration    Int      // Request duration in milliseconds
  metadata    Json?    // Additional usage details
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([service, createdAt])
  @@map("usage_logs")
}
```

#### Fields

- `id`: Unique identifier for the usage log (UUID)
- `userId`: Reference to the user
- `service`: Service name (auth, core, mcp, etc.)
- `endpoint`: API endpoint used
- `method`: HTTP method
- `statusCode`: HTTP response status code
- `duration`: Request duration in milliseconds
- `metadata`: Additional usage details in JSON format
- `createdAt`: Timestamp when the usage was logged

#### Relationships

- `user`: Many-to-one relationship with User

### Role Model

```typescript
model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  level       Int      @default(0) // Higher level = more permissions
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users        UserRole[]
  permissions  RolePermission[]

  @@index([name])
  @@map("roles")
}
```

#### Fields

- `id`: Unique identifier for the role (UUID)
- `name`: Role name (unique)
- `description`: Role description
- `level`: Role level (higher level = more permissions)
- `createdAt`: Timestamp when the role was created
- `updatedAt`: Timestamp when the role was last updated

#### Relationships

- `users`: One-to-many relationship with UserRole
- `permissions`: One-to-many relationship with RolePermission

### Permission Model

```typescript
model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  resource    String   // Resource the permission applies to
  action      String   // Action allowed (create, read, update, delete)
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  roles RolePermission[]

  @@index([resource, action])
  @@map("permissions")
}
```

#### Fields

- `id`: Unique identifier for the permission (UUID)
- `name`: Permission name (unique)
- `resource`: Resource the permission applies to
- `action`: Action allowed (create, read, update, delete)
- `description`: Permission description
- `createdAt`: Timestamp when the permission was created
- `updatedAt`: Timestamp when the permission was last updated

#### Relationships

- `roles`: One-to-many relationship with RolePermission

### User Role Model

```typescript
model UserRole {
  id        String   @id @default(uuid())
  userId    String
  roleId    String
  assignedAt DateTime @default(now())
  assignedBy String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@map("user_roles")
}
```

#### Fields

- `id`: Unique identifier for the user role (UUID)
- `userId`: Reference to the user
- `roleId`: Reference to the role
- `assignedAt`: Timestamp when the role was assigned
- `assignedBy`: Reference to the user who assigned the role

#### Relationships

- `user`: Many-to-one relationship with User
- `role`: Many-to-one relationship with Role

### Role Permission Model

```typescript
model RolePermission {
  id           String   @id @default(uuid())
  roleId       String
  permissionId String
  createdAt    DateTime @default(now())

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}
```

#### Fields

- `id`: Unique identifier for the role permission (UUID)
- `roleId`: Reference to the role
- `permissionId`: Reference to the permission
- `createdAt`: Timestamp when the permission was granted

#### Relationships

- `role`: Many-to-one relationship with Role
- `permission`: Many-to-one relationship with Permission

## Data Access Patterns

### Credit Operations

#### Check Balance
```typescript
async function getCreditBalance(userId: string): Promise<number> {
  const account = await prisma.creditAccount.findUnique({
    where: { userId },
    select: { balance: true }
  });
  
  return account?.balance || 0;
}
```

#### Deduct Credits
```typescript
async function deductCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: any
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Lock the credit account
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

    // Update balance
    await tx.creditAccount.update({
      where: { id: account.id },
      data: { balance: { decrement: amount } },
    });

    // Create transaction record
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

#### Add Credits
```typescript
async function addCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: any
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Find or create credit account
    let account = await tx.creditAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await tx.creditAccount.create({
        data: { userId, balance: 0 },
      });
    }

    // Update balance
    await tx.creditAccount.update({
      where: { id: account.id },
      data: { balance: { increment: amount } },
    });

    // Create transaction record
    await tx.creditTransaction.create({
      data: {
        accountId: account.id,
        amount,
        type: 'credit',
        reason,
        metadata,
      },
    });
  });
}
```

### User Operations

#### Create User
```typescript
async function createUser(userData: {
  email: string;
  passwordHash?: string;
  googleId?: string;
}): Promise<User> {
  const user = await prisma.user.create({
    data: userData,
    include: {
      roles: {
        include: {
          role: true
        }
      },
      creditAccount: true
    }
  });

  // Create credit account if it doesn't exist
  if (!user.creditAccount) {
    await prisma.creditAccount.create({
      data: {
        userId: user.id,
        balance: 0
      }
    });
  }

  return user;
}
```

### Role and Permission Operations

#### Check User Permission
```typescript
async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const userRole = await prisma.userRole.findFirst({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  if (!userRole) {
    return false;
  }

  return userRole.role.permissions.some(
    rp => rp.permission.resource === resource && 
          rp.permission.action === action
  );
}
```

### Usage Tracking

#### Log Usage
```typescript
async function logUsage(data: {
  userId: string;
  service: string;
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  metadata?: any;
}): Promise<void> {
  await prisma.usageLog.create({
    data
  });
}
```

#### Get Usage Statistics
```typescript
async function getUsageStats(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any> {
  const stats = await prisma.usageLog.groupBy({
    by: ['service'],
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    },
    _avg: {
      duration: true
    }
  });

  return stats;
}
```

## Database Indexes

The following indexes are defined to optimize query performance:

- `users`: Index on email field
- `credit_accounts`: Index on userId field
- `credit_transactions`: Composite index on accountId and createdAt
- `usage_logs`: Composite index on userId and createdAt
- `usage_logs`: Composite index on service and createdAt
- `roles`: Index on name field
- `permissions`: Composite index on resource and action
- `user_roles`: Unique index on userId and roleId
- `user_roles`: Index on userId field
- `user_roles`: Index on roleId field
- `role_permissions`: Unique index on roleId and permissionId
- `role_permissions`: Index on roleId field
- `role_permissions`: Index on permissionId field

## Data Validation

### Input Validation

All input data should be validated before database operations:

- Email addresses should be validated for format
- UUIDs should be validated for proper format
- Credit amounts should be positive integers
- Role names should be validated for uniqueness
- Permission names should be validated for uniqueness

### Business Logic Validation

- Credit balance should never go negative
- Users cannot be assigned duplicate roles
- Roles cannot be assigned duplicate permissions
- All transactions should have a valid reason
- Usage logs should have valid HTTP status codes

## Error Handling

### Common Errors

- `ACCOUNT_NOT_FOUND`: Credit account not found for user
- `INSUFFICIENT_CREDITS`: Not enough credits for operation
- `ROLE_NOT_FOUND`: Role not found
- `PERMISSION_NOT_FOUND`: Permission not found
- `USER_NOT_FOUND`: User not found
- `DUPLICATE_ROLE`: User already has this role
- `DUPLICATE_PERMISSION`: Role already has this permission

### Error Handling Strategy

All database operations should be wrapped in try-catch blocks to handle potential errors gracefully. Errors should be logged and appropriate error messages should be returned to the client.