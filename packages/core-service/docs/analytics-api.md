# Analytics API Documentation

## Overview

The Analytics API provides comprehensive usage tracking and reporting capabilities for the Smart AI Hub platform. It enables administrators and users to monitor service usage, track costs, and gain insights into platform performance.

## Base URL

```
/api/analytics
```

## Authentication

All analytics endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Dashboard Data

**GET** `/dashboard`

Get comprehensive dashboard data including overview metrics, service breakdowns, model usage, time series data, and top users.

**Query Parameters:**

- `startDate` (optional): Filter by start date (ISO 8601 format)
- `endDate` (optional): Filter by end date (ISO 8601 format)
- `service` (optional): Filter by specific service
- `model` (optional): Filter by specific model
- `userId` (optional): Filter by specific user ID

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRequests": 1250,
      "totalTokens": 150000,
      "totalCredits": 5000,
      "averageResponseTime": 1.2,
      "errorRate": 0.02,
      "costPerRequest": 4.0
    },
    "services": [
      {
        "service": "mcp",
        "requests": 800,
        "tokens": 120000,
        "credits": 4000,
        "averageResponseTime": 1.1
      }
    ],
    "models": [
      {
        "model": "gpt-4",
        "requests": 600,
        "tokens": 90000,
        "credits": 3000,
        "averageResponseTime": 1.3
      }
    ],
    "timeSeries": [
      {
        "period": "2025-01-01",
        "requests": 100,
        "tokens": 12000,
        "credits": 400,
        "uniqueUsers": 25
      }
    ],
    "topUsers": [
      {
        "userId": "user-123",
        "email": "user@example.com",
        "totalRequests": 150,
        "totalTokens": 18000,
        "totalCredits": 600,
        "lastActivity": "2025-01-01T12:00:00Z"
      }
    ]
  }
}
```

### 2. Usage Metrics

**GET** `/metrics`

Get overall usage metrics with optional filtering.

**Query Parameters:**

- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `service` (optional): Filter by service
- `model` (optional): Filter by model
- `userId` (optional): Filter by user ID

**Response:**

```json
{
  "success": true,
  "data": {
    "totalRequests": 1250,
    "totalTokens": 150000,
    "totalCredits": 5000,
    "averageResponseTime": 1.2,
    "errorRate": 0.02,
    "costPerRequest": 4.0
  }
}
```

### 3. Usage by Service

**GET** `/services`

Get usage breakdown by service.

**Query Parameters:**

- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `userId` (optional): Filter by user ID

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "service": "mcp",
      "requests": 800,
      "tokens": 120000,
      "credits": 4000,
      "averageResponseTime": 1.1
    },
    {
      "service": "credits",
      "requests": 300,
      "tokens": 20000,
      "credits": 800,
      "averageResponseTime": 0.8
    }
  ]
}
```

### 4. Usage by Model

**GET** `/models`

Get usage breakdown by AI model.

**Query Parameters:**

- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `service` (optional): Filter by service
- `userId` (optional): Filter by user ID

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "model": "gpt-4",
      "requests": 600,
      "tokens": 90000,
      "credits": 3000,
      "averageResponseTime": 1.3
    },
    {
      "model": "claude-3",
      "requests": 400,
      "tokens": 60000,
      "credits": 2000,
      "averageResponseTime": 1.0
    }
  ]
}
```

### 5. Time Series Data

**GET** `/timeseries`

Get usage data over time with flexible grouping.

**Query Parameters:**

- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `service` (optional): Filter by service
- `model` (optional): Filter by model
- `userId` (optional): Filter by user ID
- `groupBy` (optional): Group by period (`day`, `week`, `month`). Default: `day`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "period": "2025-01-01",
      "requests": 100,
      "tokens": 12000,
      "credits": 400,
      "uniqueUsers": 25
    },
    {
      "period": "2025-01-02",
      "requests": 120,
      "tokens": 14400,
      "credits": 480,
      "uniqueUsers": 28
    }
  ]
}
```

### 6. Top Users

**GET** `/users/top`

Get users with highest usage.

