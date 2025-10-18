# Credit Controller

The Credit Controller provides endpoints for managing user credits in the Smart AI Hub system.

## Features

- Get user credit balance with Redis caching
- View credit transaction history with pagination
- Redeem promo codes for credits
- Admin functions for adjusting user credits
- Admin functions for viewing user credit information

## Endpoints

### User Endpoints

#### GET /api/credits/balance

Get the current user's credit balance.

**Authentication:** Required (JWT)
**Permissions:** `credits:read`

**Response:**

```json
{
  "data": {
    "balance": 100,
    "lastUpdate": "2023-10-03T09:30:00.000Z"
  },
  "meta": {
    "cached": false
  },
  "error": null
}
```

#### GET /api/credits/history

Get the current user's credit transaction history.

**Authentication:** Required (JWT)
**Permissions:** `credits:read`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 20, max: 100)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "amount": 50,
      "type": "promo",
      "description": "Redeemed promo code: WELCOME10",
      "createdAt": "2023-10-03T09:30:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  },
  "error": null
}
```

#### POST /api/credits/redeem

Redeem a promo code for credits.

**Authentication:** Required (JWT)
**Permissions:** `credits:write`

**Request Body:**

```json
{
  "code": "WELCOME10"
}
```

**Response:**

```json
{
  "data": {
    "success": true,
    "credits": 50,
    "message": "Successfully redeemed 50 credits"
  },
  "meta": null,
  "error": null
}
```

### Admin Endpoints

#### POST /api/admin/credits/adjust

Adjust user credits (admin only).

**Authentication:** Required (JWT)
**Permissions:** Admin or Superadmin role

**Request Parameters:**

- `userId` (path): User ID to adjust credits for

**Request Body:**

```json
{
  "amount": 100,
  "reason": "Refund for service issue"
}
```

**Response:**

```json
{
  "data": {
    "success": true,
    "newBalance": 150
  },
  "meta": null,
  "error": null
}
```

#### GET /api/admin/credits/:userId

Get user credit information (admin only).

**Authentication:** Required (JWT)
**Permissions:** `credits:read`

**Request Parameters:**

- `userId` (path): User ID to get credit information for

**Response:**

```json
{
  "data": {
    "balance": {
      "balance": 100,
      "lastUpdate": "2023-10-03T09:30:00.000Z"
    },
    "recentTransactions": [
      {
        "id": "uuid",
        "userId": "uuid",
        "amount": 50,
        "type": "promo",
        "description": "Redeemed promo code: WELCOME10",
        "createdAt": "2023-10-03T09:30:00.000Z"
      }
    ]
  },
  "meta": null,
  "error": null
}
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "data": null,
  "meta": null,
  "error": {
    "message": "Error description",
    "stack": "Error stack trace (development only)"
  }
}
```

Common error codes:

- `400`: Bad Request (invalid input)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error

## Caching

Credit balance responses are cached in Redis for 60 seconds to improve performance. The cache is automatically invalidated when:

- A user redeems a promo code
- An admin adjusts user credits

## Dependencies

- Express.js for routing
- Redis for caching
- Prisma for database operations
- Custom error handling middleware
- Authentication middleware
- RBAC middleware for permissions
