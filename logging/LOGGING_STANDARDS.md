# Logging Standards for Smart AI Hub

This document defines the logging standards and best practices for all Smart AI Hub services.

## Log Levels

### Standard Log Levels
- **error**: Error conditions that prevent normal operation
- **warn**: Warning conditions that should be investigated but don't stop operation
- **info**: Informational messages about normal operation
- **debug**: Detailed debugging information (disabled in production)

### When to Use Each Level

#### error
- Database connection failures
- Authentication/authorization failures
- Critical business logic failures
- Unhandled exceptions
- Service unavailable errors

#### warn
- Failed login attempts
- Slow database queries (>1s)
- Rate limiting applied
- Deprecated API usage
- Configuration issues

#### info
- User actions (login, logout, etc.)
- Service startup/shutdown
- Successful operations
- Configuration changes
- Health checks

#### debug
- Detailed request/response information
- Variable values
- Function entry/exit
- Database query details
- External API calls

## Log Format

### Standard Log Structure
All logs must be structured as JSON with the following fields:

```json
{
  "timestamp": "2023-10-15T09:30:00.000Z",
  "level": "info",
  "service": "auth-service",
  "message": "User login successful",
  "userId": "user123",
  "requestId": "req_abc123",
  "duration": 150,
  "additionalField": "value"
}
```

### Required Fields
- **timestamp**: ISO 8601 format (UTC)
- **level**: Log level (error, warn, info, debug)
- **service**: Service name (e.g., auth-service, core-service)
- **message**: Human-readable log message

### Optional Fields
- **userId**: ID of the authenticated user (if applicable)
- **requestId**: Unique request identifier for correlation
- **duration**: Operation duration in milliseconds
- **statusCode**: HTTP status code (for API requests)
- **ip**: Client IP address
- **userAgent**: User agent string
- **error**: Error message (for error logs)
- **stack**: Stack trace (for error logs)
- **operation**: Operation name (e.g., "database_query", "external_api_call")
- **resource**: Resource identifier (e.g., database table, API endpoint)

## Service Naming

### Standard Service Names
- auth-service
- core-service
- mcp-server
- analytics-service
- webhook-service
- api-gateway

### Consistency Rules
- Use lowercase with hyphens
- End with "-service" for microservices
- End with "-server" for server components
- Be consistent across all logs

## Message Formatting

### Best Practices
- Use clear, concise messages
- Include relevant context
- Use present tense for actions
- Start with capital letter
- End with period for complete sentences
- Avoid technical jargon in user-facing messages

### Examples
```
"User login successful."
"Database connection failed."
"Payment processed successfully."
"Rate limit exceeded for user."
```

## Request Logging

### HTTP Request Logs
All HTTP requests should be logged with the following structure:

```json
{
  "timestamp": "2023-10-15T09:30:00.000Z",
  "level": "info",
  "service": "api-gateway",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "duration": 150,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "userId": "user123",
  "requestId": "req_abc123"
}
```

### Request ID Generation
- Generate unique request IDs for all incoming requests
- Include request ID in all related logs
- Pass request ID to downstream services
- Format: `req_<timestamp>_<random>`

## Error Logging

### Error Log Structure
```json
{
  "timestamp": "2023-10-15T09:30:00.000Z",
  "level": "error",
  "service": "core-service",
  "message": "Database connection failed",
  "error": "Connection timeout",
  "stack": "Error: Connection timeout\n    at Database.connect...",
  "userId": "user123",
  "requestId": "req_abc123",
  "operation": "database_query"
}
```

### Error Handling Guidelines
- Always include error message and stack trace
- Include relevant context (user, request, operation)
- Don't log sensitive information (passwords, tokens)
- Use appropriate error levels
- Include correlation IDs

## Performance Logging

### Performance Metrics
```json
{
  "timestamp": "2023-10-15T09:30:00.000Z",
  "level": "info",
  "service": "core-service",
  "message": "Performance: database_query",
  "operation": "database_query",
  "duration": 250,
  "userId": "user123",
  "requestId": "req_abc123",
  "query": "SELECT * FROM users WHERE id = ?"
}
```

