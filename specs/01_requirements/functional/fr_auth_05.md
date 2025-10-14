# FR-AUTH-05: Session-Based Authentication

## Priority
High

## Description
Support session-based authentication for third-party integrations

## Requirements
- Generate secure session tokens (format: VERIFIED-{random_string})
- Store sessions in Redis with configurable expiration (default: 7 days)
- Provide API endpoint to verify session tokens
- Return user identity (ID, email, name) for valid sessions
- Support session revocation
- Handle session expiration gracefully

## Acceptance Criteria
- Session tokens are cryptographically secure
- Session verification responds within 100ms
- Expired sessions return 401 Unauthorized
- Invalid sessions return 404 Not Found