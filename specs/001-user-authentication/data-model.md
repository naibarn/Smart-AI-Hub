# Data Model Specification

## Overview

This document defines the data models for the User Authentication System, including database schemas, data structures, and relationships between entities.

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  google_id VARCHAR(255) UNIQUE,
  sora2_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_sora2_id ON users(sora2_id);
CREATE INDEX idx_users_verified ON users(verified);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  token VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### Verification Tokens Table

```sql
CREATE TABLE verification_tokens (
  token VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'email', 'password', 'sora2'
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_type ON verification_tokens(type);
CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at);
```

### OAuth Providers Table

```sql
CREATE TABLE oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'sora2'
  provider_id VARCHAR(255) NOT NULL,
  provider_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_id)
);

-- Indexes
CREATE INDEX idx_oauth_providers_user_id ON oauth_providers(user_id);
CREATE INDEX idx_oauth_providers_provider ON oauth_providers(provider);
```

## Session Storage (Redis)

### Session Data Structure

```json
{
  "token": "VERIFIED-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "userId": "user_12345",
  "clientId": "client_67890",
  "createdAt": "2025-01-15T10:00:00Z",
  "expiresAt": "2025-01-22T10:00:00Z",
  "lastAccessAt": "2025-01-15T12:30:00Z",
  "metadata": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "integrationType": "third_party_app"
  },
  "revoked": false
}
```

### Redis Keys Structure

```
session:{token}                   # Main session data
user:{userId}:sessions             # Set of session tokens for a user
client:{clientId}:sessions         # Set of session tokens for a client
sessions:revoked                  # Set of revoked session tokens
```

## Verification Code Storage (Redis)

### Verification Session Data Structure

```json
{
  "sessionId": "session_12345",
  "verificationCode": "VERIFIED-A1B2C3D4E5F6G7H8",
  "userId": "user_67890",
  "clientId": "custom_gpt",
  "returnTo": "chatgpt",
  "createdAt": "2025-01-15T10:00:00Z",
  "expiresAt": "2025-01-22T10:00:00Z",
  "verifiedAt": "2025-01-15T10:05:00Z",
  "metadata": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "integrationType": "custom_gpt"
  }
}
```

### Redis Keys Structure for Verification Codes

```
verification:{code}               # Verification code data
verification:session:{sessionId}  # Session data
code:{code}:session               # Code to session mapping
```

## Data Types and Formats

### User ID

- **Format**: UUID v4
- **Example**: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
- **Validation**: Must be a valid UUID

### Email

- **Format**: Standard email format
- **Example**: "user@example.com"
- **Validation**: RFC 5322 compliant
- **Constraints**: Max 255 characters

### Password Hash

- **Format**: Bcrypt hash
- **Example**: "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"
- **Validation**: Valid bcrypt hash
- **Constraints**: Cost factor 12

### Token Formats

#### JWT Access Token

- **Format**: JWT
- **Algorithm**: HS256
- **Expiration**: 15 minutes
- **Example**: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

#### JWT Refresh Token

- **Format**: JWT
- **Algorithm**: HS256
- **Expiration**: 7 days
- **Example**: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

#### Session Token

- **Format**: VERIFIED-{32-character random string}
- **Example**: "VERIFIED-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
- **Charset**: A-Z, a-z, 0-9

#### Verification Code

- **Format**: VERIFIED-{16-character random string}
- **Example**: "VERIFIED-A1B2C3D4E5F6G7H8"
- **Charset**: A-Z, 0-9

## Data Validation Rules

### User Registration

```json
{
  "email": {
    "required": true,
    "type": "string",
    "format": "email",
    "maxLength": 255
  },
  "password": {
    "required": true,
    "type": "string",
    "minLength": 8,
    "pattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
  }
}
```

### User Login

```json
{
  "email": {
    "required": true,
    "type": "string",
    "format": "email"
  },
  "password": {
    "required": true,
    "type": "string"
  }
}
```

### Session Creation

```json
{
  "userId": {
    "required": true,
    "type": "string",
    "format": "uuid"
  },
  "clientId": {
    "required": true,
    "type": "string",
    "minLength": 1,
    "maxLength": 100
  },
  "metadata": {
    "type": "object",
    "properties": {
      "ip": {
        "type": "string",
        "format": "ipv4"
      },
      "userAgent": {
        "type": "string",
        "maxLength": 500
      },
      "integrationType": {
        "type": "string",
        "maxLength": 100
      }
    }
  }
}
```