### Performance Thresholds
- Log slow operations (>1s) as warnings
- Log very slow operations (>5s) as errors
- Include operation name and duration
- Track database queries, external API calls, file operations

## Security Logging

### Security Events
```json
{
  "timestamp": "2023-10-15T09:30:00.000Z",
  "level": "warn",
  "service": "auth-service",
  "message": "Security: failed_login",
  "event": "failed_login",
  "userId": "user123",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "requestId": "req_abc123",
  "reason": "invalid_password"
}
```

### Security Event Types
- failed_login
- successful_login
- logout
- permission_denied
- token_expired
- suspicious_activity
- data_access

## Business Event Logging

### Business Events
```json
{
  "timestamp": "2023-10-15T09:30:00.000Z",
  "level": "info",
  "service": "core-service",
  "message": "Event: payment_processed",
  "event": "payment_processed",
  "userId": "user123",
  "requestId": "req_abc123",
  "data": {
    "amount": 99.99,
    "currency": "USD",
    "paymentMethod": "credit_card"
  }
}
```

### Business Event Types
- user_registered
- payment_processed
- subscription_created
- credit_added
- webhook_delivered
- analytics_event

## Log Rotation and Retention

### File Rotation
- Rotate logs daily
- Keep 14 days of logs
- Maximum file size: 20MB
- Compress old log files

### Retention Policy
- Development: 7 days
- Staging: 14 days
- Production: 30 days
- Archive critical logs for 1 year

## Sensitive Data Handling

### Never Log
- Passwords
- API keys
- Access tokens
- Credit card numbers
- Personal identification information
- Health information

### Data Masking
- Mask email addresses: `u***@example.com`
- Mask phone numbers: `***-***-1234`
- Mask IP addresses: `192.168.1.***`
- Mask user IDs: `user***`

## Structured Logging Guidelines

### Use Structured Formats
- JSON for all application logs
- Key-value pairs for additional context
- Consistent field naming
- Proper data types

### Field Naming Conventions
- camelCase for field names
- Descriptive but concise names
- Consistent naming across services
- Avoid abbreviations

## Performance Considerations

### Logging Best Practices
- Use async logging in production
- Buffer log writes
- Avoid logging in tight loops
- Use appropriate log levels
- Monitor logging performance

### Log Volume Management
- Target: < 1MB/minute per service
- Limit debug logging in production
- Use sampling for high-volume events
- Monitor log storage usage

## Monitoring and Alerting

### Key Metrics
- Error rate (>5% triggers alert)
- Log volume anomalies
- Missing log streams
- Critical error patterns
- Security events

### Alert Thresholds
- Error rate: >5% for 2 minutes
- No logs: 5 minutes without logs
- Critical errors: Any critical error
- Security events: Any security event

## Implementation Guidelines

### Library Usage
- Use the shared logger library
- Configure service-specific settings
- Implement proper error handling
- Use middleware for request logging

### Configuration
- Environment-specific log levels
- Configurable log destinations
- Dynamic log level changes
- Structured configuration

## Testing

### Log Testing
- Verify log format compliance
- Test error logging
- Validate field completeness
- Check for sensitive data leakage
- Performance testing

### Log Analysis
- Validate query performance
- Test alerting rules
- Verify dashboard functionality
- Check log aggregation

## Compliance

### Regulatory Requirements
- GDPR compliance for EU users
- SOC 2 compliance
- HIPAA compliance for health data
- Industry-specific requirements

### Audit Requirements
- Immutable log storage
- Chain of custody
- Access logging
- Tamper detection

## Troubleshooting

### Common Issues
- Missing required fields
- Incorrect log levels
- Sensitive data exposure
- Performance impact
- Log aggregation failures

### Debugging Steps
1. Check log format compliance
2. Verify field completeness
3. Validate log levels
4. Check for sensitive data
5. Monitor performance impact