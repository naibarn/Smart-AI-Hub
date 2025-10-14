---
title: Core Service
author: Development Team
created_date: 2025-10-15
last_updated: 2025-10-15
version: 1.0.0
status: Draft
priority: P0
---

# Core Service

## 1. Overview

The Core Service handles the primary business logic of the Smart AI Hub platform, including user management, role-based access control, credit accounting, and usage analytics. It serves as the central hub for managing platform resources and user interactions, providing essential APIs for user operations, credit management, and business logic enforcement. The service ensures data consistency, implements business rules, and maintains the integrity of platform operations through atomic transactions and comprehensive validation.

## 2. Objectives

1. Provide comprehensive user management capabilities with CRUD operations
2. Implement robust role-based access control (RBAC) with permission hierarchy
3. Manage user credit accounts with atomic transaction processing
4. Track and analyze service usage for billing and analytics
5. Maintain promotional code system for marketing and user acquisition
6. Integrate with Sora2 video generation service through session-based authentication
7. Ensure data integrity through proper database transactions and validation
8. Provide high-performance APIs with caching and optimization strategies

## 3. User Stories

### Story 1: User Profile Management

As a registered user, I want to view and update my profile information, so that I can maintain accurate personal data and manage my account settings.

**Acceptance Criteria:**

1. Users must be able to view their profile information including email and roles
2. Users must be able to update their profile information with proper validation
3. Users must be able to view their credit balance and transaction history
4. Users must be able to view their usage statistics and limits
5. Profile updates must be validated and persisted atomically
6. Users must receive confirmation of successful profile updates
7. Profile changes must be logged for audit purposes

### Story 2: Credit Balance Management

As a platform user, I want to check my credit balance and transaction history, so that I can monitor my usage and manage my spending on the platform.

**Acceptance Criteria:**

1. Users must be able to view their current credit balance
2. Users must be able to view detailed transaction history with pagination
3. Transaction history must include amount, type, reason, and timestamp
4. Users must be able to filter transactions by date range and type
5. Balance updates must be reflected immediately after transactions
6. Transaction records must be immutable once created
7. Users must receive low balance alerts when credits are running low

### Story 3: Role and Permission Management

As an administrator, I want to manage user roles and permissions, so that I can control access to platform features and maintain security.

**Acceptance Criteria:**

1. Administrators must be able to assign roles to users
2. Role assignments must follow proper hierarchy and validation
3. Permission changes must take effect immediately
4. Role assignments must be logged for audit purposes
5. Users must be able to view their assigned roles and permissions
6. Role hierarchy must prevent privilege escalation
7. Permission caching must update when roles change

### Story 4: Promotional Code System

As a marketing manager, I want to create and manage promotional codes, so that I can attract new users and reward existing customers with credits.

**Acceptance Criteria:**

1. Marketing managers must be able to create promotional codes with specific values
2. Promotional codes must have expiration dates and usage limits
3. Users must be able to redeem promotional codes for credits
4. Redemption attempts must be validated and tracked
5. Expired or fully used codes must be rejected
6. Redemption history must be tracked for reporting
7. Promotional code usage must not exceed allocated limits

### Story 5: Usage Analytics and Reporting

As a platform administrator, I want to view usage analytics and generate reports, so that I can understand platform utilization and make informed business decisions.

**Acceptance Criteria:**

1. Administrators must be able to view aggregated usage statistics
2. Reports must be filterable by date range, user, and service type
3. Usage data must be collected accurately and in real-time
4. Reports must include credit consumption and transaction metrics
5. Analytics data must be retained for historical analysis
6. Report generation must be efficient for large datasets
7. Export functionality must be available for external analysis

## 4. Scope

### In Scope

1. User profile management with CRUD operations
2. Role-based access control implementation
3. Credit account management with atomic transactions
4. Transaction processing and history tracking
5. Usage analytics and reporting
6. Promotional code creation and redemption
7. Integration with Sora2 video generation service
8. Database schema management with Prisma ORM
9. Caching layer with Redis for performance
10. Audit logging for all data changes

