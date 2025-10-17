---
title: "Points System Specification"
author: "Development Team"
version: "1.0.0"
status: "draft"
priority: "high"
created_at: "2025-10-16"
updated_at: "2025-10-16"
type: "specification"
description: "Comprehensive specification for the Smart AI Hub Points System"
---

# Points System Specification

## 1. Overview

The Smart AI Hub Points System is a comprehensive virtual currency and rewards platform designed to enhance user engagement and provide flexible payment options for platform services. The system operates as a complementary currency to the existing Credits system, allowing users to earn, purchase, and utilize points for various platform activities. This system implements a sophisticated economy with automated features including auto top-up functionality, daily login rewards, and configurable exchange rates. The Points System is built with transaction integrity, performance optimization, and comprehensive audit trails as core architectural principles, ensuring reliable operation at scale while maintaining complete transparency of all point movements and balances.

## 2. Objectives

The primary objectives of the Points System are to increase user engagement through gamification elements, provide an alternative payment method for platform services, create a flexible virtual economy that can adapt to business needs, and implement seamless integration with existing payment systems. The system aims to reduce friction in the user experience by automating common tasks like balance management through features such as auto top-up when points run low. Additionally, the system is designed to provide comprehensive analytics and reporting capabilities for administrators to understand usage patterns and optimize the virtual economy. The implementation must ensure high availability, data consistency, and security while maintaining performance standards suitable for a production environment with potentially millions of transactions.

## 3. User Stories

As a platform user, I want to earn points through daily logins so that I can maintain a balance for using platform services without additional cost. As a user, I want my points to automatically convert from credits when my balance runs low so that I don't experience interruptions during critical tasks. As a platform user, I want to purchase points with real money so that I can access premium features when my credits are insufficient. As a user, I want to view my complete transaction history so that I can track how I've earned and spent my points. As an administrator, I want to configure exchange rates and thresholds so that I can adjust the virtual economy based on business needs. As a user, I want to receive notifications when auto top-up occurs so that I'm aware of my credit deductions. As an administrator, I want to adjust user point balances manually so that I can resolve issues and provide customer support.

## 4. Scope

The Points System includes point account management for all users, transaction tracking and history with complete audit trails, balance calculation with Redis caching for performance, integration with the existing Credits system for auto top-up functionality, daily login rewards with timezone-aware calculations, configurable exchange rates for credits-to-points and money-to-points conversions, purchase functionality with Stripe payment integration, and comprehensive administrative tools for management and analytics. The system excludes direct point transfers between users, point expiration policies, point-based subscription models, integration with external loyalty programs, and advanced gamification features like leaderboards or achievements. These exclusions are intentional to maintain focus on core functionality while allowing for future enhancements based on user feedback and business requirements.

## 5. Functional Requirements

### 5.1 Point Account Management
- Every user must have a point account created automatically upon registration
- Point accounts must maintain a running balance with transaction history
- Balance queries must return real-time data with sub-second response times
- Point accounts must support both positive and zero balances (no negative balances)

### 5.2 Transaction Processing
- All point transactions must be atomic and consistent
- Each transaction must include user ID, amount, type, description, and timestamp
- Transaction types must include: purchase, usage, exchange_from_credit, auto_topup_from_credit, daily_reward, admin_adjustment, and refund
- Transaction history must be queryable with pagination support
- All transactions must be immutable once created

### 5.3 Auto Top-up Feature
- System must automatically trigger when user points ≤ 10 (configurable threshold)
- Auto top-up must deduct 1 Credit and add 1,000 Points (configurable exchange rate)
- Auto top-up events must be logged in AutoTopupLog table with complete before/after balance information
- Auto top-up must only occur if user has sufficient credits
- Users must be notified when auto top-up occurs

### 5.4 Daily Login Rewards
- Users must be able to claim points once per calendar day based on their timezone
- Daily reward amount must be configurable (default: 50 points)
- System must prevent duplicate claims on the same day
- Daily reward claims must be tracked in DailyLoginReward table
- System must calculate next claim date based on user timezone

