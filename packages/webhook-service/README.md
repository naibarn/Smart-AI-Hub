# Webhook Service

A robust webhook service for Smart AI Hub that provides real-time event notifications with secure signature verification, retry logic, and comprehensive logging.

## Features

- **Secure Webhook Delivery**: HMAC-SHA256 signature verification for all webhook payloads
- **Event-Driven Architecture**: Supports multiple event types from various services
- **Reliable Delivery**: Built-in retry logic with exponential backoff (3 attempts)
- **Comprehensive Logging**: Full delivery history with detailed logs
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **RESTful API**: Complete CRUD operations for webhook management
- **Real-time Testing**: Test webhook endpoints before deployment
- **User-Friendly UI**: React components for webhook management

## Supported Event Types

- `user.created` - Triggered when a new user account is created
- `user.updated` - Triggered when user profile information is updated
- `user.deleted` - Triggered when a user account is deleted
- `user.login` - Triggered when a user successfully logs in
- `user.logout` - Triggered when a user logs out
- `credit.depleted` - Triggered when user credits reach zero
- `credit.low` - Triggered when user credits fall below the low threshold
- `credit.added` - Triggered when credits are added to an account
- `credit.deducted` - Triggered when credits are deducted from an account
- `service.completed` - Triggered when an AI service completes successfully
- `service.failed` - Triggered when an AI service fails to complete
- `service.started` - Triggered when an AI service starts processing
- `payment.completed` - Triggered when a payment is completed successfully
- `payment.failed` - Triggered when a payment fails
- `subscription.created` - Triggered when a new subscription is created
- `subscription.cancelled` - Triggered when a subscription is cancelled
- `subscription.renewed` - Triggered when a subscription is renewed

## API Endpoints

### Webhook Management

All endpoints require authentication via JWT token.

#### GET /api/v1/webhooks

List all webhooks for the authenticated user.

**Response:**

