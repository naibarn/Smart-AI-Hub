# Google OAuth 2.0 Implementation

This document describes the Google OAuth 2.0 authentication implementation for the Smart AI Hub Auth Service.

## Overview

The Google OAuth implementation allows users to authenticate using their Google accounts. It includes:

- Secure OAuth flow with CSRF protection
- Account linking for existing users
- Automatic account creation for new users
- JWT token generation
- Rate limiting and security measures

## Prerequisites

1. Create a Google Cloud Console project
2. Enable Google+ API (or People API)
3. Create OAuth 2.0 credentials
4. Add callback URL: `http://localhost:3001/api/auth/google/callback`

## Environment Variables

Add the following variables to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:3000
```

## Implementation Details

### Files Created/Modified

1. **`src/config/passport.js`** - Passport configuration with Google OAuth strategy
2. **`src/routes/oauth.routes.js`** - OAuth routes for Google authentication
3. **`src/utils/jwt.js`** - Added `generateTokens` function
4. **`src/app.js`** - Integrated OAuth routes and passport initialization
5. **`.env`** - Added Google OAuth environment variables

### OAuth Flow

1. **Initiation**: `GET /api/auth/google`
   - Generates state parameter for CSRF protection
   - Stores state in Redis with 10-minute expiration
   - Redirects to Google OAuth with state parameter

2. **Callback**: `GET /api/auth/google/callback`
   - Verifies state parameter for CSRF protection
   - Handles Google OAuth response
   - Creates or links user account
   - Generates JWT tokens
   - Redirects to frontend with tokens

3. **Status**: `GET /api/auth/oauth/status`
   - Returns OAuth configuration status
   - Useful for frontend to check if OAuth is enabled

### Account Linking Logic

The implementation handles the following scenarios:

1. **Existing user with Google ID**: Returns existing user
2. **Existing user without Google ID**: Links Google account to existing user
3. **New user**: Creates new user with Google account information

### Security Features

1. **CSRF Protection**: State parameter stored in Redis
2. **Rate Limiting**: 10 requests per minute per IP for OAuth endpoints
3. **IP Verification**: Optional IP matching for additional security
4. **Token Security**: JWT tokens with proper expiration
5. **Logging**: All OAuth events are logged for security monitoring

### Database Schema

The User model already includes the necessary fields:

- `googleId` - Stores Google user ID
- `emailVerified` - Automatically set to true for OAuth users

## API Endpoints

### GET /api/auth/google

Initiates Google OAuth flow.

**Response**: Redirect to Google OAuth

### GET /api/auth/google/callback

Handles Google OAuth callback.

**Query Parameters**:

- `code` - Authorization code from Google
- `state` - State parameter for CSRF protection

**Response**: Redirect to frontend with tokens or error

### GET /api/auth/oauth/status

Returns OAuth configuration status.

**Response**:

```json
{
  "success": true,
  "google": {
    "enabled": true,
    "callbackUrl": "http://localhost:3001/api/auth/google/callback"
  }
}
```

## Testing

Run the integration test to verify the implementation:

```bash
cd packages/auth-service
node test-oauth-integration.js
```

## Frontend Integration

### Sign in with Google Button

Add a button that redirects to `/api/auth/google`:

```html
<a href="/api/auth/google" class="btn-google"> Sign in with Google </a>
```

### Handle OAuth Callback

Create callback pages to handle OAuth responses:

1. **Success Page**: `/auth/success`
   - Extract tokens from URL parameters
   - Store tokens in localStorage or secure storage
   - Redirect to dashboard

2. **Error Page**: `/auth/error`
   - Display error message to user
   - Provide option to try again

Example success handler:

```javascript
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('accessToken');
const refreshToken = urlParams.get('refreshToken');

if (accessToken && refreshToken) {
  // Store tokens securely
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  // Redirect to dashboard
  window.location.href = '/dashboard';
}
```

## Production Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Environment Variables**: Use secure environment variable management
3. **Domain Validation**: Add authorized domains in Google Cloud Console
4. **Monitoring**: Monitor OAuth events and failed attempts
5. **Rate Limiting**: Adjust rate limits based on your needs

## Troubleshooting

### Common Issues

1. **Invalid Client ID/Secret**: Verify Google Cloud Console credentials
2. **Redirect URI Mismatch**: Ensure callback URL matches Google Console configuration
3. **State Parameter Issues**: Check Redis connection and state storage
4. **Rate Limiting**: Monitor Redis for rate limit storage

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will enable detailed logging of OAuth events.

## Dependencies

- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth strategy
- `express-rate-limit` - Rate limiting
- `uuid` - Generate unique state parameters
- `redis` - Store state parameters and rate limiting

## Security Best Practices

1. Always validate state parameters
2. Implement proper rate limiting
3. Log all OAuth events
4. Use HTTPS in production
5. Regularly rotate client secrets
6. Monitor for suspicious activity
7. Implement proper session management