### 5.5 Exchange Rate Management
- Exchange rates must be configurable by administrators
- System must support credit-to-points and money-to-points exchange rates
- Exchange rate changes must be logged with timestamps
- Exchange rates must be cached in Redis for performance (5-minute cache)
- Default rates: 1 Credit = 1,000 Points, 10,000 Points = 1 USD

### 5.6 Point Purchase
- Users must be able to purchase points using Stripe payment integration
- Purchase transactions must be atomic with payment processing
- Receipt generation must occur for all successful purchases
- Refund scenarios must be supported with proper point deduction
- Purchase amounts must be validated as positive integers

### 5.7 Administrative Functions
- Administrators must be able to manually adjust user point balances
- All administrative actions must require a reason and be logged
- System must provide comprehensive statistics on point usage
- Administrative interface must include user management capabilities
- Audit trail must be maintained for all admin actions

## 6. Non-Functional Requirements

### 6.1 Performance Requirements
- Balance queries must respond within 100ms (95th percentile)
- Transaction processing must complete within 200ms
- System must support 10,000 transactions per minute
- Cache hit rate for balance queries must exceed 95%
- Database queries must be optimized with proper indexing

### 6.2 Security Requirements
- All point transactions must be authenticated and authorized
- Point balances must be protected against unauthorized modifications
- Administrative functions must require elevated permissions
- All sensitive operations must be logged for audit purposes
- System must implement rate limiting to prevent abuse

### 6.3 Scalability Requirements
- System must handle 1 million active user accounts
- Database must support 100 million transaction records
- Architecture must support horizontal scaling of services
- Redis caching must handle concurrent access without performance degradation
- System must maintain performance during peak usage periods

### 6.4 Reliability Requirements
- System uptime must be 99.9% or higher
- Transaction integrity must be maintained even during system failures
- Point balances must never be lost due to system errors
- System must recover gracefully from database connection failures
- Auto top-up functionality must work even during high load periods

### 6.5 Data Consistency Requirements
- Point balances must remain consistent across all operations
- Concurrent transactions must not result in balance inconsistencies
- Transaction history must be immutable and complete
- System must implement proper database transaction isolation
- Cache invalidation must occur immediately after balance changes

## 7. Data Models

### 7.1 PointAccount Model
```typescript
interface PointAccount {
  userId: string;          // Primary key, references User.id
  balance: number;         // Current point balance (non-negative integer)
  createdAt: Date;         // Account creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```
The PointAccount model represents a user's point balance and is created automatically when a user registers. The balance field is maintained as a non-negative integer and is updated through all point transactions.

### 7.2 PointTransaction Model
```typescript
interface PointTransaction {
  id: string;              // Unique transaction identifier
  userId: string;          // References User.id
  type: PointTransactionType; // Transaction category
  amount: number;          // Positive for additions, negative for deductions
  balanceAfter: number;    // Balance after this transaction
  description?: string;    // Human-readable description
  metadata: Json;          // Additional transaction data
  createdAt: Date;         // Transaction timestamp
}
```
The PointTransaction model records all point movements with complete audit trail information. Each transaction is immutable and includes the balance after the transaction to enable historical balance reconstruction.

### 7.3 ExchangeRate Model
```typescript
interface ExchangeRate {
  id: string;              // Unique rate identifier
  name: string;            // Rate name (e.g., 'credit_to_points')
  rate: number;            // Exchange rate value
  description?: string;    // Rate description
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```
The ExchangeRate model stores configurable exchange rates used throughout the system. Rates are cached in Redis for performance but always authoritative in the database.

### 7.4 DailyLoginReward Model
```typescript
interface DailyLoginReward {
  id: string;              // Unique reward identifier
  userId: string;          // References User.id
  rewardDate: Date;        // Date of reward (YYYY-MM-DD format)
  points: number;          // Points awarded
  claimedAt: Date;         // Claim timestamp
}
```
The DailyLoginReward model tracks daily reward claims to prevent duplicate claims on the same day. The composite unique constraint on userId and rewardDate enforces business rules.

