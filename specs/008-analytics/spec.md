---
title: 'Analytics and Usage Tracking'
author: 'Development Team'
version: '1.0.0'
status: 'active'
priority: 'high'
created_at: '2025-01-15'
updated_at: '2025-01-15'
type: 'specification'
description: 'Comprehensive specification for analytics and usage tracking system'
spec_id: 'FEAT-005'
---

# Analytics and Usage Tracking

## Overview

The Analytics and Usage Tracking system provides comprehensive monitoring and analysis capabilities for the Smart AI Hub platform. It tracks user interactions, service usage patterns, token consumption, and provides insights for both users and administrators to optimize platform usage and resource allocation.

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+ for aggregation queries
- **Analytics Engine**: Custom aggregation service with time-series capabilities

## Components

- **Usage Logger**: Service for capturing all user interactions and API calls
- **Aggregation Service**: Background service for processing and aggregating usage data
- **Analytics API**: RESTful endpoints for querying analytics data
- **Dashboard Service**: Frontend components for visualizing analytics
- **Report Generator**: Service for generating periodic reports

## Data Model

### Usage Log Model

```typescript
model UsageLog {
  id         String   @id @default(uuid())
  userId     String
  service    String   // openai, claude, mcp, etc.
  model      String   // gpt-4, claude-3, etc.
  tokens     Int      // Number of tokens used
  credits    Int      // Credits consumed
  metadata   Json?    // Additional usage details
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([service, createdAt])
  @@index([model, createdAt])
  @@map("usage_logs")
}
```

### Aggregated Usage Model

```typescript
model AggregatedUsage {
  id            String   @id @default(uuid())
  userId        String?
  service       String
  model         String?
  period        String   // hourly, daily, weekly, monthly
  periodStart   DateTime
  periodEnd     DateTime
  totalTokens   Int      @default(0)
  totalCredits  Int      @default(0)
  requestCount  Int      @default(0)
  avgTokens     Float    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, service, model, period, periodStart])
  @@index([service, period, periodStart])
  @@index([userId, period, periodStart])
  @@map("aggregated_usage")
}
```

## Analytics Features

### Real-time Usage Tracking

- **Token Counting**: Accurate tracking of tokens consumed for each API call
- **Credit Calculation**: Real-time calculation of credits based on token usage
- **Service Identification**: Tracking usage across different AI services
- **Model Differentiation**: Separate tracking for different AI models

### Usage Analytics

- **Per-user Analytics**: Individual usage patterns and trends
- **Service Analytics**: Usage breakdown by AI service
- **Model Analytics**: Performance and usage by specific models
- **Time-based Analytics**: Hourly, daily, weekly, and monthly usage trends

### Cost Analysis

- **Cost per User**: Track credit consumption per user
- **Cost per Service**: Analyze costs across different AI services
- **Cost per Model**: Compare efficiency of different AI models
- **Cost Trends**: Identify cost patterns over time

### Performance Metrics

- **Response Time Tracking**: Monitor API response times
- **Success Rate Analysis**: Track success/failure rates
- **Error Analysis**: Categorize and analyze error patterns
- **Throughput Metrics**: Measure request throughput

## API Endpoints

### Get User Usage

```
GET /api/analytics/usage/{userId}
Query Parameters:
- startDate: ISO date string (required)
- endDate: ISO date string (required)
- service: Filter by service (optional)
- model: Filter by model (optional)
- granularity: hourly, daily, weekly, monthly (default: daily)

Response:
{
  "userId": "uuid",
  "period": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "totalTokens": 100000,
  "totalCredits": 5000,
  "totalRequests": 250,
  "breakdown": [
    {
      "service": "openai",
      "model": "gpt-4",
      "tokens": 60000,
      "credits": 3000,
      "requests": 150
    }
  ],
  "timeline": [
    {
      "date": "2025-01-01",
      "tokens": 2000,
      "credits": 100,
      "requests": 5
    }
  ]
}
```

### Get Service Analytics

```
GET /api/analytics/services/{service}
Query Parameters:
- startDate: ISO date string (required)
- endDate: ISO date string (required)
- model: Filter by model (optional)
- granularity: hourly, daily, weekly, monthly (default: daily)

Response:
{
  "service": "openai",
  "period": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "totalTokens": 1000000,
  "totalCredits": 50000,
  "totalRequests": 2500,
  "uniqueUsers": 100,
  "models": [
    {
      "model": "gpt-4",
      "tokens": 600000,
      "credits": 30000,
      "requests": 1500,
      "users": 80
    }
  ]
}
```

