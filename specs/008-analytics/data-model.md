# Analytics and Usage Tracking Data Model

## Overview

This document defines the data models for the Analytics and Usage Tracking system. The data models are implemented using Prisma ORM with PostgreSQL as the primary database and Redis for caching aggregations.

## Database Schema

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
  @@index([service, model, createdAt])
  @@map("usage_logs")
}
```

#### Fields

- `id`: Unique identifier for the usage log entry (UUID)
- `userId`: Reference to the user who made the request
- `service`: The AI service used (openai, claude, mcp, etc.)
- `model`: The specific AI model used (gpt-4, claude-3, etc.)
- `tokens`: Number of tokens consumed in the request
- `credits`: Number of credits consumed for the request
- `metadata`: Additional details in JSON format (request parameters, response details, etc.)
- `createdAt`: Timestamp when the usage was recorded

#### Relationships

- `user`: Many-to-one relationship with User

#### Indexes

- `userId, createdAt`: For querying user usage over time periods
- `service, createdAt`: For querying service usage over time periods
- `model, createdAt`: For querying model-specific usage over time periods
- `service, model, createdAt`: For querying specific service-model combinations

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
  avgResponseTime Float  @default(0)
  successRate   Float    @default(0)
  errorRate     Float    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, service, model, period, periodStart])
  @@index([service, period, periodStart])
  @@index([userId, period, periodStart])
  @@index([period, periodStart])
  @@map("aggregated_usage")
}
```

#### Fields

- `id`: Unique identifier for the aggregated usage entry (UUID)
- `userId`: Optional user ID for user-specific aggregations
- `service`: The AI service being aggregated
- `model`: Optional model name for model-specific aggregations
- `period`: Time period for the aggregation (hourly, daily, weekly, monthly)
- `periodStart`: Start time of the aggregation period
- `periodEnd`: End time of the aggregation period
- `totalTokens`: Total tokens consumed in the period
- `totalCredits`: Total credits consumed in the period
- `requestCount`: Total number of requests in the period
- `avgTokens`: Average tokens per request in the period
- `avgResponseTime`: Average response time in milliseconds
- `successRate`: Success rate as a percentage (0-100)
- `errorRate`: Error rate as a percentage (0-100)
- `createdAt`: Timestamp when the aggregation was created
- `updatedAt`: Timestamp when the aggregation was last updated

#### Indexes

- `userId, service, model, period, periodStart`: Unique constraint for specific aggregations
- `service, period, periodStart`: For querying service-level aggregations
- `userId, period, periodStart`: For querying user-level aggregations
- `period, periodStart`: For querying all aggregations by time period

### Performance Metrics Model

```typescript
model PerformanceMetrics {
  id             String   @id @default(uuid())
  service        String
  endpoint       String?
  period         String   // hourly, daily, weekly, monthly
  periodStart    DateTime
  periodEnd      DateTime
  avgResponseTime Float   @default(0)
  p50ResponseTime Float   @default(0)
  p95ResponseTime Float   @default(0)
  p99ResponseTime Float   @default(0)
  throughput     Float    @default(0)
  successRate    Float    @default(0)
  errorRate      Float    @default(0)
  totalRequests  Int      @default(0)
  errorCount     Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([service, endpoint, period, periodStart])
  @@index([service, period, periodStart])
  @@index([period, periodStart])
  @@map("performance_metrics")
}
```

#### Fields

- `id`: Unique identifier for the performance metrics entry (UUID)
- `service`: The AI service being measured
- `endpoint`: Optional endpoint name for endpoint-specific metrics
- `period`: Time period for the metrics (hourly, daily, weekly, monthly)
- `periodStart`: Start time of the metrics period
- `periodEnd`: End time of the metrics period
- `avgResponseTime`: Average response time in milliseconds
- `p50ResponseTime`: 50th percentile response time
- `p95ResponseTime`: 95th percentile response time
- `p99ResponseTime`: 99th percentile response time
- `throughput`: Requests per second
- `successRate`: Success rate as a percentage (0-100)
- `errorRate`: Error rate as a percentage (0-100)
- `totalRequests`: Total number of requests
- `errorCount`: Total number of errors
- `createdAt`: Timestamp when the metrics were created
- `updatedAt`: Timestamp when the metrics were last updated