### 7.5 AutoTopupLog Model
```typescript
interface AutoTopupLog {
  id: string;              // Unique log identifier
  userId: string;          // References User.id
  creditsDeducted: number; // Credits deducted for top-up
  pointsAdded: number;     // Points added to account
  triggerReason: string;   // Reason for auto top-up
  balanceBefore: Json;     // Balance snapshot before top-up
  balanceAfter: Json;      // Balance snapshot after top-up
  createdAt: Date;         // Auto top-up timestamp
}
```
The AutoTopupLog model records all automatic top-up events with complete before/after balance information for audit purposes and user transparency.

## 8. API Specifications

### 8.1 User Balance API
**Endpoint:** `GET /api/v1/points/balance`  
**Authentication:** Required (JWT token)  
**Description:** Retrieves the current point balance for the authenticated user  
**Response:**
```json
{
  "balance": 1500,
  "lastUpdate": "2025-10-16T14:00:00Z"
}
```

### 8.2 Transaction History API
**Endpoint:** `GET /api/v1/points/history`  
**Authentication:** Required (JWT token)  
**Parameters:** page (integer, default: 1), limit (integer, default: 20, max: 100)  
**Description:** Retrieves paginated transaction history for the authenticated user  
**Response:**
```json
{
  "data": [
    {
      "id": "txn_123",
      "amount": 1000,
      "type": "auto_topup_from_credit",
      "description": "Auto top-up: 1 Credit → 1000 Points",
      "balanceAfter": 1500,
      "createdAt": "2025-10-16T13:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### 8.3 Credit Exchange API
**Endpoint:** `POST /api/v1/points/exchange-from-credits`  
**Authentication:** Required (JWT token)  
**Request Body:**
```json
{
  "creditAmount": 5
}
```
**Response:**
```json
{
  "newCreditBalance": 45,
  "newPointBalance": 6500,
  "pointsReceived": 5000,
  "message": "Successfully exchanged 5 credits for 5000 points"
}
```

### 8.4 Point Purchase API
**Endpoint:** `POST /api/v1/points/purchase`  
**Authentication:** Required (JWT token)  
**Request Body:**
```json
{
  "pointsAmount": 10000,
  "paymentDetails": {
    "stripeSessionId": "cs_123456",
    "amount": 100
  }
}
```
**Response:**
```json
{
  "newBalance": 11500,
  "transactionId": "txn_456",
  "message": "Successfully purchased 10000 points"
}
```

### 8.5 Daily Reward Claim API
**Endpoint:** `POST /api/v1/points/claim-daily-reward`  
**Authentication:** Required (JWT token)  
**Response:**
```json
{
  "points": 50,
  "message": "Successfully claimed 50 points as your daily reward!"
}
```

### 8.6 Daily Reward Status API
**Endpoint:** `GET /api/v1/points/daily-reward-status`  
**Authentication:** Required (JWT token)  
**Response:**
```json
{
  "canClaim": false,
  "nextClaimDate": "2025-10-17T00:00:00Z",
  "lastClaimDate": "2025-10-16T08:30:00Z",
  "rewardAmount": 50
}
```

### 8.7 Point Deduction API
**Endpoint:** `POST /api/v1/points/deduct`  
**Authentication:** X-User-ID header required  
**Request Body:**
```json
{
  "amount": 100,
  "description": "AI model usage",
  "metadata": {
    "model": "claude-3",
    "tokens": 1000
  }
}
```
**Response:**
```json
{
  "status": "ok",
  "new_balance": 1400,
  "transaction_id": "txn_789",
  "autoTopupTriggered": false
}
```

### 8.8 Admin Point Adjustment API
**Endpoint:** `POST /api/v1/admin/points/adjust`  
**Authentication:** Required (admin permissions)  
**Request Body:**
```json
{
  "userId": "user_123",
  "amount": 500,
  "reason": "Customer service compensation"
}
```
**Response:**
```json
{
  "newBalance": 2000,
  "message": "Points adjusted successfully"
}
```

### 8.9 Admin Exchange Rate Management API
**Endpoint:** `GET /api/v1/admin/exchange-rates`  
**Authentication:** Required (admin permissions)  
**Response:**
```json
[
  {
    "id": "rate_1",
    "name": "credit_to_points",
    "rate": 1000,
    "description": "Exchange rate for credits to points"
  }
]
```

**Endpoint:** `PUT /api/v1/admin/exchange-rates/:name`  
**Authentication:** Required (admin permissions)  
**Request Body:**
```json
{
  "rate": 1200,
  "description": "Updated exchange rate for credits to points"
}
```

### 8.10 Admin Statistics API
**Endpoint:** `GET /api/v1/admin/points/stats`  
**Authentication:** Required (admin permissions)  
**Response:**
```json
{
  "totalPoints": 5000000,
  "totalUsers": 10000,
  "activeUsers": 7500,
  "averageBalance": 500,
  "totalTransactions": 150000
}
```

## 9. Business Logic

### 9.1 Balance Management
The Points System maintains user balances through a combination of database records and Redis caching. When a balance query is received, the system first checks the Redis cache for a valid entry. If found, the cached value is returned; otherwise, the database is queried and the result is cached for 60 seconds. All balance modifications are performed within database transactions to ensure consistency, and the cache is immediately invalidated after any balance change.

### 9.2 Transaction Processing
All point transactions are processed through a unified transaction service that ensures atomicity and consistency. Each transaction includes the user ID, amount (positive for additions, negative for deductions), transaction type, description, and metadata. The system validates that the resulting balance will never be negative before applying the transaction. Upon completion, the transaction record is created with the balance after the transaction, and the user's cached balance is invalidated.

### 9.3 Auto Top-up Logic
The auto top-up mechanism is triggered before any point deduction that would result in a balance below the configured threshold (default: 10 points). The system checks if the user has sufficient credits to cover the auto top-up amount (default: 1 credit). If conditions are met, a database transaction is initiated that deducts the required credits, adds the corresponding points (credit amount × exchange rate), and records the auto top-up event in the AutoTopupLog table with complete before/after balance information.

### 9.4 Daily Reward Calculation
Daily rewards are calculated based on the user's timezone setting, which defaults to UTC if not specified. The system determines the current date in the user's timezone and checks if a reward has already been claimed for that date by querying the DailyLoginReward table. If no claim exists for the current date, the user may claim the configured reward amount, and a new record is created to prevent duplicate claims.

### 9.5 Exchange Rate Application
Exchange rates are applied consistently throughout the system using values from the ExchangeRate table. Rates are cached in Redis for 5 minutes to improve performance while allowing for timely updates. When an exchange rate is not found in the database, the system falls back to environment variable defaults to ensure continuous operation. All rate changes are immediately reflected in the cache through explicit invalidation.

## 10. Security Considerations

### 10.1 Authentication and Authorization
All Points System APIs require proper authentication through JWT tokens for user operations or administrative credentials for management functions. The system validates token signatures, expiration dates, and user permissions before processing any request. Administrative functions require elevated permissions and are logged with the administrator's identity for audit purposes.

### 10.2 Transaction Security
Point transactions are protected against unauthorized modifications through comprehensive authorization checks. The system validates that users can only modify their own point balances and that all transactions follow business rules. Critical operations like point deductions and administrative adjustments require additional validation to prevent abuse.

### 10.3 Data Protection
Sensitive point balance information is protected through access controls and audit logging. The system implements rate limiting on modification endpoints to prevent brute force attacks. All administrative actions require explicit reasons and are logged with complete context for security auditing.

### 10.4 Input Validation
All API inputs are rigorously validated to prevent injection attacks and ensure data integrity. Point amounts are validated as non-negative integers within reasonable bounds. User-provided descriptions are sanitized to prevent XSS attacks, and metadata fields are validated to ensure they contain properly structured JSON.

### 10.5 Audit Trail
The Points System maintains a comprehensive audit trail of all point movements and administrative actions. Transaction records are immutable once created and include complete context about the operation. Administrative actions are logged separately with additional detail about the administrator and justification for the action.

## 11. Error Handling

### 11.1 Insufficient Balance Errors
When a point deduction would result in a negative balance, the system returns a 402 Payment Required error with a clear message indicating insufficient points. The error response includes the current balance and the amount that was attempted to be deducted to help users understand the situation.

### 11.2 Auto Top-up Failures
If auto top-up fails due to insufficient credits or system errors, the system logs the failure and returns the original insufficient points error to the user. The error message indicates that auto top-up was attempted but unsuccessful, providing transparency about the system behavior.

### 11.3 Duplicate Daily Reward Claims
When a user attempts to claim a daily reward more than once per day, the system returns a 400 Bad Request error with a message indicating the reward has already been claimed. The error response includes the next available claim date to manage user expectations.

### 11.4 Invalid Exchange Rate Operations
Administrative attempts to set invalid exchange rates (zero or negative values) are rejected with a 400 Bad Request error. The system validates all rate changes before applying them and returns specific error messages about validation failures.

### 11.5 Payment Processing Failures
Point purchase failures due to payment processing issues are handled gracefully with appropriate error messages. The system ensures that points are not added to user accounts until payment confirmation is received from the payment processor.

### 11.6 Database Connection Errors
In the event of temporary database connectivity issues, the system implements retry logic with exponential backoff. If the database remains unavailable after multiple attempts, the system returns a 503 Service Unavailable error with a message indicating temporary system issues.

## 12. Performance Requirements

### 12.1 Response Time Requirements
Balance query operations must complete within 100ms for the 95th percentile of requests. Transaction processing operations must complete within 200ms for the 95th percentile. Administrative operations may have slightly higher response time requirements due to their complexity but should not exceed 500ms for typical operations.

### 12.2 Throughput Requirements
The system must support a sustained throughput of 10,000 point transactions per minute. During peak usage periods, the system must handle burst loads of up to 20,000 transactions per minute for short durations (up to 5 minutes) without performance degradation.

### 12.3 Caching Performance
Redis caching must achieve a hit rate of at least 95% for balance queries. Exchange rate queries must maintain a cache hit rate of at least 90% to reduce database load. Cache invalidation must occur within 100ms of balance modifications to ensure data consistency.

### 12.4 Database Performance
Database queries must be optimized with proper indexing on user IDs, transaction timestamps, and other frequently queried fields. The database must support concurrent access from multiple application instances without performance degradation. Connection pooling must be configured to handle the expected query load.

### 12.5 Scalability Performance
The system architecture must support horizontal scaling of application instances to handle increasing load. Database read operations must be able to scale through read replicas if necessary. Redis clustering must be supported to handle increased caching requirements as the user base grows.

## 13. Deployment Strategy

### 13.1 Environment Configuration
The Points System requires configuration of several environment variables for proper operation: `POINTS_DAILY_REWARD_AMOUNT` (default: 50), `POINTS_PER_CREDIT` (default: 1000), `POINTS_PER_USD` (default: 10000), `DAILY_REWARD_ENABLED` (default: true), `DAILY_REWARD_TIMEZONE` (default: UTC), `AUTO_TOPUP_ENABLED` (default: true), `AUTO_TOPUP_THRESHOLD` (default: 10), and `AUTO_TOPUP_AMOUNT_CREDITS` (default: 1). Redis connection must be configured through `REDIS_URL`.

### 13.2 Database Migration
Database schema changes must be applied through migration scripts that maintain backward compatibility. The migration process must include validation steps to ensure data integrity after schema changes. Rollback procedures must be tested and documented for all migrations.

### 13.3 Service Deployment
The Points System service should be deployed as part of the core service microservice architecture. Service health checks must be implemented to monitor proper operation. Deployment should follow a blue-green deployment strategy to minimize downtime during updates.

### 13.4 Redis Deployment
Redis must be deployed with appropriate memory allocation and persistence configuration. Redis clustering should be implemented for high availability and scalability. Regular backups of Redis data must be configured to prevent data loss.

### 13.5 Monitoring and Alerting
Comprehensive monitoring must be implemented for all Points System metrics, including transaction rates, error rates, and response times. Alerts must be configured for critical conditions such as database connectivity issues, Redis failures, or unusual transaction patterns.

## 14. Testing Strategy

### 14.1 Unit Testing
All service functions must have unit tests with a minimum code coverage of 90%. Tests must cover normal operation scenarios, edge cases, and error conditions. Mock implementations should be used for external dependencies like Redis and database connections to ensure test isolation.

### 14.2 Integration Testing
Integration tests must verify the interaction between the Points System and external dependencies including the database, Redis, and payment processor. Tests must validate transaction integrity, cache invalidation, and error handling scenarios. End-to-end transaction flows must be tested comprehensively.

### 14.3 Performance Testing
Load testing must be conducted to validate that the system meets the specified performance requirements under expected and peak loads. Stress testing should be performed to identify system breaking points and ensure graceful degradation. Database query performance must be validated with realistic data volumes.

### 14.4 Security Testing
Security testing must include validation of authentication and authorization mechanisms. Tests should verify that users cannot access other users' point balances or perform unauthorized administrative actions. Input validation should be tested to prevent injection attacks and other security vulnerabilities.

### 14.5 User Acceptance Testing
User acceptance testing must validate that the Points System meets business requirements and provides a positive user experience. Tests should include scenarios for point earning, spending, purchasing, and administrative management. Auto top-up functionality must be tested thoroughly to ensure reliable operation.

## 15. Documentation Requirements

### 15.1 API Documentation
Complete API documentation must be maintained using OpenAPI/Swagger specifications. Documentation must include all endpoints, request/response formats, authentication requirements, and error conditions. Example requests and responses should be provided for all APIs.

### 15.2 System Architecture Documentation
Architecture documentation must describe the Points System components, their interactions, and data flow. Documentation should include database schema diagrams, API interaction diagrams, and deployment architecture. Scalability and performance considerations must be documented.

### 15.3 Operational Documentation
Operational runbooks must be created for common operational tasks including deployment, monitoring, and troubleshooting. Documentation should include procedures for handling common errors, system recovery, and performance tuning. Contact information for escalation paths must be included.

### 15.4 User Documentation
User-facing documentation must explain how to earn, purchase, and use points within the platform. Documentation should include explanations of auto top-up functionality, daily rewards, and transaction history. Frequently asked questions should be maintained and updated based on user feedback.

### 15.5 Administrative Documentation
Administrative documentation must provide detailed instructions for managing the Points System including exchange rate configuration, user balance adjustments, and system monitoring. Documentation should include best practices for common administrative tasks and troubleshooting procedures.

## 16. Examples and Use Cases

### 16.1 New User Onboarding Flow
A new user registers for Smart AI Hub and automatically receives a point account with zero balance. The user logs in for the first time and claims their daily reward of 50 points. Later, when using an AI service that costs 100 points, the user's balance is insufficient, triggering auto top-up. The system automatically deducts 1 credit from the user's account and adds 1,000 points, then deducts the 100 points for the service usage. The user receives notifications about both the auto top-up and the service usage.

### 16.2 Point Purchase Flow
A user wants to purchase points to access premium features. They navigate to the purchase page and select to buy 10,000 points for $10. The system creates a Stripe checkout session, and the user completes the payment. Upon successful payment confirmation, the system adds 10,000 points to the user's account and records the transaction with the payment details. The user can immediately use their new points for platform services.

### 16.3 Administrative Adjustment Flow
An administrator receives a support ticket from a user who lost points due to a system error. After verifying the issue, the administrator uses the admin adjustment API to credit 500 points to the user's account with the reason "System error compensation". The system records the adjustment with the administrator's identity and the justification. The user's balance is immediately updated, and the adjustment appears in their transaction history.

### 16.4 Exchange Rate Configuration Flow
The business team decides to adjust the credit-to-points exchange rate from 1,000 to 1,200 points per credit to provide more value to users. An administrator updates the exchange rate through the admin API, and the system immediately applies the new rate to all future transactions. The previous rate is maintained in the audit trail, and users are notified of the change through a system announcement.

### 16.5 Daily Reward Claim Flow
A user logs into Smart AI Hub and sees a notification about their daily reward. They click to claim the reward, and the system checks if they have already claimed for the current date in their timezone. Since they haven't claimed yet, the system adds 50 points to their account and records the daily reward claim. The user's balance is updated, and they receive confirmation of the reward claim. The system updates their daily reward status to show they cannot claim again until tomorrow.