### Out of Scope

1. User authentication and session management (handled by auth-service)
2. Payment processing for credit purchases
3. Email notification system for users
4. Advanced analytics and business intelligence
5. Machine learning for usage prediction
6. Multi-tenant architecture with data isolation
7. Real-time notifications and alerts
8. File storage and management
9. API versioning beyond basic implementation
10. Advanced search and filtering capabilities

## 5. Technical Requirements

### 5.1. Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Port**: 3002
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+

### 5.2. Database Schema

#### User Model

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

#### Credit Account Model

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

#### Credit Transaction Model

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

### 5.3. Core Business Logic

#### Credit Deduction with Atomic Transactions

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

### 5.4. API Endpoints

#### User Management

```
GET /api/users/profile          // Get current user profile
PUT /api/users/profile          // Update user profile
GET /api/users/:id              // Get user by ID (admin only)
PUT /api/users/:id/roles        // Update user roles (admin only)
```

#### Credit Management

```
GET /api/credits/balance        // Get credit balance
POST /api/credits/deduct        // Deduct credits
GET /api/credits/transactions   // Get transaction history
POST /api/credits/add           // Add credits (admin only)
```

#### Promotional Codes

```
POST /api/promos/create         // Create promo code (admin only)
POST /api/promos/redeem         // Redeem promo code
GET /api/promos/:id             // Get promo code details
GET /api/promos/list            // List active promo codes
```

#### Usage Analytics

```
GET /api/usage/summary          // Get usage summary
GET /api/usage/reports          // Generate usage reports
GET /api/usage/metrics          // Get usage metrics
```

### 5.5. Security Requirements

1. **RBAC Implementation**: Role-based access control for all endpoints
2. **Input Validation**: Comprehensive validation for all API inputs
3. **Audit Logging**: Log all data changes with user context
4. **SQL Injection Prevention**: Using Prisma ORM for safe queries
5. **Rate Limiting**: Protect sensitive operations from abuse
6. **Data Encryption**: Sensitive data encrypted at rest

### 5.6. Performance Requirements

1. **Response Time**: API responses under 200ms for 95% of requests
2. **Database Optimization**: Efficient queries with proper indexing
3. **Caching Strategy**: Redis caching for frequently accessed data
4. **Connection Pooling**: Optimize database connection management
5. **Pagination**: Efficient pagination for large result sets

## 6. Testing Criteria

### 6.1. Unit Tests

1. Test user profile CRUD operations
2. Test credit deduction with atomic transactions
3. Test role assignment and permission validation
4. Test promotional code creation and redemption
5. Test usage calculation and aggregation
6. Test input validation and error handling
7. Test database transaction rollback scenarios

### 6.2. Integration Tests

1. Test complete user workflow from registration to credit usage
2. Test credit transaction flow with proper balance updates
3. Test role-based access control across all endpoints
4. Test promotional code lifecycle from creation to redemption
5. Test usage analytics accuracy and reporting
6. Test database transaction consistency
7. Test cache invalidation and updates

### 6.3. Performance Tests

1. Load testing with high volume of user operations
2. Stress testing credit transaction processing
3. Concurrent user access and transaction handling
4. Database performance under heavy load
5. Cache performance and hit ratio testing
6. API response time benchmarking

### 6.4. Security Tests

1. Test RBAC enforcement across all endpoints
2. Test input validation against injection attacks
3. Test privilege escalation prevention
4. Test audit logging completeness
5. Test data access controls and permissions
6. Test authentication bypass attempts

### 6.5. End-to-End Tests

1. Complete user journey with credit usage
2. Role-based feature access testing
3. Promotional code redemption workflow
4. Usage reporting and analytics verification
5. Multi-user concurrent operations
6. System integration with other services