## Error Payloads

### Standard Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "email",
      "issue": "Invalid format"
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_1234567890"
  }
}
```

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| INVALID_CREDENTIALS | 401 | Email or password is incorrect |
| UNAUTHORIZED | 401 | No authentication provided |
| FORBIDDEN | 403 | Access denied to resource |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Request validation failed |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error |
| EMAIL_ALREADY_EXISTS | 409 | Email address already registered |
| INVALID_TOKEN | 401 | Token is invalid or expired |
| SESSION_NOT_FOUND | 404 | Session not found or expired |
| VERIFICATION_CODE_INVALID | 400 | Verification code is invalid |
| VERIFICATION_CODE_EXPIRED | 400 | Verification code has expired |

## Data Migration

### Migration Scripts

#### Create Users Table

```sql
-- Migration: 001_create_users_table.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  google_id VARCHAR(255) UNIQUE,
  sora2_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_sora2_id ON users(sora2_id);
CREATE INDEX idx_users_verified ON users(verified);
```

#### Create Refresh Tokens Table

```sql
-- Migration: 002_create_refresh_tokens_table.sql
CREATE TABLE refresh_tokens (
  token VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

#### Create Verification Tokens Table

```sql
-- Migration: 003_create_verification_tokens_table.sql
CREATE TABLE verification_tokens (
  token VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_type ON verification_tokens(type);
CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at);
```

#### Create OAuth Providers Table

```sql
-- Migration: 004_create_oauth_providers_table.sql
CREATE TABLE oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  provider_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_id)
);

CREATE INDEX idx_oauth_providers_user_id ON oauth_providers(user_id);
CREATE INDEX idx_oauth_providers_provider ON oauth_providers(provider);
```

## Data Retention

### Retention Policies

| Data Type | Retention Period | Cleanup Method |
|-----------|------------------|----------------|
| Verification Tokens | 24 hours | Automatic TTL expiration |
| Password Reset Tokens | 1 hour | Automatic TTL expiration |
| Session Tokens | 7 days (configurable) | Automatic TTL expiration |
| Refresh Tokens | 7 days | Manual cleanup job |
| Audit Logs | 90 days | Manual cleanup job |

### Cleanup Jobs

#### Expired Tokens Cleanup

```sql
-- Clean up expired refresh tokens
DELETE FROM refresh_tokens WHERE expires_at < NOW();

-- Clean up expired verification tokens
DELETE FROM verification_tokens WHERE expires_at < NOW();
```

#### Audit Log Cleanup

```sql
-- Clean up old audit logs (older than 90 days)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

## Security Considerations

### Data Encryption

- **Passwords**: Bcrypt hashing with cost factor 12
- **Tokens**: Signed with HMAC-SHA256
- **PII**: Encrypted at rest using AES-256

### Access Controls

- **Database**: Role-based access control
- **Redis**: Password authentication and network isolation
- **API**: JWT-based authentication

### Audit Logging

All authentication events are logged with:

```json
{
  "eventId": "evt_1234567890",
  "userId": "user_12345",
  "eventType": "login_success",
  "timestamp": "2025-01-15T10:30:00Z",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "provider": "google",
    "sessionId": "sess_123456"
  }
}
```

## Performance Optimization

### Database Indexing

- Primary keys are automatically indexed
- Foreign keys are indexed for join performance
- Frequently queried fields have dedicated indexes
- Composite indexes for complex queries

### Caching Strategy

- User sessions cached in Redis with TTL
- Frequently accessed user data cached
- API rate limiting implemented in Redis
- Blacklisted tokens cached for fast lookup

### Connection Pooling

- Database connection pool configured
- Redis connection pool implemented
- Connection timeouts and retry logic

## Monitoring and Observability

### Metrics

- Authentication success/failure rates
- Token generation and validation times
- Database query performance
- Redis memory usage and hit rates

### Health Checks

- Database connectivity check
- Redis connectivity check
- JWT signing key validation
- Email service connectivity

### Alerts

- High authentication failure rate
- Database connection issues
- Redis memory pressure
- Token generation failures