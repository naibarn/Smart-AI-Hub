# Webhook System Troubleshooting Guide

This guide helps you troubleshoot common issues with the Smart AI Hub webhook system.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Debugging Tools](#debugging-tools)
3. [Performance Issues](#performance-issues)
4. [Security Issues](#security-issues)
5. [Monitoring and Logging](#monitoring-and-logging)
6. [FAQ](#faq)

## Common Issues

### Webhook Not Delivered

#### Symptoms
- No webhook received at your endpoint
- Delivery logs show failed status
- No recent webhook activity

#### Possible Causes
1. **Webhook URL is not accessible**
   - Check if the URL is reachable from the internet
   - Verify SSL certificate is valid
   - Ensure the endpoint responds to POST requests

2. **Webhook is disabled**
   - Check if the webhook is active in the dashboard
   - Use the toggle endpoint to enable it

3. **Event type not subscribed**
   - Verify you're subscribed to the correct event types
   - Check the event type matches your subscription

4. **Rate limiting**
   - Check if you've exceeded the rate limit
   - Monitor rate limit headers in responses

#### Solutions
```bash
# Test webhook accessibility
curl -X POST https://your-webhook-url.com/endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check webhook status
curl -X GET http://localhost:3005/api/v1/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check delivery logs
curl -X GET http://localhost:3005/api/v1/webhooks/WEBHOOK_ID/logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Signature Verification Fails

#### Symptoms
- 401 Unauthorized responses
- Signature mismatch errors
- Webhook rejected by your endpoint

#### Possible Causes
1. **Incorrect webhook secret**
   - Verify you're using the correct secret from the webhook configuration
   - Check for extra spaces or special characters

2. **Encoding issues**
   - Ensure you're using the raw request body
   - Check for UTF-8 encoding issues

3. **Signature format mismatch**
   - Verify the signature format: `sha256=<hash>`
   - Check you're comparing the full signature string

#### Solutions

**Node.js Debug Code:**
```javascript
const crypto = require('crypto');

function debugSignature(payload, signature, secret) {
  console.log('Received signature:', signature);
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  console.log('Expected signature:', `sha256=${expectedSignature}`);
  console.log('Payload:', payload.toString());
  
  return `sha256=${expectedSignature}` === signature;
}

// Use this function to debug signature issues
```

**Python Debug Code:**
```python
import hmac
import hashlib

def debug_signature(payload, signature, secret):
    print(f"Received signature: {signature}")
    
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    print(f"Expected signature: sha256={expected_signature}")
    print(f"Payload: {payload.decode()}")
    
    return f"sha256={expected_signature}" == signature
```

### Timeout Errors

#### Symptoms
- Webhook deliveries timeout after 10 seconds
- Partial data received
- Intermittent delivery failures

#### Possible Causes
1. **Slow endpoint response**
   - Your endpoint takes too long to respond
   - Database queries are slow
   - External API calls are blocking

2. **Network issues**
   - High latency between services
   - Network congestion
   - Firewall or proxy issues

#### Solutions
1. **Optimize endpoint performance**
```javascript
// Respond immediately, process asynchronously
app.post('/webhook', (req, res) => {
  // Verify signature first
  if (!verifySignature(req.body, req.headers['x-webhook-signature'])) {
    return res.status(401).send('Invalid signature');
  }
  
  // Respond immediately
  res.status(200).send('OK');
  
  // Process asynchronously
  setImmediate(() => {
    processWebhookEvent(JSON.parse(req.body));
  });
});
```

2. **Add timeout handling**
```javascript
const express = require('express');
const timeout = require('express-timeout-handler');

const app = express();
app.use(timeout.handler({ timeout: 8000 })); // 8 second timeout
```

### Duplicate Events

#### Symptoms
- Same event received multiple times
- Duplicate database entries
- Inconsistent state

#### Possible Causes
1. **Idempotency not implemented**
   - Your endpoint doesn't handle duplicate events
   - Event ID is not tracked

2. **Retry logic**
   - Webhook service retries on failures
   - Your endpoint responded with an error

#### Solutions
1. **Implement idempotency**
```javascript
const processedEvents = new Set();

app.post('/webhook', (req, res) => {
  const event = JSON.parse(req.body);
  
  // Check if already processed
  if (processedEvents.has(event.id)) {
    return res.status(200).send('Duplicate event');
  }
  
  // Mark as processed
  processedEvents.add(event.id);
  
  // Process event
  processWebhookEvent(event);
  
  res.status(200).send('OK');
});
```

2. **Use database for tracking**
```javascript
async function isEventProcessed(eventId) {
  const result = await db.query(
    'SELECT id FROM processed_events WHERE id = ?',
    [eventId]
  );
  return result.length > 0;
}

async function markEventProcessed(eventId) {
  await db.query(
    'INSERT INTO processed_events (id, processed_at) VALUES (?, NOW())',
    [eventId]
  );
}
```

## Debugging Tools

### Local Testing with Ngrok

Use ngrok to expose your local endpoint for testing:

```bash
# Install ngrok
npm install -g ngrok

# Start your local server
node server.js

# Expose your local port
ngrok http 3000

# Use the ngrok URL for your webhook
# https://abc123.ngrok.io/webhook
```

### Webhook Testing Services

1. **Webhook.site** - Temporary webhook URL for testing
2. **RequestBin.com** - Inspect HTTP requests
3. **Beeceptor** - Mock API endpoints

### Test Endpoints

```bash
# Test webhook creation
curl -X POST http://localhost:3005/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/your-unique-id",
    "eventTypes": ["user.created"],
    "secret": "test_secret"
  }'

# Test webhook delivery
curl -X POST http://localhost:3005/api/v1/webhooks/WEBHOOK_ID/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "user.created",
    "data": {"test": true}
  }'

# Check delivery logs
curl -X GET http://localhost:3005/api/v1/webhooks/WEBHOOK_ID/logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Performance Issues

### High Memory Usage

#### Symptoms
- Memory usage increases over time
- Out of memory errors
- Slow response times

#### Solutions
1. **Clean up processed event storage**
```javascript
// Clean up old event IDs periodically
setInterval(() => {
  if (processedEvents.size > 10000) {
    processedEvents.clear();
  }
}, 60000); // Every minute
```

2. **Use efficient data structures**
```javascript
// Use LRU cache for event IDs
const LRU = require('lru-cache');
const processedEvents = new LRU({ max: 5000 });
```

### Slow Database Queries

#### Symptoms
- Webhook processing is slow
- Database connection timeouts
- High CPU usage

#### Solutions
1. **Add database indexes**
```sql
-- Add index for event lookups
CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);
```

2. **Use connection pooling**
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'user',
  password: 'password',
  database: 'webhooks',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

## Security Issues

### Unauthorized Webhook Calls

#### Symptoms
- Unexpected webhook deliveries
- Invalid signatures
- Suspicious activity

#### Solutions
1. **Always verify signatures**
```javascript
function verifyWebhook(req, res, next) {
  const signature = req.headers['x-webhook-signature'];
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  if (!verifySignature(req.body, signature, webhookSecret)) {
    return res.status(401).send('Invalid signature');
  }
  
  next();
}

app.post('/webhook', verifyWebhook, (req, res) => {
  // Process webhook
});
```

2. **Rate limiting**
```javascript
const rateLimit = require('express-rate-limit');

const webhookRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many webhook requests'
});

app.post('/webhook', webhookRateLimit, (req, res) => {
  // Process webhook
});
```

### Replay Attacks

#### Symptoms
- Old events being replayed
- Duplicate transactions
- Inconsistent state

#### Solutions
1. **Check timestamp**
```javascript
function isRecentEvent(timestamp) {
  const eventTime = new Date(timestamp);
  const now = new Date();
  const diffMinutes = (now - eventTime) / (1000 * 60);
  
  // Reject events older than 5 minutes
  return diffMinutes < 5;
}

app.post('/webhook', (req, res) => {
  const event = JSON.parse(req.body);
  
  if (!isRecentEvent(event.metadata.timestamp)) {
    return res.status(400).send('Event too old');
  }
  
  // Process event
});
```

## Monitoring and Logging

### Log Levels

Use appropriate log levels for different scenarios:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log webhook events
logger.info('Webhook received', {
  eventId: event.id,
  eventType: event.eventType,
  userId: event.userId
});

// Log errors
logger.error('Webhook processing failed', {
  eventId: event.id,
  error: error.message,
  stack: error.stack
});
```

### Metrics to Monitor

1. **Delivery Success Rate**
   - Percentage of successful deliveries
   - Monitor for drops in success rate

2. **Response Time**
   - Average time to process webhooks
   - Monitor for increases in response time

3. **Error Rate**
   - Number of failed deliveries
   - Track error types and patterns

4. **Queue Depth**
   - Number of webhooks in queue
   - Monitor for queue buildup

### Health Checks

Implement health checks for your webhook endpoint:

```javascript
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    webhookQueue: getQueueStats()
  };
  
  res.json(health);
});

