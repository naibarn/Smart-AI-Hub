# Points System API Documentation

## Overview

The Points System provides a comprehensive API for managing user points, including balance tracking, transactions, exchanges, purchases, and daily rewards. The system works alongside the existing Credits System and includes an auto top-up feature that automatically converts credits to points when the points balance is low.

## Authentication

All API endpoints require authentication using a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Admin endpoints require additional admin privileges.

## Base URL

```
https://api.smart-ai-hub.com/api/points
```

## Response Format

All responses follow the standard API format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "Insufficient points balance",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Endpoints

### 1. Get Points Balance

Retrieve the current points balance for the authenticated user.

**Endpoint:** `GET /api/points/balance`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1500,
    "lastUpdated": "2024-01-15T10:30:00.000Z",
    "account": {
      "id": "point_account_id",
      "userId": "user_id",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 2. Get Points Transaction History

Retrieve the transaction history for the authenticated user.

**Endpoint:** `GET /api/points/history`

**Authentication:** Required

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Number of transactions per page (default: 20)
- `type` (string, optional): Filter by transaction type
- `startDate` (string, optional): Filter by start date (ISO 8601)
- `endDate` (string, optional): Filter by end date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "transaction_id",
        "type": "purchase",
        "amount": 1000,
        "balance": 1500,
        "description": "Points purchase",
        "metadata": {},
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 3. Exchange Credits to Points

Manually exchange credits for points.

**Endpoint:** `POST /api/points/exchange-from-credits`

**Authentication:** Required

**Request Body:**
```json
{
  "creditAmount": 10,
  "description": "Manual exchange for service usage"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "transaction_id",
      "type": "exchange_from_credit",
      "amount": 10000,
      "balance": 10000,
      "description": "Manual exchange: 10 Credits → 10000 Points",
      "metadata": {
        "creditAmount": 10,
        "exchangeRate": 1000
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "creditTransaction": {
      "id": "credit_transaction_id",
      "type": "exchange_to_points",
      "amount": -10,
      "balance": 90,
      "description": "Exchange to Points: 10 Credits → 10000 Points",
      "metadata": {
        "pointsAmount": 10000,
        "exchangeRate": 1000
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 4. Purchase Points with Money

Purchase points using real money through Stripe.

**Endpoint:** `POST /api/points/purchase`

**Authentication:** Required

**Request Body:**
```json
{
  "packageId": "package_id",
  "paymentMethodId": "payment_method_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentIntent": {
      "id": "payment_intent_id",
      "clientSecret": "client_secret",
      "status": "requires_payment_method"
    },
    "transaction": {
      "id": "transaction_id",
      "type": "purchase",
      "amount": 10000,
      "balance": 10000,
      "description": "Points purchase: 10000 Points for $1.00",
      "metadata": {
        "packageId": "package_id",
        "usdAmount": 1,
        "pointsPerUsd": 10000
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 5. Deduct Points (Internal)

Internal endpoint to deduct points from a user's account. This endpoint checks for auto top-up before deduction.

**Endpoint:** `POST /api/points/deduct`

**Authentication:** Required (Service-to-Service)

**Request Body:**
```json
{
  "userId": "user_id",
  "amount": 500,
  "description": "Service usage: AI Chat",
  "service": "ai_chat",
  "metadata": {
    "sessionId": "session_id",
    "messageCount": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "transaction_id",
      "type": "usage",
      "amount": -500,
      "balance": 500,
      "description": "Service usage: AI Chat",
      "metadata": {
        "service": "ai_chat",
        "sessionId": "session_id",
        "messageCount": 10
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "autoTopupTriggered": false
  }
}
```

### 6. Claim Daily Login Reward

Claim the daily login reward for the authenticated user.

**Endpoint:** `POST /api/points/claim-daily-reward`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "transaction_id",
      "type": "daily_reward",
      "amount": 50,
      "balance": 50,
      "description": "Daily login reward",
      "metadata": {
        "rewardDate": "2024-01-15",
        "consecutiveDays": 5
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "consecutiveDays": 5,
    "nextRewardTime": "2024-01-16T00:00:00.000Z"
  }
}
```

### 7. Check Daily Reward Status

Check if the user can claim the daily reward and get reward status information.

**Endpoint:** `GET /api/points/daily-reward-status`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "canClaim": true,
    "lastClaimDate": "2024-01-14T10:30:00.000Z",
    "consecutiveDays": 4,
    "nextRewardTime": "2024-01-15T00:00:00.000Z",
    "rewardAmount": 50
  }
}
```

### 8. Get Combined Wallet Balance

Get both credits and points balances in a single request.

**Endpoint:** `GET /api/wallet/balance`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "credits": {
      "balance": 100,
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    },
    "points": {
      "balance": 1500,
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Admin Endpoints

### 9. Get Exchange Rates (Admin)

Get all exchange rates and system configuration.

**Endpoint:** `GET /api/admin/exchange-rates`

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "rates": [
      {
        "id": "rate_id",
        "name": "credit_to_points",
        "rate": 1000,
        "description": "Credits to Points conversion rate",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "config": {
      "autoTopupEnabled": true,
      "autoTopupThreshold": 10,
      "autoTopupAmountCredits": 1,
      "dailyRewardEnabled": true,
      "dailyRewardAmount": 50
    }
  }
}
```

### 10. Update Exchange Rate (Admin)

Update an exchange rate.

**Endpoint:** `PUT /api/admin/exchange-rates/:name`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "rate": 1200,
  "description": "Updated rate for better user experience"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rate": {
      "id": "rate_id",
      "name": "credit_to_points",
      "rate": 1200,
      "description": "Updated rate for better user experience",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 11. Get Points Statistics (Admin)

Get comprehensive points system statistics.

**Endpoint:** `GET /api/admin/points/stats`

**Authentication:** Required (Admin)

**Query Parameters:**
- `startDate` (string, optional): Filter by start date (ISO 8601)
- `endDate` (string, optional): Filter by end date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPoints": 2500000,
      "totalUsers": 1250,
      "activeUsers": 890,
      "averageBalance": 2000
    },
    "transactions": {
      "total": 15420,
      "byType": {
        "purchase": 3200,
        "usage": 8900,
        "exchange_from_credit": 2100,
        "daily_reward": 1200,
        "auto_topup_from_credit": 20
      },
      "totalPointsEarned": 2100000,
      "totalPointsSpent": 1500000
    },
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-15T23:59:59.999Z"
    }
  }
}
```

### 12. Get Auto Top-up Statistics (Admin)

Get statistics about auto top-up usage.

**Endpoint:** `GET /api/admin/auto-topup/stats`

**Authentication:** Required (Admin)

**Query Parameters:**
- `startDate` (string, optional): Filter by start date (ISO 8601)
- `endDate` (string, optional): Filter by end date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalAutoTopups": 342,
      "totalCreditsConverted": 342,
      "totalPointsGenerated": 342000,
      "uniqueUsers": 125
    },
    "recentAutoTopups": [
      {
        "id": "transaction_id",
        "user": {
          "id": "user_id",
          "email": "user@example.com"
        },
        "amount": 1000,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-15T23:59:59.999Z"
    }
  }
}
```

## Error Codes

| Error Code | Description |
|------------|-------------|
| `INSUFFICIENT_POINTS` | Insufficient points balance |
| `INSUFFICIENT_CREDITS` | Insufficient credits balance for exchange |
| `AUTO_TOPUP_FAILED` | Auto top-up failed |
| `DAILY_REWARD_ALREADY_CLAIMED` | Daily reward already claimed for today |
| `INVALID_EXCHANGE_AMOUNT` | Invalid exchange amount |
| `EXCHANGE_RATE_NOT_FOUND` | Exchange rate not found |
| `POINT_ACCOUNT_NOT_FOUND` | Point account not found |
| `TRANSACTION_FAILED` | Transaction failed due to database error |
| `INVALID_PACKAGE` | Invalid points package |
| `PAYMENT_FAILED` | Payment processing failed |

## Transaction Types

| Type | Description |
|------|-------------|
| `purchase` | Points purchased with money |
| `usage` | Points spent on services |
| `exchange_from_credit` | Points received from credit exchange |
| `auto_topup_from_credit` | Points received from automatic top-up |
| `daily_reward` | Points received from daily login reward |
| `admin_adjustment` | Manual adjustment by admin |
| `refund` | Points refunded |

## Configuration

The Points System is configured through environment variables:

```env
# Points System Configuration
POINTS_DAILY_REWARD_AMOUNT=50
POINTS_PER_CREDIT=1000
POINTS_PER_USD=10000
DAILY_REWARD_ENABLED=true
DAILY_REWARD_TIMEZONE=UTC
AUTO_TOPUP_ENABLED=true
AUTO_TOPUP_THRESHOLD=10
AUTO_TOPUP_AMOUNT_CREDITS=1
```

## Auto Top-up Feature

The auto top-up feature automatically converts credits to points when the points balance is low:

### Conditions
- Points balance ≤ threshold (default: 10)
- Credits balance ≥ amount (default: 1)
- Auto top-up is enabled (default: true)

### Process
1. System checks auto top-up conditions before any points deduction
2. If conditions are met, 1 credit is deducted and 1000 points are added
3. Transaction type: `auto_topup_from_credit`
4. User is notified about the automatic conversion
5. Original operation proceeds with the updated points balance

### Transaction Example
```json
{
  "id": "transaction_id",
  "type": "auto_topup_from_credit",
  "amount": 1000,
  "balance": 1010,
  "description": "Auto top-up: 1 Credit → 1000 Points",
  "metadata": {
    "creditAmount": 1,
    "exchangeRate": 1000,
    "triggeredOperation": "ai_chat_usage"
  },
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

## Rate Limiting

All endpoints are subject to rate limiting:

- User endpoints: 100 requests per minute
- Admin endpoints: 50 requests per minute
- Internal endpoints: 1000 requests per minute

## Webhooks

The Points System sends webhook notifications for important events:

### Points Deducted
```json
{
  "event": "points.deducted",
  "data": {
    "userId": "user_id",
    "amount": 500,
    "balance": 500,
    "transaction": { ... }
  }
}
```

### Auto Top-up Triggered
```json
{
  "event": "points.auto_topup_triggered",
  "data": {
    "userId": "user_id",
    "creditAmount": 1,
    "pointsAmount": 1000,
    "transaction": { ... }
  }
}
```

### Daily Reward Claimed
```json
{
  "event": "points.daily_reward_claimed",
  "data": {
    "userId": "user_id",
    "amount": 50,
    "consecutiveDays": 5,
    "transaction": { ... }
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { PointsAPI } from '@smart-ai-hub/sdk';

const pointsAPI = new PointsAPI({
  baseURL: 'https://api.smart-ai-hub.com',
  apiKey: 'your-api-key'
});

// Get balance
const balance = await pointsAPI.getBalance();
console.log(`Points balance: ${balance.data.balance}`);

// Exchange credits to points
const exchange = await pointsAPI.exchangeFromCredits({
  creditAmount: 10,
  description: 'Manual exchange'
});

// Claim daily reward
const reward = await pointsAPI.claimDailyReward();
console.log(`Daily reward claimed: ${reward.data.transaction.amount} points`);
```

### Python

```python
from smart_ai_hub_sdk import PointsAPI

client = PointsAPI(
    base_url='https://api.smart-ai-hub.com',
    api_key='your-api-key'
)

# Get balance
balance = client.get_balance()
print(f"Points balance: {balance['data']['balance']}")

# Exchange credits to points
exchange = client.exchange_from_credits(
    credit_amount=10,
    description='Manual exchange'
)

# Claim daily reward
reward = client.claim_daily_reward()
print(f"Daily reward claimed: {reward['data']['transaction']['amount']} points")
```

## Testing

### Test Environment

The Points System provides a test environment at `https://api-test.smart-ai-hub.com` for testing purposes.

### Test Data

Use the following test data for development:

```json
{
  "testUser": {
    "id": "test_user_id",
    "email": "test@example.com",
    "credits": 100,
    "points": 1000
  }
}
```

### Test Scenarios

1. **Basic Exchange**: Exchange 10 credits for 10,000 points
2. **Auto Top-up**: Trigger auto top-up when points ≤ 10
3. **Daily Reward**: Claim daily reward (once per day)
4. **Insufficient Balance**: Attempt to deduct more points than available
5. **Concurrent Requests**: Test multiple simultaneous operations

## Support

For support with the Points System API:

- Documentation: https://docs.smart-ai-hub.com/points-api
- Support Email: support@smart-ai-hub.com
- Status Page: https://status.smart-ai-hub.com