#### Indexes

- `service, endpoint, period, periodStart`: Unique constraint for specific metrics
- `service, period, periodStart`: For querying service-level metrics
- `period, periodStart`: For querying all metrics by time period

### Cost Analysis Model

```typescript
model CostAnalysis {
  id            String   @id @default(uuid())
  userId        String?
  service       String?
  model         String?
  period        String   // hourly, daily, weekly, monthly
  periodStart   DateTime
  periodEnd     DateTime
  totalCost     Int      @default(0)
  costPerToken  Float    @default(0)
  costPerRequest Float   @default(0)
  budget        Int?
  budgetUsage   Float    @default(0)
  trend         String?  // increasing, decreasing, stable
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, service, model, period, periodStart])
  @@index([service, period, periodStart])
  @@index([userId, period, periodStart])
  @@index([period, periodStart])
  @@map("cost_analysis")
}
```

#### Fields

- `id`: Unique identifier for the cost analysis entry (UUID)
- `userId`: Optional user ID for user-specific cost analysis
- `service`: Optional service name for service-specific cost analysis
- `model`: Optional model name for model-specific cost analysis
- `period`: Time period for the analysis (hourly, daily, weekly, monthly)
- `periodStart`: Start time of the analysis period
- `periodEnd`: End time of the analysis period
- `totalCost`: Total cost in credits for the period
- `costPerToken`: Average cost per token
- `costPerRequest`: Average cost per request
- `budget`: Optional budget for the period
- `budgetUsage`: Percentage of budget used (0-100)
- `trend`: Cost trend (increasing, decreasing, stable)
- `createdAt`: Timestamp when the analysis was created
- `updatedAt`: Timestamp when the analysis was last updated

#### Indexes

- `userId, service, model, period, periodStart`: Unique constraint for specific analysis
- `service, period, periodStart`: For querying service-level cost analysis
- `userId, period, periodStart`: For querying user-level cost analysis
- `period, periodStart`: For querying all cost analysis by time period

## Data Access Patterns

### Logging Usage

```typescript
async function logUsage(data: {
  userId: string;
  service: string;
  model: string;
  tokens: number;
  credits: number;
  metadata?: any;
}): Promise<void> {
  await prisma.usageLog.create({
    data,
  });

  // Trigger real-time aggregation update
  await updateAggregatedUsage(data);
}
```

### Querying User Usage

```typescript
async function getUserUsage(
  userId: string,
  startDate: Date,
  endDate: Date,
  filters?: {
    service?: string;
    model?: string;
  }
): Promise<any> {
  const where: any = {
    userId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (filters?.service) {
    where.service = filters.service;
  }

  if (filters?.model) {
    where.model = filters.model;
  }

  const usage = await prisma.usageLog.groupBy({
    by: ['service', 'model'],
    where,
    _sum: {
      tokens: true,
      credits: true,
    },
    _count: {
      id: true,
    },
  });

  return usage;
}
```

### Querying Aggregated Usage

```typescript
async function getAggregatedUsage(
  startDate: Date,
  endDate: Date,
  period: string,
  filters?: {
    userId?: string;
    service?: string;
    model?: string;
  }
): Promise<any> {
  const where: any = {
    period,
    periodStart: {
      gte: startDate,
    },
    periodEnd: {
      lte: endDate,
    },
  };

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.service) {
    where.service = filters.service;
  }

  if (filters?.model) {
    where.model = filters.model;
  }

  return await prisma.aggregatedUsage.findMany({
    where,
    orderBy: {
      periodStart: 'asc',
    },
  });
}
```

### Updating Aggregated Usage

