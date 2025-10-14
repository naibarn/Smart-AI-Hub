# Authentication Service

## Overview

The Authentication Service handles all user authentication, authorization, and identity management functions for the Smart AI Hub platform. It supports traditional email/password authentication as well as OAuth integration with external providers.

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.x
- **Port**: 3001
- **Language**: TypeScript 5.x
- **Authentication**: Passport.js + JWT
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+

## Responsibilities

1. **User Registration & Login**: Handle new user registration and authentication
2. **JWT Token Management**: Generate and validate access and refresh tokens
3. **OAuth 2.0 Integration**: Support for Google and Sora2 OAuth providers
4. **Password Security**: Secure password hashing with bcrypt
5. **Email Verification**: Verify user email addresses
6. **Password Reset**: Secure password recovery functionality
7. **Session Management**: Track and invalidate user sessions

## Database Tables

### Users Table
```sql
users (id, email, password_hash, verified, google_id, created_at, updated_at)
```

### Refresh Tokens Table
```sql
refresh_tokens (token, user_id, expires_at)
```

### Verification Tokens Table
```sql
verification_tokens (token, user_id, type, expires_at)
```

## External Dependencies

- **PostgreSQL**: Store user data and authentication records
- **Redis**: Token blacklist, rate limiting, and session storage
- **SendGrid**: Email service for verification and password reset
- **Google OAuth 2.0**: Third-party authentication provider
- **Sora2 Video API**: OAuth integration for video generation services

## API Endpoints

```
POST /register          // User registration
POST /login             // User login
POST /logout            // User logout (blacklist token)
POST /refresh           // Refresh access token
POST /verify-email      // Email verification
POST /forgot-password   // Request password reset
POST /reset-password    // Reset password
GET /me                 // Current user info
GET /oauth/google       // Google OAuth initiate
GET /oauth/google/callback // Google OAuth callback
GET /oauth/sora2        // Sora2 OAuth initiate
GET /oauth/sora2/callback // Sora2 OAuth callback
POST /oauth/session/verify // Verify session code
POST /oauth/session/confirm // Confirm session with parameters
```

## JWT Configuration

```typescript
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
    algorithm: 'HS256',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256',
  },
};

// Token Payload Structure
interface JWTPayload {
  sub: string; // User ID
  email: string;
  role: string;
  iat: number; // Issued at
  exp: number; // Expiration
  jti: string; // JWT ID (for revocation)
}
```

## Password Policy

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character
- Bcrypt cost factor: 12

## OAuth Integration

### Google OAuth Flow
1. User initiates OAuth via `/oauth/google`
2. Redirect to Google's authorization page
3. Google redirects to callback with authorization code
4. Exchange code for access token and user profile
5. Create or update user account
6. Generate JWT tokens for the user

### Sora2 OAuth Flow
1. User initiates OAuth via `/oauth/sora2`
2. Create session with verification code
3. Send verification code via email
4. User verifies code via `/oauth/session/verify`
5. Complete OAuth flow with `/oauth/session/confirm`
6. Generate JWT tokens for the user

## Security Features

- Password hashing with bcrypt (cost factor: 12)
- JWT token blacklisting for logout
- Rate limiting on authentication endpoints
- Email verification for new accounts
- Secure password reset with time-limited tokens
- CSRF protection
- Session management with Redis

## Token Management

- Access tokens: 15-minute expiration
- Refresh tokens: 7-day expiration
- Token blacklist for revoked tokens
- Automatic token refresh mechanism
- Secure token storage recommendations

## Email Services

- Welcome emails for new registrations
- Email verification notifications
- Password reset emails
- OAuth verification codes
- Security alerts for suspicious activities