# Webhook Service API Documentation

## Overview

The Webhook Service provides a robust system for managing and delivering webhooks for the Smart AI Hub platform. It supports secure webhook delivery with HMAC-SHA256 signature verification, retry logic with exponential backoff, and comprehensive logging.

## Base URL

```
http://localhost:3005/api/v1
```

## Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Webhook Management

#### List Webhooks

Get all webhooks for the authenticated user.

```http
GET /api/v1/webhooks
```

**Response:**

```json
{
  "data": [
    {
      "id": "webhook_id",
      "url": "https://example.com/webhook",
      "eventTypes": ["user.created", "credit.low"],
      "isActive": true,
      "secret": "webhook_secret",
      "userId": "user_id",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

#### Create Webhook

Create a new webhook endpoint.

```http
POST /api/v1/webhooks
```

**Request Body:**

```json
{
  "url": "https://example.com/webhook",
  "eventTypes": ["user.created", "credit.low"],
  "secret": "optional_custom_secret"
}
```

**Response:**

```json
{
  "data": {
    "id": "webhook_id",
    "url": "https://example.com/webhook",
    "eventTypes": ["user.created", "credit.low"],
    "isActive": true,
    "secret": "generated_or_provided_secret",
    "userId": "user_id",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Get Webhook

Get a specific webhook by ID.

```http
GET /api/v1/webhooks/:id
```

**Response:**

```json
{
  "data": {
    "id": "webhook_id",
    "url": "https://example.com/webhook",
    "eventTypes": ["user.created", "credit.low"],
    "isActive": true,
    "secret": "webhook_secret",
    "userId": "user_id",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Update Webhook

Update an existing webhook.

```http
PUT /api/v1/webhooks/:id
```

**Request Body:**

```json
{
  "url": "https://example.com/updated-webhook",
  "eventTypes": ["user.created", "credit.low", "credit.depleted"],
  "isActive": false
}
```

**Response:**

```json
{
  "data": {
    "id": "webhook_id",
    "url": "https://example.com/updated-webhook",
    "eventTypes": ["user.created", "credit.low", "credit.depleted"],
    "isActive": false,
    "secret": "webhook_secret",
    "userId": "user_id",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Delete Webhook

Delete a webhook endpoint.

```http
DELETE /api/v1/webhooks/:id
```

**Response:**

```json
{
  "data": {
    "id": "webhook_id",
    "deleted": true
  }
}
```

### Webhook Actions

#### Test Webhook

Send a test payload to a webhook endpoint.

```http
POST /api/v1/webhooks/:id/test
```

**Request Body:**

```json
{
  "eventType": "user.created",
  "data": {
    "test": true
  }
}
```

**Response:**

```json
{
  "data": {
    "success": true,
    "message": "Test webhook sent successfully",
    "logId": "log_id"
  }
}
```

#### Toggle Webhook

Enable or disable a webhook endpoint.

```http
POST /api/v1/webhooks/:id/toggle
```

**Response:**

```json
{
  "data": {
    "id": "webhook_id",
    "isActive": false
  }
}
```

#### Get Webhook Logs

Get delivery logs for a specific webhook.

```http
GET /api/v1/webhooks/:id/logs
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of logs per page (default: 20)
- `status` (optional): Filter by status (success, failed, pending)

**Response:**

```json
{
  "data": [
    {
      "id": "log_id",
      "webhookId": "webhook_id",
      "eventType": "user.created",
      "payload": {},
      "responseStatus": 200,
      "responseBody": "Success",
      "attempt": 1,
      "status": "success",
      "deliveredAt": "2025-01-01T00:00:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

## Event Types

The following event types are supported:

### User Events

- `user.created` - Triggered when a new user is created
- `user.updated` - Triggered when user profile is updated
- `user.login` - Triggered when user logs in
- `user.logout` - Triggered when user logs out

### Credit Events

- `credit.depleted` - Triggered when user's credits reach 0
- `credit.low` - Triggered when user's credits fall below threshold (default: 10)
- `credit.purchased` - Triggered when user purchases credits
- `credit.refunded` - Triggered when credits are refunded
- `credit.promo_redeemed` - Triggered when user redeems a promo code

### Service Events

- `service.completed` - Triggered when an AI service completes successfully
- `service.failed` - Triggered when an AI service fails
- `service.started` - Triggered when an AI service starts processing

## Webhook Payload Structure

All webhook payloads follow this structure:

```json
{
  "id": "event_id",
  "eventType": "event.type",
  "userId": "user_id",
  "data": {
    // Event-specific data
  },
  "metadata": {
    "service": "service_name",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

## Signature Verification

Webhook deliveries include an `X-Webhook-Signature` header for verification:

```
X-Webhook-Signature: sha256=<signature>
```

To verify the signature:

1. Concatenate the raw request body with the webhook secret
2. Calculate the HMAC-SHA256 hash
3. Compare with the signature from the header

### Node.js Example

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

// Usage
const payload = req.rawBody;
const signature = req.headers['x-webhook-signature'];
const webhookSecret = 'your_webhook_secret';

if (verifySignature(payload, signature, webhookSecret)) {
  // Signature is valid
  const event = JSON.parse(payload);
  // Process event
} else {
  // Invalid signature
  res.status(401).send('Invalid signature');
}
```

### Python Example

```python
import hmac
import hashlib

def verify_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return f"sha256={expected_signature}" == signature

# Usage
payload = request.body
signature = request.headers.get('X-Webhook-Signature')
webhook_secret = 'your_webhook_secret'

if verify_signature(payload, signature, webhook_secret):
    # Signature is valid
    event = json.loads(payload)
    # Process event
else:
    # Invalid signature
    return 'Invalid signature', 401
```

### PHP Example

```php
function verifySignature($payload, $signature, $secret) {
    $expectedSignature = hash_hmac('sha256', $payload, $secret);
    return 'sha256=' . $expectedSignature === $signature;
}

// Usage
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';
$webhookSecret = 'your_webhook_secret';

if (verifySignature($payload, $signature, $webhookSecret)) {
    // Signature is valid
    $event = json_decode($payload, true);
    // Process event
} else {
    // Invalid signature
    http_response_code(401);
    echo 'Invalid signature';
}
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (Rate limited)
- `500` - Internal Server Error

Error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Rate Limiting

- Webhook endpoints are rate limited to 1000 requests per hour
- Internal trigger endpoints are rate limited to 10,000 requests per hour
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit` - Request limit
  - `X-RateLimit-Remaining` - Remaining requests
  - `X-RateLimit-Reset` - Reset time (Unix timestamp)

## Retry Logic

Failed webhook deliveries are retried with exponential backoff:

- Attempt 1: Immediate
- Attempt 2: After 1 minute
- Attempt 3: After 5 minutes

Maximum of 3 attempts per webhook delivery.

## Security Considerations

1. **HTTPS Only**: Webhook URLs must use HTTPS
2. **Signature Verification**: Always verify webhook signatures
3. **Secret Management**: Keep webhook secrets secure
4. **Rate Limiting**: Implement rate limiting on your webhook endpoints
5. **Payload Size**: Maximum payload size is 1MB
6. **Timeout**: Webhook deliveries timeout after 10 seconds

## Troubleshooting

### Common Issues

1. **Webhook not delivered**
   - Check if the webhook URL is accessible
   - Verify the webhook is active
   - Check delivery logs for error details

2. **Signature verification fails**
   - Ensure you're using the correct webhook secret
   - Verify you're using the raw request body for signature calculation
   - Check for encoding issues

3. **Rate limited**
   - Implement proper rate limiting on your endpoint
   - Consider optimizing webhook processing time

4. **Timeout errors**
   - Ensure your webhook endpoint responds quickly
   - Consider processing webhook events asynchronously

### Debugging

1. Use the test endpoint to verify webhook configuration
2. Check delivery logs for detailed error information
3. Verify signature verification logic
4. Monitor rate limit headers
5. Check webhook service health status
