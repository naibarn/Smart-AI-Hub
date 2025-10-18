# Smart AI Hub API Documentation

[![API Version](https://img.shields.io/badge/API%20Version-v1.0-blue.svg)](https://github.com/your-username/Smart-AI-Hub)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URLs](#base-urls)
- [Common Headers](#common-headers)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#user-endpoints)
  - [Credits](#credit-endpoints)
  - [Points](#points-endpoints)
  - [MCP (Model Context Protocol)](#mcp-endpoints)
  - [Notifications](#notification-endpoints)
  - [Admin](#admin-endpoints)
- [Webhooks](#webhooks)
- [SDKs and Libraries](#sdks-and-libraries)
- [Changelog](#changelog)

## Overview

The Smart AI Hub API provides programmatic access to all platform features, including user authentication, credit management, AI service interactions, and administrative functions. The API follows RESTful principles and uses JSON for all request and response bodies.

### Key Features

- JWT-based authentication
- Role-based access control
- Real-time WebSocket connections
- Comprehensive error handling
- Rate limiting and throttling
- Webhook support for events

## Authentication

### Overview

All API requests (except authentication endpoints) require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

#### Login with Email and Password

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

#### OAuth Login

```http
GET /api/auth/google?redirect_uri=https://smartaihub.com/auth/callback
```

### Refreshing Tokens

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <your-jwt-token>
```

## Base URLs

| Environment | Base URL                             |
| ----------- | ------------------------------------ |
| Development | `http://localhost:3001`              |
| Staging     | `https://api-staging.smartaihub.com` |
| Production  | `https://api.smartaihub.com`         |

## Environment-Specific URLs

### Redirect URIs

| Environment | OAuth Redirect URI                             |
| ----------- | ---------------------------------------------- |
| Production  | `https://smartaihub.com/auth/callback`         |
| Staging     | `https://staging.smartaihub.com/auth/callback` |
| Development | `http://localhost:3000/auth/callback`          |

### Webhook URLs

| Environment | Webhook URL                                          |
| ----------- | ---------------------------------------------------- |
| Production  | `https://smartaihub.com/webhooks/smartaihub`         |
| Staging     | `https://staging.smartaihub.com/webhooks/smartaihub` |
| Development | `http://localhost:3000/webhooks/smartaihub`          |

### Application URLs

| Environment | Application URL                  |
| ----------- | -------------------------------- |
| Production  | `https://smartaihub.com`         |
| Staging     | `https://staging.smartaihub.com` |
| Development | `http://localhost:3000`          |

## Common Headers

| Header             | Description                             | Required                    |
| ------------------ | --------------------------------------- | --------------------------- |
| `Authorization`    | Bearer token for authentication         | Yes (except auth endpoints) |
| `Content-Type`     | Media type of the request body          | Yes for POST/PUT/PATCH      |
| `Accept`           | Media type acceptable for the response  | Optional                    |
| `X-Request-ID`     | Unique request identifier for debugging | Optional                    |
| `X-Client-Version` | Client application version              | Optional                    |

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2023-10-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2023-10-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2023-10-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0"
  }
}
```

## Error Handling

### HTTP Status Codes

| Code  | Description                                          |
| ----- | ---------------------------------------------------- |
| `200` | OK - Request successful                              |
| `201` | Created - Resource created successfully              |
| `204` | No Content - Request successful, no content returned |
| `400` | Bad Request - Invalid request data                   |
| `401` | Unauthorized - Authentication required               |
| `403` | Forbidden - Insufficient permissions                 |
| `404` | Not Found - Resource not found                       |
| `409` | Conflict - Resource conflict                         |
| `422` | Unprocessable Entity - Validation failed             |
| `429` | Too Many Requests - Rate limit exceeded              |
| `500` | Internal Server Error - Server error                 |

### Error Codes

| Code                    | Description                     |
| ----------------------- | ------------------------------- |
| `VALIDATION_ERROR`      | Request validation failed       |
| `AUTHENTICATION_FAILED` | Invalid credentials             |
| `AUTHORIZATION_FAILED`  | Insufficient permissions        |
| `RESOURCE_NOT_FOUND`    | Resource not found              |
| `RESOURCE_CONFLICT`     | Resource conflict               |
| `RATE_LIMIT_EXCEEDED`   | Rate limit exceeded             |
| `INTERNAL_ERROR`        | Internal server error           |
| `SERVICE_UNAVAILABLE`   | Service temporarily unavailable |

## Rate Limiting

The API implements rate limiting to ensure fair usage:

| Endpoint        | Rate Limit              |
| --------------- | ----------------------- |
| Authentication  | 10 requests per minute  |
| General API     | 100 requests per minute |
| MCP endpoints   | 60 requests per minute  |
| Admin endpoints | 200 requests per minute |

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1697359600
```

## API Endpoints

### Authentication Endpoints

#### Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "emailVerified": true,
      "createdAt": "2023-10-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

#### Register

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Refresh Token

```http
POST /api/auth/refresh
```

**Request Body:**

```json
{
  "refreshToken": "your-refresh-token"
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <your-jwt-token>
```

#### Forgot Password

```http
POST /api/auth/forgot-password
```

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

#### Reset Password

```http
POST /api/auth/reset-password
```

**Request Body:**

```json
{
  "token": "reset-token",
  "newPassword": "newSecurePassword123"
}
```

### User Endpoints

#### Get Current User

```http
GET /api/users/me
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "emailVerified": true,
    "createdAt": "2023-10-15T10:30:00Z",
    "updatedAt": "2023-10-15T10:30:00Z"
  }
}
```

#### Update User Profile

```http
PUT /api/users/me
Authorization: Bearer <your-jwt-token>
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "timezone": "America/New_York",
  "language": "en"
}
```

#### Change Password

```http
PUT /api/users/me/password
Authorization: Bearer <your-jwt-token>
```

**Request Body:**

```json
{
  "currentPassword": "currentPassword123",
  "newPassword": "newSecurePassword123"
}
```

### Credit Endpoints

#### Get Credit Balance

```http
GET /api/credits/balance
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "balance": 1000,
    "currency": "credits",
    "lastUpdated": "2023-10-15T10:30:00Z"
  }
}
```

#### Get Credit History

```http
GET /api/credits/history?page=1&limit=20
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "txn_123",
      "type": "purchase",
      "amount": 500,
      "balance": 1000,
      "description": "Credit purchase",
      "createdAt": "2023-10-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Purchase Credits

```http
POST /api/credits/purchase
Authorization: Bearer <your-jwt-token>
```

**Request Body:**

```json
{
  "packageId": "pkg_starter",
  "paymentMethodId": "pm_123",
  "amount": 1000
}
```

### Points Endpoints

#### Get Points Balance

```http
GET /api/v1/points/balance
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "balance": 5000
  },
  "meta": {
    "timestamp": "2023-10-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0"
  }
}
```

#### Get Points History

```http
GET /api/v1/points/history?page=1&limit=20
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "txn_123",
      "userId": "user_123",
      "amount": 1000,
      "type": "purchase",
      "balanceAfter": 5000,
      "description": "Purchased points",
      "metadata": {},
      "createdAt": "2023-10-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 50,
    "total_pages": 3
  },
  "meta": {
    "timestamp": "2023-10-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0"
  }
}
```

#### Exchange Credits to Points

```http
POST /api/v1/points/exchange-from-credits
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "creditAmount": 5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "newCreditBalance": 5,
    "newPointBalance": 6000,
    "pointsReceived": 5000,
    "message": "Successfully exchanged 5 credits for 5000 points"
  },
  "meta": {
    "timestamp": "2023-10-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0"
  }
}
```

#### Purchase Points

```http
POST /api/v1/points/purchase
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "pointsAmount": 10000,
  "paymentDetails": {
    "stripeSessionId": "sess_123",
    "stripePaymentIntentId": "pi_123",
    "amount": 10
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "newBalance": 15000,
    "transactionId": "txn_456",
    "message": "Successfully purchased 10000 points"
  },
  "meta": {
    "timestamp": "2023-10-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0"
  }
}
```

#### Claim Daily Reward

```http
POST /api/v1/points/claim-daily-reward
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "points": 100,
    "message": "Successfully claimed 100 points as your daily reward!"
  },
  "meta": {
    "timestamp": "2023-10-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0"
  }
}
```

#### Get Daily Reward Status

```http
GET /api/v1/points/daily-reward-status
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "canClaim": true,
    "rewardAmount": 100
  },
  "meta": {
    "timestamp": "2023-10-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0"
  }
}
```

#### Get Wallet Balance (Credits and Points)

```http
GET /api/v1/wallet/balance
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "credits": 10,
    "points": 5000
  },
  "meta": {
    "timestamp": "2023-10-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0"
  }
}
```

#### Deduct Points (Internal API)

```http
POST /api/v1/mcp/points/deduct
X-User-ID: user_123
X-Service-Token: service-token
Content-Type: application/json
```

**Request Body:**

```json
{
  "amount": 100,
  "description": "Used for AI service",
  "metadata": {
    "service": "gpt-4",
    "model": "gpt-4"
  }
}
```

**Response:**

```json
{
  "success": true,
  "status": "ok",
  "new_balance": 4900,
  "transaction_id": "txn_789",
  "autoTopupTriggered": false
}
```

### MCP (Model Context Protocol) Endpoints

#### List Available Models

```http
GET /api/mcp/models
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "openai",
      "description": "Advanced language model",
      "pricing": {
        "inputTokens": 0.00003,
        "outputTokens": 0.00006
      },
      "capabilities": ["text", "code", "analysis"]
    }
  ]
}
```

#### Create Chat Completion

```http
POST /api/mcp/chat/completions
Authorization: Bearer <your-jwt-token>
```

**Request Body:**

```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "maxTokens": 1000,
  "temperature": 0.7,
  "stream": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "chatcmpl-123",
    "model": "gpt-4",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "Hello! I'm doing well, thank you for asking. How can I assist you today?"
        },
        "finishReason": "stop"
      }
    ],
    "usage": {
      "promptTokens": 20,
      "completionTokens": 15,
      "totalTokens": 35
    },
    "cost": 0.00105
  }
}
```

#### Stream Chat Completion

```http
POST /api/mcp/chat/completions
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Tell me a story"
    }
  ],
  "stream": true
}
```

**Response:** Server-Sent Events (SSE) stream

### Notification Endpoints

#### Get Notifications

```http
GET /api/notifications?page=1&limit=20&unread=false
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "type": "info",
      "title": "Welcome to Smart AI Hub",
      "message": "Your account has been created successfully.",
      "read": false,
      "createdAt": "2023-10-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Mark Notification as Read