**Query Parameters:**

- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `service` (optional): Filter by service
- `model` (optional): Filter by model
- `limit` (optional): Number of users to return (1-100). Default: 10

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "userId": "user-123",
      "email": "user@example.com",
      "totalRequests": 150,
      "totalTokens": 18000,
      "totalCredits": 600,
      "lastActivity": "2025-01-01T12:00:00Z"
    }
  ]
}
```

### 7. Export Usage Data

**GET** `/export`

Export usage data as CSV file.

**Query Parameters:**

- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `service` (optional): Filter by service
- `model` (optional): Filter by model
- `userId` (optional): Filter by user ID
- `page` (optional): Page number for pagination. Default: 1
- `limit` (optional): Records per page (1-5000). Default: 1000

**Response:**

- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="usage-data-YYYY-MM-DD.csv"`
- X-Total-Count: Total number of records

**CSV Format:**

```csv
ID,User ID,Email,Service,Model,Tokens,Credits,Metadata,Created At
uuid-123,user-123,user@example.com,mcp,gpt-4,100,50,"{""endpoint"":""/api/chat""}",2025-01-01T12:00:00Z
```

### 8. Personal Usage

**GET** `/my-usage`

Get usage analytics for the authenticated user only.

**Query Parameters:**

- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `service` (optional): Filter by service
- `model` (optional): Filter by model

**Response:**

```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalRequests": 50,
      "totalTokens": 6000,
      "totalCredits": 200,
      "averageResponseTime": 1.1,
      "errorRate": 0.01,
      "costPerRequest": 4.0
    },
    "services": [
      {
        "service": "mcp",
        "requests": 40,
        "tokens": 5000,
        "credits": 180,
        "averageResponseTime": 1.0
      }
    ],
    "models": [
      {
        "model": "gpt-4",
        "requests": 30,
        "tokens": 4000,
        "credits": 150,
        "averageResponseTime": 1.2
      }
    ],
    "timeSeries": [
      {
        "period": "2025-01-01",
        "requests": 10,
        "tokens": 1200,
        "credits": 40,
        "uniqueUsers": 1
      }
    ]
  }
}
```

## Usage Tracking

The analytics system automatically tracks usage through middleware. The following data is captured for each request:

- User ID
- Service name
- AI model (if applicable)
- Token usage
- Credit consumption
- Request metadata (endpoint, response time, etc.)
- Timestamp

### Integration Points

#### Credit Service Integration

When credits are deducted via the credit service, usage is automatically recorded:

```typescript
// This automatically records usage
await creditService.deductCredits(userId, 'mcp', 100, {
  model: 'gpt-4',
  tokens: 1000,
});
```

#### Manual Usage Recording

For custom tracking, use the analytics service directly:

```typescript
import { recordUsage } from '../services/analytics.service';

await recordUsage(userId, 'custom-service', 'gpt-4', 1000, 100, {
  customField: 'value',
});
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date format",
    "details": "startDate must be in ISO 8601 format"
  }
}
```

Common error codes:

- `UNAUTHORIZED`: Invalid or missing authentication token
- `FORBIDDEN`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid query parameters
- `INTERNAL_ERROR`: Server error

## Rate Limiting

Analytics endpoints are subject to rate limiting based on user roles:

- Admin: Unlimited requests
- Manager: 120 requests per minute
- User: 60 requests per minute
- Guest: 10 requests per minute

## Performance Considerations

- Dashboard data includes caching for frequently accessed metrics
- Time series queries are optimized with database indexes
- Large exports are paginated to prevent timeouts
- Analytics data is stored in a separate table for performance

## Data Retention

Usage logs are retained according to the platform's data retention policy. Default retention is 2 years, after which data is archived or deleted based on compliance requirements.

## Monitoring

The analytics service includes built-in monitoring:

- Request timing tracking
- Error rate monitoring
- Database query performance
- Cache hit rates

## Security

- All data access is logged for audit purposes
- Personal usage data is isolated per user
- Admin access requires appropriate permissions
- Sensitive metadata is encrypted at rest
