# User Management API Documentation

## Overview

This document provides comprehensive documentation for the User Management API endpoints in the Smart AI Hub system. The API is built with TypeScript and follows RESTful principles.

## Base URL

```
https://api.smart-ai-hub.com
```

## Authentication

All API endpoints require authentication using JWT (JSON Web Tokens). Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## User Management Endpoints

### 1. Get Current User Profile

**Endpoint:** `GET /users/me`

**Description:** Retrieves the profile information of the currently authenticated user.

**Authentication:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "tier": "general",
    "verified": true,
    "isBlocked": false,
    "credits": 100,
    "points": 500,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "profile": {
      "userId": "user-123",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "https://example.com/avatar.jpg",
      "preferences": {
        "theme": "light",
        "language": "en"
      },
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### 2. Update Current User Profile

**Endpoint:** `PUT /users/me`

**Description:** Updates the profile information of the currently authenticated user.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "timezone": "UTC",
  "language": "en",
  "preferences": {
    "theme": "dark",
    "emailNotifications": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "profile": {
      "userId": "user-123",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "https://example.com/new-avatar.jpg",
      "preferences": {
        "theme": "dark",
        "language": "en",
        "emailNotifications": true
      },
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### 3. Search and Filter Users

**Endpoint:** `GET /users`

**Description:** Searches and filters users based on various criteria. Requires admin privileges.

**Authentication:** Required (JWT with admin permissions)

**Query Parameters:**
- `query` (string): Search term for email, name, etc.
- `tier` (string): Filter by user tier (administrator, agency, organization, admin, general)
- `isBlocked` (boolean): Filter by blocked status
- `isVerified` (boolean): Filter by verification status
- `page` (number): Page number (default: 1)
- `limit` (number): Number of results per page (default: 20, max: 100)
- `sortBy` (string): Sort field (createdAt, updatedAt, email, tier, credits, points)
- `sortOrder` (string): Sort order (asc, desc)
- `createdAfter` (date): Filter users created after this date
- `createdBefore` (date): Filter users created before this date
- `minCredits` (number): Minimum credits
- `maxCredits` (number): Maximum credits
- `minPoints` (number): Minimum points
- `maxPoints` (number): Maximum points

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "email": "user@example.com",
        "tier": "general",
        "verified": true,
        "isBlocked": false,
        "credits": 100,
        "points": 500,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "profile": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 4. Create New User

**Endpoint:** `POST /users`

**Description:** Creates a new user account. Requires admin privileges.

**Authentication:** Required (JWT with admin permissions)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "tier": "general",
  "parentAgencyId": "agency-123",
  "parentOrganizationId": "org-123",
  "inviteCode": "INVITE-123",
  "roles": ["user"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-456",
    "email": "newuser@example.com",
    "tier": "general",
    "verified": false,
    "isBlocked": false,
    "credits": 0,
    "points": 0,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "profile": {
      "userId": "user-456",
      "firstName": "Jane",
      "lastName": "Smith"
    }
  }
}
```

### 5. Get User Statistics

**Endpoint:** `GET /users/statistics`

**Description:** Retrieves statistics about users in the system. Requires admin privileges.

**Authentication:** Required (JWT with admin permissions)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "activeUsers": 850,
    "blockedUsers": 50,
    "verifiedUsers": 900,
    "usersByTier": {
      "administrator": 5,
      "agency": 20,
      "organization": 50,
      "admin": 25,
      "general": 900
    },
    "recentRegistrations": 25,
    "recentActivity": 150
  }
}
```

### 6. Bulk User Operations

**Endpoint:** `POST /users/bulk`

**Description:** Performs bulk operations on multiple users. Requires admin privileges.

**Authentication:** Required (JWT with admin permissions)

**Request Body:**
```json
{
  "userIds": ["user-123", "user-456", "user-789"],
  "operation": "deactivate",
  "reason": "Policy violation",
  "roleId": "role-123" // Required for assignRole and removeRole operations
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "successful": ["user-123", "user-456"],
    "failed": [
      {
        "userId": "user-789",
        "error": "User not found"
      }
    ],
    "totalProcessed": 3,
    "successCount": 2,
    "failureCount": 1
  }
}
```

### 7. Get User by ID

**Endpoint:** `GET /users/:id`

**Description:** Retrieves a specific user by ID. Requires admin privileges or self-access.

**Authentication:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "tier": "general",
    "verified": true,
    "isBlocked": false,
    "credits": 100,
    "points": 500,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "profile": {
      "userId": "user-123",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "roles": [
      {
        "id": "role-123",
        "name": "user",
        "description": "Regular user",
        "isSystem": true
      }
    ]
  }
}
```

### 8. Update User

**Endpoint:** `PUT /users/:id`

**Description:** Updates a specific user's information. Requires admin privileges.

**Authentication:** Required (JWT with admin permissions)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "timezone": "UTC",
  "language": "en",
  "preferences": {
    "theme": "dark",
    "emailNotifications": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "profile": {
      "userId": "user-123",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "https://example.com/new-avatar.jpg",
      "preferences": {
        "theme": "dark",
        "language": "en",
        "emailNotifications": true
      },
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### 9. Deactivate User

**Endpoint:** `POST /users/:id/deactivate`

**Description:** Deactivates a user account. Requires admin privileges.

**Authentication:** Required (JWT with admin permissions)

**Request Body:**
```json
{
  "reason": "Policy violation",
  "notifyUser": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "isBlocked": true,
    "blockedReason": "Policy violation",
    "blockedAt": "2023-01-01T00:00:00.000Z",
    "blockedBy": "admin-123"
  }
}
```

### 10. Reactivate User

**Endpoint:** `POST /users/:id/reactivate`

**Description:** Reactivates a deactivated user account. Requires admin privileges.

**Authentication:** Required (JWT with admin permissions)

**Request Body:**
```json
{
  "reason": "Issue resolved",
  "notifyUser": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "isBlocked": false,
    "blockedReason": null,
    "blockedAt": null,
    "blockedBy": null
  }
}
```

### 11. Delete User

**Endpoint:** `DELETE /users/:id`

**Description:** Permanently deletes a user account. Requires admin privileges.

**Authentication:** Required (JWT with admin permissions)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "deleted": true
  }
}
```

