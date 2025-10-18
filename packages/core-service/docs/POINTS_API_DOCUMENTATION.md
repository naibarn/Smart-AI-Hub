# Points System API Documentation

## Overview

The Points System provides a comprehensive solution for managing user points, including earning, spending, and tracking point transactions. It supports daily login rewards, credit-to-point exchanges, auto top-up functionality, and administrative management of exchange rates.

## Base URL

```
/api/v1/points
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All responses follow this standard format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## User Endpoints

### Get Point Balance

Retrieve the current point balance for the authenticated user.

**Endpoint:** `GET /balance`

**Response:**

```json
{
  "success": true,
  "data": {
    "balance": 1500,
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

### Get Transaction History

Get paginated transaction history for the authenticated user.

**Endpoint:** `GET /history`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx_123",
        "amount": 100,
        "type": "daily_reward",
        "description": "Daily login reward",
        "balanceAfter": 1500,
        "createdAt": "2024-01-01T12:00:00.000Z",
        "metadata": {}
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

### Exchange Credits to Points

Exchange credits from the user's credit account for points.

**Endpoint:** `POST /exchange`

**Request Body:**

```json
{
  "creditAmount": 10
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "pointsReceived": 10000,
    "newCreditBalance": 90,
    "newPointBalance": 11500,
    "exchangeRate": 1000
  }
}
```

### Claim Daily Reward

Claim the daily login reward if available.

**Endpoint:** `POST /daily-reward/claim`

**Response:**

```json
{
  "success": true,
  "data": {
    "points": 50,
    "message": "Successfully claimed 50 points as your daily reward!"
  }
}
```

### Get Daily Reward Status

Check if the daily reward is available for claiming.

**Endpoint:** `GET /daily-reward/status`

**Response:**

```json
{
  "success": true,
  "data": {
    "canClaim": true,
    "rewardAmount": 50,
    "nextClaimDate": "2024-01-02T00:00:00.000Z",
    "lastClaimDate": "2024-01-01T12:00:00.000Z"
  }
}
```

### Purchase Points

Purchase points using real money through Stripe.

**Endpoint:** `POST /purchase`

**Request Body:**

```json
{
  "pointsAmount": 10000,
  "stripeSessionId": "cs_123",
  "stripePaymentIntentId": "pi_123",
  "amount": 100
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "newBalance": 11000,
    "transactionId": "tx_456"
  }
}
```

## Admin Endpoints

_Note: Admin endpoints require additional admin permissions._

### Get Exchange Rates

Get all exchange rates configured in the system.

**Endpoint:** `GET /admin/exchange-rates`

**Response:**

```json
{
  "success": true,
  "data": {
    "rates": [
      {
        "id": "rate_123",
        "name": "credit_to_points",
        "rate": 1000,
        "description": "Points per credit",
        "updatedAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

### Update Exchange Rate

Update an existing exchange rate or create a new one.

**Endpoint:** `PUT /admin/exchange-rates`

**Request Body:**

```json
{
  "name": "credit_to_points",
  "rate": 1200,
  "description": "Updated points per credit"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "rate_123",
    "name": "credit_to_points",
    "rate": 1200,
    "description": "Updated points per credit",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Adjust User Points

Manually adjust a user's point balance (admin only).

**Endpoint:** `POST /admin/adjust-points`

**Request Body:**

```json
{
  "userId": "user_123",
  "amount": 500,
  "reason": "Compensation for service outage"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "newBalance": 2000,
    "transactionId": "tx_789"
  }
}
```

### Get Points Statistics

Get comprehensive statistics about the points system.

**Endpoint:** `GET /admin/stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalPoints": 1000000,
    "totalUsers": 5000,
    "activeUsers": 3500,
    "averageBalance": 200,
    "totalTransactions": 25000
  }
}
```

### Get Auto Top-up Statistics

Get statistics about automatic top-ups.

**Endpoint:** `GET /admin/auto-topup-stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalAutoTopups": 1500,
    "totalCreditsConverted": 3000,
    "totalPointsGenerated": 3000000,
    "recentAutoTopups": [
      {
        "id": "tx_abc",
        "userId": "user_123",
        "userEmail": "user@example.com",
        "amount": 1000,
        "type": "auto_topup_from_credit",
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

## Error Codes

| Code                      | Description                                 |
| ------------------------- | ------------------------------------------- |
| `INSUFFICIENT_POINTS`     | Not enough points to complete the operation |
| `INSUFFICIENT_CREDITS`    | Not enough credits to exchange for points   |
| `DAILY_REWARD_CLAIMED`    | Daily reward already claimed for today      |
| `DAILY_REWARDS_DISABLED`  | Daily rewards are currently disabled        |
| `INVALID_AMOUNT`          | Amount must be positive                     |
| `POINT_ACCOUNT_NOT_FOUND` | User does not have a point account          |
| `EXCHANGE_RATE_NOT_FOUND` | Requested exchange rate does not exist      |
| `REASON_REQUIRED`         | Reason is required for point adjustments    |
| `PAYMENT_FAILED`          | Payment processing failed                   |
| `UNAUTHORIZED`            | User not authenticated                      |
| `FORBIDDEN`               | User lacks required permissions             |

## Configuration

The Points System can be configured using the following environment variables:

```env
# Points System Configuration
POINTS_DAILY_REWARD_AMOUNT=50          # Default daily reward amount
POINTS_PER_CREDIT=1000                 # Points received per credit exchanged
POINTS_PER_USD=10000                   # Points received per USD spent
DAILY_REWARD_ENABLED=true              # Enable/disable daily rewards
DAILY_REWARD_TIMEZONE=UTC              # Timezone for daily reward calculations
AUTO_TOPUP_ENABLED=true                # Enable/disable auto top-up
AUTO_TOPUP_THRESHOLD=10                # Points threshold to trigger auto top-up
AUTO_TOPUP_AMOUNT_CREDITS=1            # Credits to convert when auto top-up triggers
```

## Webhooks

The Points System can send webhook notifications for important events:

### Point Balance Update

Sent when a user's point balance changes:

```json
{
  "event": "point_balance.updated",
  "data": {
    "userId": "user_123",
    "oldBalance": 1000,
    "newBalance": 1500,
    "transactionId": "tx_456",
    "change": 500,
    "reason": "daily_reward"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Daily Reward Claimed

Sent when a user claims their daily reward:

```json
{
  "event": "daily_reward.claimed",
  "data": {
    "userId": "user_123",
    "pointsAwarded": 50,
    "rewardDate": "2024-01-01",
    "transactionId": "tx_789"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- User endpoints: 100 requests per minute per user
- Admin endpoints: 50 requests per minute per admin
- Purchase endpoints: 10 requests per minute per user

## SDK Examples

### JavaScript/TypeScript

```typescript
import { PointsClient } from '@smart-ai-hub/points-sdk';

const client = new PointsClient({
  baseURL: 'https://api.smart-ai-hub.com/api/v1/points',
  apiKey: 'your-api-key',
});

// Get balance
const balance = await client.getBalance();
console.log(`Current balance: ${balance.data.balance}`);

// Exchange credits
const exchangeResult = await client.exchangeCredits(10);
console.log(`Received ${exchangeResult.data.pointsReceived} points`);

// Claim daily reward
const rewardResult = await client.claimDailyReward();
console.log(rewardResult.data.message);
```

### Python

```python
from smart_ai_hub_points import PointsClient

client = PointsClient(
    base_url='https://api.smart-ai-hub.com/api/v1/points',
    api_key='your-api-key'
)

# Get balance
balance = client.get_balance()
print(f"Current balance: {balance['data']['balance']}")

# Exchange credits
exchange_result = client.exchange_credits(10)
print(f"Received {exchange_result['data']['pointsReceived']} points")

# Claim daily reward
reward_result = client.claim_daily_reward()
print(reward_result['data']['message'])
```

## Migration Guide

If you're migrating from an older points system:

1. **Data Migration**: Use the admin endpoints to bulk-adjust user balances
2. **API Changes**: Update your API calls to use the new endpoint structure
3. **Authentication**: Ensure you're using JWT tokens for authentication
4. **Webhooks**: Update your webhook handlers to use the new event format

## Support

For support with the Points System API:

- Documentation: [Points System Documentation](https://docs.smart-ai-hub.com/points)
- Support Email: support@smart-ai-hub.com
- Status Page: [API Status](https://status.smart-ai-hub.com)

## Changelog

### v1.0.0 (2024-01-01)

- Initial release of the Points System API
- Core functionality for point management
- Daily rewards system
- Credit-to-point exchange
- Auto top-up functionality
- Admin management endpoints
- Webhook notifications
