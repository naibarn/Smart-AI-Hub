# Sora2 Integration Documentation

This document provides comprehensive information about the Sora2 Video Generator integration endpoints implemented in the Smart AI Hub.

## Overview

The Sora2 integration requires three main components:

1. **Session Management**: OAuth verification code system for authentication
2. **Credit Management**: Credit checking and deduction for video generation
3. **OAuth Integration**: Modified Google OAuth flow to support session parameters

## Endpoints

### 1. Session Verification Endpoint

#### GET /api/auth/verify-session

Verifies a session token and returns user information.

**Headers:**
- `X-Session-Token`: Session token in format `VERIFIED-{code}`

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "expiresAt": "2025-01-22T10:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid session token
- `500 Internal Server Error`: Server error

**Implementation Details:**
- Session tokens are stored in Redis with 7-day expiration
- Format: `VERIFIED-{random_string}`
- Created during OAuth callback with session parameter

### 2. Credit Check Endpoint

#### POST /api/mcp/v1/credits/check

Checks if a user has sufficient credits for a service.

**Headers:**
- `X-User-ID`: User UUID

**Request Body:**
```json
{
  "service": "sora2-video-generation",
  "cost": 30
}
```

**Response (200 OK):**
```json
{
  "sufficient": true,
  "balance": 150
}
```

**Error Responses:**
- `400 Bad Request`: Missing user ID, service, or cost
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

### 3. Credit Deduction Endpoint

#### POST /api/mcp/v1/credits/deduct

Deducts credits for a service usage and creates a transaction record.

**Headers:**
- `X-User-ID`: User UUID

**Request Body:**
```json
{
  "service": "sora2-video-generation",
  "cost": 30,
  "metadata": {
    "videoId": "video-uuid",
    "duration": 60,
    "resolution": "1080p"
  }
}
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "new_balance": 120,
  "transaction_id": "transaction-uuid"
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `402 Payment Required`: Insufficient credits
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

**Implementation Details:**
- Uses database transactions for atomic operations
- Creates credit transaction records
- Updates user credit account balance

### 4. Google OAuth with Session Support

#### GET /api/auth/google

Initiates Google OAuth flow with optional session parameters.

**Query Parameters:**
- `session` (optional): Session ID for verification code flow
- `return_to` (optional): Destination after authentication (default: "chatgpt")

**Flow:**
1. Generate state parameter with session data
2. Store state in Redis (10-minute expiration)
3. Redirect to Google OAuth

#### OAuth Callback

Handles Google OAuth callback and creates verification codes for session-based flow.

**Session-based Flow (when session parameter provided):**
1. Generate verification code: `VERIFIED-{random_string}`
2. Store verification code in Redis (10-minute expiration)
3. Redirect to success page with verification code

**Traditional Flow (when no session parameter):**
1. Generate JWT tokens
2. Redirect to frontend with tokens

#### Success Page

**URL:** `/oauth-success.html`

Displays authentication success with either:
- Verification code (session-based flow)
- Success message (traditional flow)

## Integration Flow

### Sora2 Video Generation Flow

1. **Initiate OAuth**
   ```
   GET /api/auth/google?session=SESSION_ID&return_to=chatgpt
   ```

2. **User Authentication**
   - User authenticates with Google
   - OAuth callback creates verification code
   - User sees success page with verification code

3. **Verification Code Exchange**
   - Sora2 receives verification code from user
   - Sora2 calls session verification endpoint:
   ```
   GET /api/auth/verify-session
   Headers: X-Session-Token: VERIFIED-{code}
   ```

4. **Credit Check**
   - Sora2 checks user credits:
   ```
   POST /api/mcp/v1/credits/check
   Headers: X-User-ID: {user_id}
   Body: { service: "sora2-video-generation", cost: 30 }
   ```

5. **Video Generation**
   - If credits sufficient, Sora2 generates video
   - Sora2 deducts credits:
   ```
   POST /api/mcp/v1/credits/deduct
   Headers: X-User-ID: {user_id}
   Body: { 
     service: "sora2-video-generation", 
     cost: 30,
     metadata: { videoId: "video-uuid" }
   }
   ```

## Security Considerations

### Session Management
- Session tokens have 7-day expiration
- Verification codes have 10-minute expiration
- Redis storage for fast access and automatic cleanup
- CSRF protection via state parameters

### Credit Management
- Atomic transactions prevent race conditions
- Credit balance validation before deduction
- Transaction logging for audit trail
- Rollback mechanism for failed operations

### OAuth Security
- State parameter validation
- IP and User-Agent verification
- Secure token generation
- Limited verification code lifetime

## Error Handling

### Common Error Codes
- `400 Bad Request`: Invalid input parameters
- `401 Unauthorized`: Invalid session token
- `402 Payment Required`: Insufficient credits
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

### Error Response Format
```json
{
  "success": false,
  "message": "Error description"
}
```

## Monitoring and Logging

### Key Metrics
- OAuth initiation and completion rates
- Credit check and deduction operations
- Session verification success/failure rates
- Error rates by endpoint

### Log Messages
- OAuth flow events
- Credit transaction details
- Session creation and verification
- Security alerts (IP mismatches, etc.)

## Testing

### Unit Tests
- Session verification endpoint tests
- Credit check and deduction tests
- OAuth flow simulation tests

### Integration Tests
- End-to-end OAuth flow with session parameters
- Credit management workflow
- Error handling scenarios

### Test Files
- `packages/auth-service/src/__tests__/session.test.js`
- `packages/auth-service/src/__tests__/oauth.sora2.test.js`
- `packages/core-service/src/__tests__/credit.sora2.test.ts`

## Deployment Notes

### Environment Variables
- `REDIS_URL`: Redis connection string
- `FRONTEND_URL`: Frontend application URL
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: OAuth callback URL

### API Gateway Configuration
Update API Gateway routes to proxy the new endpoints:
- `/api/auth/verify-session` → auth-service
- `/api/mcp/v1/credits/*` → core-service
- `/oauth-success.html` → auth-service (static file)

## Troubleshooting

### Common Issues

1. **Session verification fails**
   - Check Redis connection
   - Verify session token format
   - Check token expiration

2. **Credit operations fail**
   - Verify database connection
   - Check user credit account exists
   - Review transaction logs

3. **OAuth flow issues**
   - Verify Google OAuth configuration
   - Check state parameter storage
   - Review callback URL configuration

### Debug Commands
```bash
# Check Redis sessions
redis-cli keys "session:*"
redis-cli keys "verification_code:*"
redis-cli keys "oauth_state:*"

# Check database transactions
SELECT * FROM credit_transactions WHERE user_id = 'user-uuid';

# Verify API Gateway routes
curl -X GET http://api-gateway/api/auth/verify-session \
  -H "X-Session-Token: VERIFIED-test"