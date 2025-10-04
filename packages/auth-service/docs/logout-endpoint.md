# Logout Endpoint with Token Blacklist

## Overview

The logout endpoint (`POST /api/auth/logout`) implements a secure logout mechanism that blacklists both access and refresh tokens to prevent their reuse after logout.

## Implementation Details

### Endpoint

```
POST /api/auth/logout
Headers:
  Authorization: Bearer {accessToken}

Body:
{
  "refreshToken": "eyJ..."
}
```

### Flow

1. **Authentication**: The endpoint requires a valid access token in the Authorization header
2. **Token Extraction**: Extracts the JWT ID (jti) and expiration time from the access token
3. **Access Token Blacklisting**: Adds the access token's jti to Redis blacklist with TTL equal to remaining token lifetime
4. **Refresh Token Removal**: Removes the refresh token from Redis storage (key: `refresh_token:{userId}`)
5. **Refresh Token Blacklisting**: Verifies and blacklists the provided refresh token if valid

### Security Features

- **Token Blacklist**: Prevents reuse of tokens after logout
- **TTL Management**: Automatically cleans up expired blacklist entries
- **Graceful Handling**: Handles invalid/expired refresh tokens without failing the logout process

## Code Components

### 1. JWT Utility (src/utils/jwt.js)

- Added `generateJTI()` function to create unique JWT IDs using crypto.randomBytes()
- Updated `generateAccessToken()` and `generateRefreshToken()` to include jti

### 2. Redis Configuration (src/config/redis.js)

- Added `addToBlacklist(jti, expiresIn)` function
- Added `isTokenBlacklisted(jti)` function for checking blacklist status

### 3. Auth Middleware (src/middleware/auth.js)

- Updated to extract jti and exp from decoded token
- Added blacklist check before allowing access
- Stores token info in `req.token` for use in logout

### 4. Validation (src/middleware/validation.js)

- Added `logoutSchema` for request body validation
- Added `validateLogout()` middleware function

### 5. Auth Controller (src/controllers/auth.controller.js)

- Implemented `logout()` function with token blacklisting
- Calculates TTL based on remaining token lifetime
- Handles both access and refresh token blacklisting

### 6. Auth Routes (src/routes/auth.routes.js)

- Updated logout route to include validation middleware

## Testing

Comprehensive test suite in `src/__tests__/logout.test.js` covers:

- Successful logout with valid tokens
- Logout without refresh token
- Validation error handling
- Missing authorization header
- Invalid refresh token handling
- TTL calculation verification

## Redis Keys

- Blacklist: `blacklist:{jti}`
- Refresh Token: `refresh_token:{userId}`

## Error Responses

- `401`: No token provided / Invalid token / Token revoked
- `400`: Validation failed (missing refresh token)
- `500`: Internal server error
