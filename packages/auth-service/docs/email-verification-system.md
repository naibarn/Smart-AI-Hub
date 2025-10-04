# Email Verification System Documentation

## Overview

The Email Verification System provides secure email verification using 6-digit OTP codes sent via SendGrid. It includes rate limiting, security measures, and comprehensive logging.

## Features

- ✅ 6-digit cryptographically secure OTP generation
- ✅ Redis-based OTP storage with TTL (15 minutes default)
- ✅ SendGrid email integration with beautiful HTML templates
- ✅ Rate limiting (5 attempts per 15 minutes, 3 send requests per hour)
- ✅ Constant-time OTP comparison for security
- ✅ Comprehensive logging and monitoring
- ✅ Auto-cleanup of expired OTPs
- ✅ User verification status tracking

## API Endpoints

### 1. Send Verification Email

**Endpoint:** `POST /api/auth/send-verification`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Verification code sent",
  "expiresIn": 900
}
```

**Error Responses:**

- `400` - Invalid email format
- `429` - Rate limit exceeded
- `500` - Email service failure

### 2. Verify Email with OTP

**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Responses:**

- `400` - Invalid OTP format or verification failed
- `404` - User not found
- `429` - Rate limit exceeded

### 3. Resend Verification Email

**Endpoint:** `POST /api/auth/resend-verification`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Code resent",
  "expiresIn": 900
}
```

### 4. Check Verification Status

**Endpoint:** `GET /api/auth/verification-status?email=user@example.com`

**Response:**

```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "isVerified": false,
    "hasValidOTP": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Test Email Configuration (Development Only)

**Endpoint:** `POST /api/auth/test-email`

**Response:**

```json
{
  "success": true,
  "message": "Email configuration test successful"
}
```

## Security Features

### Rate Limiting

- **Send Requests:** 3 requests per hour per email
- **Verification Attempts:** 5 attempts per 15 minutes per email
- **OTP Attempts:** Maximum 5 attempts per OTP code

### Security Measures

- **Constant-time comparison:** Prevents timing attacks
- **Cryptographically secure OTP:** Uses Node.js crypto.randomInt()
- **Rate limiting:** Redis-based with sliding windows
- **Logging:** All verification attempts are logged
- **Auto-cleanup:** Expired OTPs are automatically removed

### Data Storage

- **OTP Storage:** Redis key `otp:{email}` with TTL
- **Rate Limiting:** Redis sorted sets with time-based windows
- **Attempt Logs:** Redis lists with 24-hour retention

## Configuration

### Environment Variables

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=noreply@smartaihub.com

# Email Verification Configuration
VERIFICATION_OTP_LENGTH=6
VERIFICATION_OTP_EXPIRY=900

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### Database Schema

The User model includes an `emailVerified` field:

```prisma
model User {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String    @unique @db.VarChar(255)
  emailVerified Boolean  @default(false) @map("email_verified")
  // ... other fields
}
```

## Email Templates

### Verification Email Template

The system includes a beautiful HTML email template with:

- Company branding (Smart AI Hub)
- Clear OTP display
- Expiration time information
- Security notices
- Support links
- Responsive design

### Welcome Email Template

After successful verification, a welcome email is sent with:

- Personalized greeting
- Call-to-action to visit dashboard
- Next steps guidance
- Support information

## Integration with Registration

The email verification system is automatically integrated with user registration:

1. User registers → Account created with `emailVerified: false`
2. OTP generated and stored in Redis
3. Verification email sent automatically
4. User must verify email before login
5. Login returns 403 if email not verified

## Testing

### Unit Tests

Run the comprehensive test suite:

```bash
npm test -- verification.test.js
```

### Manual Testing

Use the provided test script:

```bash
node test-verification-system.js
```

### Test Scenarios Covered

- ✅ OTP generation and storage
- ✅ Email sending (mock SendGrid)
- ✅ Successful verification
- ✅ Expired OTP handling
- ✅ Invalid OTP attempts
- ✅ Rate limiting enforcement
- ✅ Resend functionality
- ✅ Validation error handling
- ✅ Security measures

## Error Handling

### Common Error Codes

- `EMAIL_NOT_VERIFIED` - User attempts login without verification
- `INVALID_OTP` - OTP is incorrect or expired
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `USER_NOT_FOUND` - Email doesn't exist in system

### Logging

All verification attempts are logged with:

- Timestamp
- IP address
- User agent
- Success/failure status
- Email address (hashed for privacy)

## Monitoring

### Redis Keys to Monitor

- `otp:*` - Active OTP codes
- `rate_limit:send:*` - Send rate limits
- `rate_limit:verify:*` - Verification rate limits
- `verification_attempts:*` - Attempt logs

### Metrics to Track

- OTP generation rate
- Verification success rate
- Email delivery success rate
- Rate limit violations
- Failed login attempts due to unverified email

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check SendGrid API key configuration
   - Verify sender email is verified in SendGrid
   - Check email delivery logs

2. **OTP not working**
   - Verify Redis connection
   - Check OTP expiration time
   - Ensure constant-time comparison is working

3. **Rate limiting issues**
   - Check Redis sorted set operations
   - Verify time window calculations
   - Monitor Redis memory usage

### Debug Commands

```bash
# Check Redis for active OTPs
redis-cli keys "otp:*"

# Check rate limit status
redis-cli zrange "rate_limit:send:user@example.com" 0 -1

# View verification attempts
redis-cli lrange "verification_attempts:user@example.com" 0 -1
```

## Security Considerations

### Recommendations

1. **SendGrid Security**
   - Use API keys with minimal permissions
   - Implement IP whitelisting
   - Monitor email delivery metrics

2. **Redis Security**
   - Enable Redis authentication
   - Use TLS for Redis connections
   - Implement Redis memory limits

3. **OTP Security**
   - Use sufficient entropy in OTP generation
   - Implement proper TTL management
   - Log all verification attempts

### Best Practices

1. Never log actual OTP codes
2. Use hashed email addresses in logs when possible
3. Implement proper error responses (don't reveal user existence)
4. Monitor for suspicious verification patterns
5. Regular cleanup of expired data

## Future Enhancements

### Planned Features

- [ ] SMS verification option
- [ ] QR code verification
- [ ] Social login verification
- [ ] Advanced rate limiting with user tiers
- [ ] Email template customization
- [ ] Verification analytics dashboard

### Performance Optimizations

- [ ] Redis clustering for high availability
- [ ] Email queue management
- [ ] Caching of user verification status
- [ ] Batch processing of cleanup operations

## Support

For issues or questions about the email verification system:

1. Check the logs in the auth service
2. Verify Redis and SendGrid configurations
3. Review the test cases for expected behavior
4. Check the monitoring metrics for anomalies

---

**Last Updated:** January 2024
**Version:** 1.0.0
**Maintainer:** Smart AI Hub Development Team