## 7. Dependencies and Assumptions

### Dependencies

1. **PostgreSQL**: Primary database for data persistence
2. **Redis**: Caching layer for performance optimization
3. **Prisma ORM**: Database access and schema management
4. **Authentication Service**: User verification and token validation
5. **MCP Server**: Integration for AI model usage tracking
6. **Payment System**: Credit purchase processing

### Assumptions

1. PostgreSQL database is available and properly configured
2. Redis cluster is available for caching operations
3. Authentication service provides reliable user validation
4. Payment system integration is available for credit purchases
5. MCP server provides accurate usage data for billing
6. Network connectivity between services is reliable

## 8. Non-Functional Requirements

### Availability

- Service must maintain 99.9% uptime
- Graceful degradation when database is unavailable
- Automatic failover and recovery mechanisms
- Health check endpoints for monitoring

### Performance

- API responses under 200ms for 95% of requests
- Support at least 1000 concurrent users
- Database transactions complete under 100ms
- Cache hit ratio above 90%

### Security

- All data access properly authorized
- Sensitive data encrypted at rest
- Comprehensive audit logging
- Regular security assessments

### Scalability

- Horizontal scaling through container orchestration
- Database sharding capability for large datasets
- Efficient resource utilization
- Auto-scaling based on load metrics

### Maintainability

- Clean, well-documented code following best practices
- Comprehensive test coverage
- Modular architecture for easy updates
- Configuration management for different environments

## 9. Acceptance Criteria

1. **Functional Requirements**
   - User profile management works correctly
   - Credit transactions are processed atomically
   - Role-based access control is properly enforced
   - Promotional codes work as designed
   - Usage analytics provide accurate insights

2. **Performance Requirements**
   - API responses are under 200ms
   - Database operations are efficient
   - Caching improves performance significantly
   - System handles expected load

3. **Security Requirements**
   - Access control is properly enforced
   - Data changes are audited
   - Input validation prevents attacks
   - Sensitive data is protected

4. **Reliability Requirements**
   - Service maintains high availability
   - Data consistency is preserved
   - Error handling is comprehensive
   - Monitoring provides visibility

## 10. Risks and Mitigation

### High Priority Risks

1. **Data Corruption**: Concurrent credit transactions could lead to inconsistency
   - Mitigation: Implement proper database transactions and locking

2. **Performance Bottlenecks**: High volume of transactions could slow down the system
   - Mitigation: Implement caching, optimization, and horizontal scaling

3. **Security Breaches**: Unauthorized access could compromise user data
   - Mitigation: Implement comprehensive security measures and regular audits

### Medium Priority Risks

1. **Database Failure**: Database unavailability could affect all operations
   - Mitigation: Implement database replication and failover mechanisms

2. **Cache Inconsistency**: Cache invalidation issues could serve stale data
   - Mitigation: Implement proper cache invalidation strategies

### Low Priority Risks

1. **Reporting Accuracy**: Complex analytics queries could have performance issues
   - Mitigation: Implement data warehousing for analytics queries

## 11. Timeline and Milestones

### Phase 1: Core Implementation (3 weeks)

- User management APIs
- Credit management system
- Role-based access control
- Basic database schema

### Phase 2: Business Logic (2 weeks)

- Transaction processing
- Promotional code system
- Usage tracking
- Performance optimization

### Phase 3: Analytics and Reporting (2 weeks)

- Usage analytics implementation
- Reporting system
- Performance tuning
- Comprehensive testing

### Phase 4: Integration and Deployment (1 week)

- Service integration testing
- Production deployment
- Monitoring setup
- Documentation completion

## 12. Sign-off

**Product Owner:** ********\_******** Date: ****\_****

**Tech Lead:** ********\_******** Date: ****\_****

**QA Lead:** ********\_******** Date: ****\_****

**DevOps Lead:** ********\_******** Date: ****\_****
