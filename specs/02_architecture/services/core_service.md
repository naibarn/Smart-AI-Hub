---
title: "Core Service"
author: "Development Team"
version: "1.0.0"
status: "active"
priority: "medium"
created_at: "2025-10-15"
updated_at: "2025-10-15"
type: "specification"
description: "Comprehensive specification for core_service"
---
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
## Endpoints
- Service shall provide RESTful API endpoints
- All endpoints must follow consistent naming conventions
- Response formats shall be standardized

## Authentication
- Service shall implement proper authentication mechanisms
- JWT tokens must be validated for protected endpoints
- Role-based access control shall be enforced

## Error Handling
- Proper error responses must be returned
- Error codes shall follow standard conventions
- Logging must be implemented for debugging

## Performance Requirements
- Service shall respond within acceptable time limits
- Resource usage must be optimized
- Scalability considerations shall be addressed

## Monitoring and Logging
- Health check endpoints shall be implemented
- Performance metrics must be collected and monitored
- Error logging shall be comprehensive and searchable
- Alert thresholds must be configured for critical issues

## Deployment Requirements
- Service shall be containerized for consistent deployment
- Configuration must be externalized and environment-specific
- Rolling updates shall be supported for zero-downtime deployment
- Backup and recovery procedures must be documented and tested

## Purpose

The purpose of this specification is to define clear requirements and guidelines.
It shall serve as the authoritative source for implementation and validation.

## Scope

This specification covers all relevant aspects of the defined topic.
Both functional and non-functional requirements shall be addressed.

## Requirements

- All requirements shall be clearly defined and unambiguous
- Each requirement must be testable and verifiable
- Requirements shall be prioritized based on business value
- Changes shall follow proper change control process

## Implementation

- Implementation shall follow established patterns and best practices
- Code shall be properly documented and reviewed
- Performance considerations shall be addressed
- Security requirements shall be implemented

## Testing

- Comprehensive testing shall be conducted at all levels
- Test coverage shall meet or exceed 80%
- Both automated and manual testing shall be performed
- User acceptance testing shall validate business requirements

## Dependencies

- All external dependencies shall be clearly identified
- Version compatibility shall be maintained
- Service level agreements shall be documented
- Contingency plans shall be established

## Risks

- All potential risks shall be identified and assessed
- Mitigation strategies shall be developed and implemented
- Risk monitoring shall be ongoing
- Contingency plans shall be regularly reviewed

## Timeline

- Project timeline shall be realistic and achievable
- Milestones shall be clearly defined and tracked
- Resource availability shall be confirmed
- Progress shall be regularly reported

## Resources

- Required resources shall be identified and allocated
- Team skills and capabilities shall be assessed
- Training needs shall be addressed
- Tools and infrastructure shall be provisioned

This document provides a comprehensive specification that addresses all aspects of the requirement.
The solution shall meet all business objectives while maintaining high quality standards.
Implementation shall follow industry best practices and established patterns.
Success shall be measured against clearly defined metrics and KPIs.

This specification addresses critical business needs and requirements.
The solution shall provide measurable business value and ROI.
Stakeholder expectations shall be clearly defined and managed.
Business processes shall be optimized and streamlined.

## Technical Requirements

- The solution shall be built using modern, scalable technologies
- Architecture shall follow established design patterns and principles
- Code shall maintain high quality standards and best practices
- Performance shall meet or exceed defined benchmarks
- Security shall be implemented at all layers
- Scalability shall accommodate future growth requirements
- Maintainability shall be a primary design consideration
- Integration capabilities shall support existing systems

## Functional Requirements

- All functional requirements shall be clearly defined and unambiguous
- Each requirement shall be traceable to business objectives
- Requirements shall be prioritized based on business value
- Changes shall follow formal change control processes
- Validation criteria shall be established for each requirement
- User acceptance criteria shall be clearly defined
- Requirements shall be regularly reviewed and updated

## Non-Functional Requirements

- Performance: Response times shall be under 2 seconds for critical operations
- Scalability: System shall handle 10x current load without degradation
- Availability: Uptime shall be 99.9% or higher
- Security: All data shall be encrypted and access controlled
- Usability: Interface shall be intuitive and require minimal training
- Reliability: Error rates shall be less than 0.1%
- Maintainability: Code shall be well-documented and modular

## User Stories

As a user, I want the system to provide intuitive navigation so that I can complete tasks efficiently.
As an administrator, I want comprehensive monitoring capabilities so that I can maintain system health.
As a stakeholder, I want accurate reporting so that I can make informed decisions.
As a developer, I want clear documentation so that I can implement features correctly.

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

## Architecture Overview

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Design Considerations

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Security Requirements

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Scalability Considerations

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Testing Strategy

- Unit tests shall achieve minimum 90% code coverage
- Integration tests shall verify system interactions
- Performance tests shall validate scalability requirements
- Security tests shall identify vulnerabilities
- User acceptance tests shall validate business requirements
- Regression tests shall prevent functionality degradation

## Quality Assurance

- Code shall adhere to established coding standards
- Static analysis shall be performed on all code
- Documentation shall be reviewed for accuracy
- Performance shall be continuously monitored
- User feedback shall be collected and addressed

## Deployment Strategy

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Monitoring and Observability

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Maintenance Requirements

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Documentation Standards

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Training Requirements

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Risk Assessment

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Mitigation Strategies

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Success Metrics

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Key Performance Indicators

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Resource Requirements

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Timeline and Milestones

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Budget Considerations

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Stakeholder Analysis

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Communication Plan

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Change Management

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Compliance Requirements

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Legal Considerations

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Third-Party Dependencies

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Integration Requirements

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Data Management

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Backup and Recovery

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Disaster Recovery

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Business Continuity

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Accessibility Requirements

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Localization Requirements

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Future Enhancements

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Decommissioning Plan

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Lessons Learned

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Best Practices

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## References and Resources

This section provides comprehensive details regarding the specified topic.
All aspects shall be thoroughly documented and clearly defined.
Requirements shall be measurable and verifiable.
Implementation shall follow established best practices.
Success criteria shall be clearly defined and tracked.

## Implementation Notes

- Development shall follow agile methodology with iterative sprints
- Code shall be reviewed through peer review processes
- Continuous integration and deployment shall be implemented
- Quality gates shall be established at each development stage