```json
[
  {
    "id": "webhook_123",
    "url": "https://example.com/webhook",
    "eventTypes": ["user.created", "user.updated"],
    "secret": "webhook-secret",
    "isActive": true,
    "userId": "user_456",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/v1/webhooks

Create a new webhook.

**Request Body:**

```json
{
  "url": "https://example.com/webhook",
  "eventTypes": ["user.created", "user.updated"],
  "secret": "webhook-secret"
}
```

#### GET /api/v1/webhooks/:id

Get a specific webhook by ID.

#### PUT /api/v1/webhooks/:id

Update an existing webhook.

**Request Body:**

```json
{
  "url": "https://updated.example.com/webhook",
  "eventTypes": ["user.created", "user.updated", "credit.low"],
  "secret": "new-webhook-secret",
  "isActive": true
}
```

#### DELETE /api/v1/webhooks/:id

Delete a webhook.

#### POST /api/v1/webhooks/:id/toggle

Enable or disable a webhook.

#### POST /api/v1/webhooks/:id/test

Send a test event to a webhook.

**Request Body:**

```json
{
  "eventType": "user.created",
  "data": {
    "userId": "test-user-123",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

#### GET /api/v1/webhooks/:id/logs

Get delivery logs for a webhook.

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of logs per page (default: 20)

**Response:**

```json
{
  "logs": [
    {
      "id": "log_123",
      "webhookId": "webhook_123",
      "eventType": "user.created",
      "payload": { ... },
      "responseStatus": 200,
      "responseBody": "{\"success\": true}",
      "attempt": 1,
      "maxAttempts": 3,
      "status": "delivered",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "deliveredAt": "2024-01-01T00:00:01.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

#### GET /api/v1/webhooks/event-types

Get available event types and their descriptions.

#### POST /api/v1/webhooks/:id/regenerate-secret

Generate a new secret for a webhook.

### Internal Endpoints

These endpoints are for internal service communication only.

#### POST /api/internal/webhooks/trigger

Trigger webhook events for a specific event type.

**Headers:**

- `X-Internal-Service`: Service name (e.g., "auth-service")
- `X-Internal-Secret`: Internal service secret

**Request Body:**

```json
{
  "eventType": "user.created",
  "data": {
    "userId": "user_456",
    "email": "newuser@example.com",
    "name": "New User"
  }
}
```

## Webhook Payload Format

All webhook payloads follow this consistent format:

```json
{
  "id": "event_123456789",
  "eventType": "user.created",
  "data": {
    // Event-specific data
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "webhookId": "webhook_123",
    "version": "1.0"
  }
}
```

## Signature Verification

Webhooks are signed using HMAC-SHA256. The signature is included in the `X-Webhook-Signature` header.

**Example verification in Node.js:**

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

// Usage
const payload = request.body; // Raw request body
const signature = request.headers['x-webhook-signature'];
const secret = 'your-webhook-secret';

const isValid = verifySignature(payload, signature, secret);
```

**Example verification in Python:**

```python
import hmac
import hashlib

def verify_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    return f"sha256={expected_signature}" == signature

# Usage
payload = request.body  # Raw request body
signature = request.headers.get('X-Webhook-Signature')
secret = 'your-webhook-secret'

is_valid = verify_signature(payload, signature, secret)
```

**Example verification in PHP:**

```php
function verifySignature($payload, $signature, $secret) {
    $expectedSignature = hash_hmac('sha256', $payload, $secret);
    return 'sha256=' . $expectedSignature === $signature;
}

// Usage
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';
$secret = 'your-webhook-secret';

$isValid = verifySignature($payload, $signature, $secret);
```

## Retry Logic

Failed webhook deliveries are automatically retried with exponential backoff:

- **Attempt 1**: Immediate
- **Attempt 2**: 1 minute delay
- **Attempt 3**: 5 minutes delay

After 3 failed attempts, the webhook is marked as failed and no further retries are attempted.

## Rate Limiting

Webhook endpoints are rate-limited to prevent abuse:

- **Default Limit**: 1000 requests per hour per endpoint
- **Test Endpoint**: 10 requests per minute per webhook
- **Internal Endpoint**: 10000 requests per hour per service

## Security

- **HTTPS Only**: Production webhooks must use HTTPS URLs
- **Signature Verification**: All webhooks include HMAC-SHA256 signatures
- **Authentication**: All API endpoints require JWT authentication
- **Internal Security**: Internal endpoints use service-based authentication
- **Input Validation**: All inputs are validated and sanitized
- **Payload Size**: Maximum payload size is 1MB

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/webhooks"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret"

# Internal Service Secret
INTERNAL_SERVICE_SECRET="your-internal-secret"

# Server
PORT=3005
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

### Validation

Run the integration validation script to test the complete webhook system:

```bash
# Set environment variables
export WEBHOOK_SERVICE_URL=http://localhost:3005
export AUTH_SERVICE_URL=http://localhost:3001
export TEST_WEBHOOK_URL=https://webhook.site/your-unique-id

# Run validation
node scripts/validate-webhook-system.js
```

## Docker

### Build

```bash
docker build -t webhook-service .
```

### Run

```bash
docker run -p 3005:3005 \
  -e DATABASE_URL="postgresql://user:password@host:5432/webhooks" \
  -e REDIS_URL="redis://host:6379" \
  -e JWT_SECRET="your-jwt-secret" \
  webhook-service
```

### Docker Compose

The webhook service is included in the main Smart AI Hub docker-compose.yml:

```bash
# Start all services including webhook-service
docker-compose up -d

# View logs
docker-compose logs -f webhook-service
```

## Monitoring

### Health Check

```bash
curl http://localhost:3005/health
```

### Metrics

The service provides metrics for monitoring:

- Webhook delivery success rate
- Average response time
- Queue depth
- Error rates

### Logging

Logs are structured and include:

- Request/response details
- Webhook delivery attempts
- Error messages with stack traces
- Performance metrics

## Troubleshooting

### Common Issues

1. **Webhook Not Delivered**
   - Check if the webhook URL is accessible
   - Verify the webhook is active
   - Check delivery logs for error messages

2. **Signature Verification Fails**
   - Ensure you're using the raw request body
   - Check the secret is correct
   - Verify the signature format

3. **Rate Limiting**
   - Check the rate limit headers in responses
   - Implement exponential backoff in your client

4. **Timeout Errors**
   - Ensure your endpoint responds within 10 seconds
   - Consider processing webhook events asynchronously

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=webhook:*
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions:

- Create an issue in the repository
- Check the [troubleshooting guide](./docs/TROUBLESHOOTING.md)
- Review the [API documentation](./docs/API.md)
- See the [developer guide](./docs/DEVELOPER_GUIDE.md)