## User Audit Log Endpoints

### 1. Create User Audit Log

**Endpoint:** `POST /user-audit`

**Description:** Creates a new audit log entry for user actions. Requires admin or moderator privileges.

**Authentication:** Required (JWT with admin or moderator permissions)

**Request Body:**
```json
{
  "userId": "user-123",
  "action": "profile_updated",
  "reason": "User updated their profile information",
  "metadata": {
    "fields": ["firstName", "lastName"],
    "oldValues": ["John", "Doe"],
    "newValues": ["Jane", "Smith"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "audit-123",
    "userId": "user-123",
    "action": "profile_updated",
    "performedBy": "admin-123",
    "reason": "User updated their profile information",
    "metadata": {
      "fields": ["firstName", "lastName"],
      "oldValues": ["John", "Doe"],
      "newValues": ["Jane", "Smith"]
    },
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 2. Get User Audit Logs

**Endpoint:** `GET /user-audit/user/:userId`

**Description:** Retrieves audit logs for a specific user. Requires admin or moderator privileges.

**Authentication:** Required (JWT with admin or moderator permissions)

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Number of results per page (default: 20, max: 100)
- `action` (string): Filter by action type
- `startDate` (date): Filter logs after this date
- `endDate` (date): Filter logs before this date

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "audit-123",
        "userId": "user-123",
        "action": "profile_updated",
        "performedBy": "admin-123",
        "reason": "User updated their profile information",
        "metadata": {
          "fields": ["firstName", "lastName"]
        },
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 3. Get All Audit Logs

**Endpoint:** `GET /user-audit/all`

**Description:** Retrieves all audit logs with filtering options. Requires admin privileges.

**Authentication:** Required (JWT with admin permissions)

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Number of results per page (default: 20, max: 100)
- `userId` (string): Filter by user ID
- `action` (string): Filter by action type
- `startDate` (date): Filter logs after this date
- `endDate` (date): Filter logs before this date

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "audit-123",
        "userId": "user-123",
        "action": "profile_updated",
        "performedBy": "admin-123",
        "reason": "User updated their profile information",
        "metadata": {
          "fields": ["firstName", "lastName"]
        },
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 4. Get Audit Statistics

**Endpoint:** `GET /user-audit/statistics`

**Description:** Retrieves statistics about user audit logs. Requires admin privileges.

**Authentication:** Required (JWT with admin permissions)

**Query Parameters:**
- `userId` (string): Filter statistics by user ID
- `startDate` (date): Filter statistics after this date
- `endDate` (date): Filter statistics before this date

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 1000,
    "actionCounts": {
      "created": 100,
      "updated": 500,
      "deactivated": 50,
      "reactivated": 30,
      "role_assigned": 80,
      "role_removed": 40,
      "password_changed": 120,
      "email_changed": 60,
      "profile_updated": 20
    },
    "recentActivity": [
      {
        "id": "audit-123",
        "userId": "user-123",
        "action": "profile_updated",
        "performedBy": "admin-123",
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "topUsers": [
      {
        "userId": "user-123",
        "count": 50
      }
    ]
  }
}
```

### 5. Clean Up Old Audit Logs

**Endpoint:** `DELETE /user-audit/cleanup`

**Description:** Deletes audit logs older than the specified number of days. Requires admin privileges.

**Authentication:** Required (JWT with admin permissions)

**Request Body:**
```json
{
  "days": 90
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 500
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "validationErrors": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "REQUIRED_FIELD"
    }
  ]
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Data Types

### User Management Tier

- `administrator`: System administrator
- `agency`: Agency user
- `organization`: Organization user
- `admin`: Regular admin
- `general`: Regular user

### User Audit Action

- `created`: User account created
- `updated`: User account updated
- `deactivated`: User account deactivated
- `reactivated`: User account reactivated
- `role_assigned`: Role assigned to user
- `role_removed`: Role removed from user
- `password_changed`: User password changed
- `email_changed`: User email changed
- `profile_updated`: User profile updated
- `login`: User logged in
- `logout`: User logged out

## Rate Limiting

API endpoints are subject to rate limiting to prevent abuse. The current limits are:

- User endpoints: 100 requests per minute per user
- Admin endpoints: 200 requests per minute per admin

## Pagination

Endpoints that return lists of items support pagination with the following parameters:

- `page`: Page number (starting from 1)
- `limit`: Number of items per page (maximum 100)

The response includes pagination information:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Sorting

Endpoints that return lists of items support sorting with the following parameters:

- `sortBy`: Field to sort by
- `sortOrder`: Sort order (`asc` or `desc`)

## Filtering

Endpoints that return lists of items support filtering with various parameters specific to each endpoint. See individual endpoint documentation for available filters.

## SDKs and Libraries

Official SDKs are available for:

- JavaScript/TypeScript
- Python
- Java
- C#

## Support

For API support and questions, contact:

- Email: api-support@smart-ai-hub.com
- Documentation: https://docs.smart-ai-hub.com
- Status Page: https://status.smart-ai-hub.com