function getQueueStats() {
  return {
    pending: webhookQueue.length,
    processing: processingCount,
    failed: failedCount
  };
}
```

## FAQ

### Q: How do I test webhooks locally?
A: Use ngrok to expose your local endpoint to the internet. This allows you to test webhooks during development.

### Q: Why am I not receiving webhooks?
A: Check the following:
1. Your webhook is active
2. You're subscribed to the correct event types
3. Your endpoint is accessible and responding
4. Check delivery logs for errors

### Q: How do I handle duplicate events?
A: Implement idempotency by tracking processed event IDs. Use a database or cache to store processed event IDs.

### Q: What's the maximum payload size?
A: Webhook payloads are limited to 1MB. Larger payloads will be rejected.

### Q: How many retry attempts are made?
A: Failed webhooks are retried up to 3 times with exponential backoff (immediate, 1 minute, 5 minutes).

### Q: How do I verify webhook signatures?
A: Use the HMAC-SHA256 algorithm with your webhook secret. See the API documentation for code examples.

### Q: Can I change the webhook secret?
A: Yes, you can update the webhook secret through the API. This will invalidate all existing signatures.

### Q: How do I debug signature verification issues?
A: Use the debug code examples in this guide to compare expected and actual signatures.

### Q: What happens if my endpoint is down?
A: Webhooks will be retried according to the retry policy. After 3 failed attempts, the webhook is marked as failed.

### Q: How do I monitor webhook delivery?
A: Check the delivery logs through the API or implement your own logging and monitoring.

### Q: Can I pause webhook delivery?
A: Yes, you can disable the webhook through the API or dashboard to pause deliveries.

## Additional Resources

- [API Documentation](./API.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Support](mailto:support@smartaihub.com)
- [Community Forum](https://community.smartaihub.com)

Remember to always test your webhook implementation thoroughly before deploying to production.