```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer <your-jwt-token>
```

#### Mark All Notifications as Read

```http
PUT /api/notifications/read-all
Authorization: Bearer <your-jwt-token>
```

#### Update Notification Settings

```http
PUT /api/notifications/settings
Authorization: Bearer <your-jwt-token>
```

**Request Body:**

```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "inAppNotifications": true,
  "categories": {
    "account": {
      "email": true,
      "push": true,
      "inApp": true
    },
    "billing": {
      "email": true,
      "push": false,
      "inApp": true
    }
  }
}
```

### Admin Endpoints

#### List Users (Admin Only)

```http
GET /api/admin/users?page=1&limit=20&role=user&status=active
Authorization: Bearer <your-admin-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "status": "active",
      "emailVerified": true,
      "credits": 1000,
      "createdAt": "2023-10-15T10:30:00Z",
      "lastActiveAt": "2023-10-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get User Details (Admin Only)

```http
GET /api/admin/users/{userId}
Authorization: Bearer <your-admin-jwt-token>
```

#### Update User (Admin Only)

```http
PUT /api/admin/users/{userId}
Authorization: Bearer <your-admin-jwt-token>
```

**Request Body:**

```json
{
  "role": "admin",
  "status": "active",
  "credits": 1500
}
```

#### Adjust User Credits (Admin Only)

```http
POST /api/admin/users/{userId}/credits/adjust
Authorization: Bearer <your-admin-jwt-token>
```

**Request Body:**

```json
{
  "amount": 500,
  "reason": "Promotional credit",
  "type": "bonus"
}
```

#### Get System Metrics (Admin Only)

```http
GET /api/admin/metrics
Authorization: Bearer <your-admin-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "active": 850,
      "newThisMonth": 120
    },
    "credits": {
      "totalPurchased": 50000,
      "totalUsed": 35000,
      "revenue": 5000
    },
    "api": {
      "requestsToday": 5000,
      "averageResponseTime": 150,
      "errorRate": 0.02
    }
  }
}
```

#### Get Exchange Rates (Admin Only)

```http
GET /api/admin/exchange-rates
Authorization: Bearer <your-admin-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "rate_123",
      "fromType": "credits",
      "toType": "points",
      "rate": 1000,
      "isActive": true,
      "createdAt": "2023-10-15T10:30:00Z",
      "updatedAt": "2023-10-15T10:30:00Z"
    }
  ],
  "meta": {
    "timestamp": "2023-10-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0"
  }
}
```

#### Update Exchange Rate (Admin Only)

```http
PUT /api/admin/exchange-rates/{rateId}
Authorization: Bearer <your-admin-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "rate": 1200,
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "rate_123",
    "fromType": "credits",
    "toType": "points",
    "rate": 1200,
    "isActive": true,
    "createdAt": "2023-10-15T10:30:00Z",
    "updatedAt": "2023-10-15T11:00:00Z"
  },
  "meta": {
    "timestamp": "2023-10-15T11:00:00Z",
    "requestId": "req_456",
    "version": "1.0"
  }
}
```

#### Create Exchange Rate (Admin Only)

```http
POST /api/admin/exchange-rates
Authorization: Bearer <your-admin-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "fromType": "credits",
  "toType": "points",
  "rate": 1000,
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "rate_456",
    "fromType": "credits",
    "toType": "points",
    "rate": 1000,
    "isActive": true,
    "createdAt": "2023-10-15T11:30:00Z",
    "updatedAt": "2023-10-15T11:30:00Z"
  },
  "meta": {
    "timestamp": "2023-10-15T11:30:00Z",
    "requestId": "req_789",
    "version": "1.0"
  }
}
```

#### Delete Exchange Rate (Admin Only)

```http
DELETE /api/admin/exchange-rates/{rateId}
Authorization: Bearer <your-admin-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "message": "Exchange rate deleted successfully",
  "meta": {
    "timestamp": "2023-10-15T12:00:00Z",
    "requestId": "req_101",
    "version": "1.0"
  }
}
```

#### Get Points Statistics (Admin Only)

```http
GET /api/admin/stats/points
Authorization: Bearer <your-admin-jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalPointsIssued": 5000000,
    "totalPointsUsed": 3500000,
    "totalPointsPurchased": 2000000,
    "totalPointsFromCredits": 1500000,
    "totalPointsFromDailyRewards": 500000,
    "activeUsersWithPoints": 850,
    "averagePointsPerUser": 5882,
    "topUpTriggeredCount": 120,
    "exchangeRateCreditsToPoints": 1000
  },
  "meta": {
    "timestamp": "2023-10-15T12:30:00Z",
    "requestId": "req_202",
    "version": "1.0"
  }
}
```

## Webhooks

### Overview

Webhooks allow you to receive real-time notifications when events occur in the Smart AI Hub platform.

### Configuring Webhooks

Webhooks can be configured in the admin dashboard or via the API:

```http
POST /api/admin/webhooks
Authorization: Bearer <your-admin-jwt-token>
```

**Request Body:**

```json
{
  "url": "https://smartaihub.com/webhooks/smartaihub",
  "events": ["user.created", "credit.purchased", "payment.completed"],
  "secret": "your-webhook-secret",
  "active": true
}
```

### Webhook Events

| Event               | Description          |
| ------------------- | -------------------- |
| `user.created`      | User account created |
| `user.updated`      | User profile updated |
| `credit.purchased`  | Credits purchased    |
| `credit.used`       | Credits consumed     |
| `payment.completed` | Payment processed    |
| `payment.failed`    | Payment failed       |

### Webhook Payload

```json
{
  "eventId": "evt_123",
  "eventType": "user.created",
  "timestamp": "2023-10-15T10:30:00Z",
  "data": {
    "userId": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "signature": "sha256=5d41402abc4b2a76b9719d911017c592"
}
```

### Verifying Webhooks

Verify webhook signatures using the secret provided during configuration:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return `sha256=${expectedSignature}` === signature;
}
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @smartaihub/client
```

```javascript
import { SmartAIHubClient } from '@smartaihub/client';

const client = new SmartAIHubClient({
  baseURL: 'https://api.smartaihub.com',
  apiKey: 'your-api-key',
});

// Chat completion
const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

### Python

```bash
pip install smartaihub-python
```

```python
from smartaihub import SmartAIHubClient

client = SmartAIHubClient(
    base_url='https://api.smartaihub.com',
    api_key='your-api-key'
)

# Chat completion
response = client.chat.completions.create(
    model='gpt-4',
    messages=[{'role': 'user', 'content': 'Hello!'}]
)
```

## Changelog

### v1.0.0 (2023-10-15)

- Initial API release
- Authentication endpoints
- User management
- Credit system
- MCP endpoints
- Notification system
- Admin endpoints

---

For more information, visit our [documentation](https://docs.smartaihub.com) or [support portal](https://support.smartaihub.com).