```typescript
async function updateAggregatedUsage(data: {
  userId: string;
  service: string;
  model: string;
  tokens: number;
  credits: number;
}): Promise<void> {
  const now = new Date();
  const periods = ['hourly', 'daily', 'weekly', 'monthly'];

  for (const period of periods) {
    const { start, end } = getPeriodBounds(now, period);

    await prisma.aggregatedUsage.upsert({
      where: {
        userId_service_model_period_periodStart: {
          userId: data.userId,
          service: data.service,
          model: data.model,
          period,
          periodStart: start,
        },
      },
      update: {
        totalTokens: { increment: data.tokens },
        totalCredits: { increment: data.credits },
        requestCount: { increment: 1 },
        updatedAt: now,
      },
      create: {
        userId: data.userId,
        service: data.service,
        model: data.model,
        period,
        periodStart: start,
        periodEnd: end,
        totalTokens: data.tokens,
        totalCredits: data.credits,
        requestCount: 1,
      },
    });
  }
}

function getPeriodBounds(date: Date, period: string): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);

  switch (period) {
    case 'hourly':
      start.setMinutes(0, 0, 0);
      end.setHours(start.getHours() + 1);
      break;
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 1);
      break;
    case 'weekly':
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 7);
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1);
      break;
  }

  return { start, end };
}
```

## Database Optimization

### Partitioning

The `usage_logs` table should be partitioned by date to improve query performance:

```sql
-- Create partitioned table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  tokens INTEGER NOT NULL,
  credits INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE usage_logs_2025_01 PARTITION OF usage_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Materialized Views

Create materialized views for frequently accessed aggregations:

```sql
-- Daily usage by service
CREATE MATERIALIZED VIEW daily_service_usage AS
SELECT
  service,
  DATE(created_at) as date,
  SUM(tokens) as total_tokens,
  SUM(credits) as total_credits,
  COUNT(*) as request_count
FROM usage_logs
GROUP BY service, DATE(created_at);

-- Create unique index for refresh
CREATE UNIQUE INDEX idx_daily_service_usage_unique
  ON daily_service_usage (service, date);

-- Refresh materialized view
REFRESH MATERIALIZED VIEW daily_service_usage;
```

## Caching Strategy

### Redis Cache Structure

```
analytics:user:{userId}:{period}:{date} -> Aggregated user usage
analytics:service:{service}:{period}:{date} -> Aggregated service usage
analytics:model:{model}:{period}:{date} -> Aggregated model usage
analytics:performance:{service}:{period}:{date} -> Performance metrics
analytics:cost:{groupBy}:{period}:{date} -> Cost analysis
```

### Cache Implementation

```typescript
async function getCachedAnalytics(
  key: string,
  queryFn: () => Promise<any>,
  ttl: number = 3600
): Promise<any> {
  // Try to get from cache
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Execute query and cache result
  const result = await queryFn();
  await redis.setex(key, ttl, JSON.stringify(result));

  return result;
}
```

## Data Retention Policy

### Automated Cleanup

```typescript
async function cleanupOldData(): Promise<void> {
  const now = new Date();

  // Delete raw usage logs older than 90 days
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  await prisma.usageLog.deleteMany({
    where: {
      createdAt: {
        lt: ninetyDaysAgo,
      },
    },
  });

  // Delete hourly aggregations older than 1 year
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  await prisma.aggregatedUsage.deleteMany({
    where: {
      period: 'hourly',
      periodStart: {
        lt: oneYearAgo,
      },
    },
  });

  // Delete daily aggregations older than 3 years
  const threeYearsAgo = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
  await prisma.aggregatedUsage.deleteMany({
    where: {
      period: 'daily',
      periodStart: {
        lt: threeYearsAgo,
      },
    },
  });
}
```

## Error Handling

### Common Errors

- `INVALID_DATE_RANGE`: Invalid date range provided
- `INSUFFICIENT_PERMISSIONS`: User doesn't have permission to access analytics
- `AGGREGATION_IN_PROGRESS`: Aggregation is currently in progress
- `DATA_NOT_AVAILABLE`: Data is not available for the requested period

### Error Handling Strategy

All analytics operations should be wrapped in try-catch blocks to handle potential errors gracefully. Errors should be logged and appropriate error messages should be returned to the client.

## Performance Considerations

1. **Query Optimization**: Use appropriate indexes and query patterns
2. **Batch Processing**: Process aggregations in batches to avoid overwhelming the database
3. **Caching**: Cache frequently accessed data in Redis
4. **Partitioning**: Partition large tables by date for better performance
5. **Materialized Views**: Use materialized views for complex aggregations
6. **Connection Pooling**: Use connection pooling for database connections
7. **Async Processing**: Use background jobs for heavy computations