### Get Cost Analysis

```
GET /api/analytics/costs
Query Parameters:
- startDate: ISO date string (required)
- endDate: ISO date string (required)
- groupBy: user, service, model (default: service)
- granularity: hourly, daily, weekly, monthly (default: daily)

Response:
{
  "period": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "totalCost": 50000,
  "breakdown": [
    {
      "group": "openai",
      "cost": 30000,
      "percentage": 60,
      "trend": "+5%"
    }
  ]
}
```

### Get Performance Metrics

```
GET /api/analytics/performance
Query Parameters:
- startDate: ISO date string (required)
- endDate: ISO date string (required)
- service: Filter by service (optional)
- endpoint: Filter by endpoint (optional)

Response:
{
  "period": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "metrics": {
    "avgResponseTime": 1250,
    "p95ResponseTime": 2500,
    "p99ResponseTime": 5000,
    "successRate": 99.5,
    "errorRate": 0.5,
    "throughput": 100
  },
  "timeline": [
    {
      "timestamp": "2025-01-01T12:00:00Z",
      "avgResponseTime": 1200,
      "successRate": 99.8
    }
  ]
}
```

## Data Aggregation Strategy

### Real-time Aggregation

- **Immediate Processing**: Log entries are processed immediately for real-time insights
- **Redis Caching**: Frequently accessed aggregations are cached in Redis
- **Incremental Updates**: Aggregations are updated incrementally to minimize compute overhead

### Batch Processing

- **Hourly Jobs**: Process detailed aggregations for the previous hour
- **Daily Jobs**: Generate daily summaries and trend analysis
- **Weekly Jobs**: Create weekly reports and identify patterns
- **Monthly Jobs**: Generate monthly reports and business insights

### Data Retention

- **Raw Logs**: Retain for 90 days
- **Hourly Aggregations**: Retain for 1 year
- **Daily Aggregations**: Retain for 3 years
- **Weekly/Monthly Aggregations**: Retain indefinitely

## Security and Privacy

### Data Protection

- **User Privacy**: Sensitive user data is anonymized for analytics
- **Access Control**: Role-based access to analytics data
- **Data Encryption**: All analytics data is encrypted at rest
- **Audit Logging**: All access to analytics is logged and audited

### Compliance

- **GDPR Compliance**: User data handling follows GDPR requirements
- **Data Minimization**: Only necessary data is collected for analytics
- **User Consent**: Users can opt-out of detailed analytics
- **Data Portability**: Users can request their analytics data

## Performance Optimization

### Database Optimization

- **Partitioning**: Usage logs are partitioned by date for efficient querying
- **Indexing Strategy**: Optimized indexes for common query patterns
- **Materialized Views**: Pre-computed aggregations for frequently accessed data

### Caching Strategy

- **Query Caching**: Results of common queries are cached
- **Aggregate Pre-computation**: Aggregations are pre-computed and cached
- **CDN Integration**: Static reports are served via CDN

## Monitoring and Alerting

### System Monitoring

- **Query Performance**: Monitor slow queries and optimize them
- **Data Freshness**: Ensure aggregations are up-to-date
- **Storage Usage**: Monitor storage consumption and plan capacity
- **Error Rates**: Track errors in data collection and processing

### Business Alerts

- **Usage Spikes**: Alert on unusual usage patterns
- **Cost Thresholds**: Alert when costs exceed predefined thresholds
- **Performance Degradation**: Alert on performance issues
- **Data Quality**: Alert on data quality issues

## Integration Points

- **Core Service**: Receives usage data from service interactions
- **API Gateway**: Captures request/response data for analytics
- **Authentication Service**: Provides user context for usage tracking
- **Billing System**: Provides cost data for usage analysis
- **Notification Service**: Sends alerts and reports

## Acceptance Criteria

- All API endpoints must respond within 2 seconds for standard queries
- Real-time usage data must be available within 5 seconds of occurrence
- Aggregated data must be accurate within 1% margin of error
- System must handle 10x current load without performance degradation
- All analytics data must be compliant with privacy regulations
- Users must be able to access their own usage data at any time
- Administrators must have access to comprehensive analytics dashboards
- System must generate automated reports on schedule

## Implementation Approach

- Development shall follow agile methodology with iterative sprints
- Analytics implementation shall be phased by priority
- Performance testing shall be conducted at each phase
- Security review shall be conducted before production deployment
- User acceptance testing shall validate business requirements
