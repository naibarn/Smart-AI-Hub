# Webhook System Developer Guide

## Overview

The Webhook System for Smart AI Hub provides a reliable and secure way to receive real-time notifications about various events in the platform. This guide will help you integrate webhooks into your applications.

## Quick Start

### 1. Create a Webhook Endpoint

First, create an endpoint in your application to receive webhook events:

```javascript
// Example Express.js endpoint
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();

// Use raw body parser for signature verification
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const webhookSecret = 'your_webhook_secret';

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  if (`sha256=${expectedSignature}` !== signature) {
    return res.status(401).send('Invalid signature');
  }

  // Parse the event
  const event = JSON.parse(req.body);

  // Handle the event
  handleWebhookEvent(event);

  // Respond quickly
  res.status(200).send('OK');
});

function handleWebhookEvent(event) {
  switch (event.eventType) {
    case 'user.created':
      console.log('New user created:', event.data);
      break;
    case 'credit.low':
      console.log('User credit is low:', event.data);
      break;
    // Handle other event types
  }
}

app.listen(3000);
```

### 2. Register Your Webhook

Register your webhook endpoint with the Smart AI Hub:

```bash
curl -X POST http://localhost:3005/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://smartaihub.com/webhooks/smartaihub",
    "eventTypes": ["user.created", "credit.low"],
    "secret": "your_webhook_secret"
  }'
```

### 3. Test Your Webhook

Test your webhook configuration:

```bash
curl -X POST http://localhost:3005/api/v1/webhooks/WEBHOOK_ID/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "user.created",
    "data": {
      "test": true
    }
  }'
```

## Environment-Specific URLs

### Webhook Endpoints

| Environment | Webhook URL                                          |
| ----------- | ---------------------------------------------------- |
| Production  | `https://smartaihub.com/webhooks/smartaihub`         |
| Staging     | `https://staging.smartaihub.com/webhooks/smartaihub` |
| Development | `http://localhost:3000/webhooks/smartaihub`          |

### Application URLs

| Environment | Application URL                  |
| ----------- | -------------------------------- |
| Production  | `https://smartaihub.com`         |
| Staging     | `https://staging.smartaihub.com` |
| Development | `http://localhost:3000`          |

### OAuth Redirect URIs

| Environment | OAuth Redirect URI                             |
| ----------- | ---------------------------------------------- |
| Production  | `https://smartaihub.com/auth/callback`         |
| Staging     | `https://staging.smartaihub.com/auth/callback` |
| Development | `http://localhost:3000/auth/callback`          |

## Event Reference

### User Events

#### user.created

Triggered when a new user registers.

```json
{
  "id": "event_id",
  "eventType": "user.created",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "email": "user@example.com",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "service": "auth-service",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### user.updated

Triggered when a user's profile is updated.

```json
{
  "id": "event_id",
  "eventType": "user.updated",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "email": "user@example.com",
    "changes": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "service": "auth-service",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### user.login

Triggered when a user logs in.

```json
{
  "id": "event_id",
  "eventType": "user.login",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "email": "user@example.com",
    "loginTime": "2025-01-01T00:00:00.000Z",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "metadata": {
    "service": "auth-service",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### user.logout

Triggered when a user logs out.

```json
{
  "id": "event_id",
  "eventType": "user.logout",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "email": "user@example.com",
    "logoutTime": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "service": "auth-service",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

### Credit Events

#### credit.depleted

Triggered when a user's credits reach 0.

```json
{
  "id": "event_id",
  "eventType": "credit.depleted",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "balance": 0,
    "previousBalance": 5,
    "transactionId": "transaction_id",
    "transactionType": "usage",
    "amount": -5,
    "description": "Service usage: gpt-4",
    "depletedAt": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "service": "core-service",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### credit.low

Triggered when a user's credits fall below the threshold (default: 10).

```json
{
  "id": "event_id",
  "eventType": "credit.low",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "balance": 8,
    "threshold": 10,
    "lowCreditAt": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "service": "core-service",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### credit.purchased

Triggered when a user purchases credits.

```json
{
  "id": "event_id",
  "eventType": "credit.purchased",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "amount": 100,
    "balance": 150,
    "previousBalance": 50,
    "transactionId": "transaction_id",
    "paymentMethod": "credit_card",
    "purchasedAt": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "service": "core-service",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### credit.refunded

Triggered when credits are refunded.

```json
{
  "id": "event_id",
  "eventType": "credit.refunded",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "amount": 25,
    "balance": 75,
    "previousBalance": 50,
    "transactionId": "transaction_id",
    "reason": "Service failure",
    "refundedAt": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "service": "core-service",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### credit.promo_redeemed

Triggered when a user redeems a promo code.

```json
{
  "id": "event_id",
  "eventType": "credit.promo_redeemed",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "promoCode": "WELCOME2025",
    "credits": 50,
    "balance": 100,
    "previousBalance": 50,
    "redeemedAt": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "service": "core-service",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

### Service Events

#### service.completed

Triggered when an AI service completes successfully.

```json
{
  "id": "event_id",
  "eventType": "service.completed",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "requestId": "request_id",
    "service": "mcp",
    "model": "gpt-4",
    "tokens": 150,
    "credits": 5,
    "duration": 2500,
    "response": "Generated text response...",
    "completedAt": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "service": "mcp-server",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### service.failed

Triggered when an AI service fails.

```json
{
  "id": "event_id",
  "eventType": "service.failed",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "requestId": "request_id",
    "service": "mcp",
    "model": "gpt-4",
    "errorCode": "EXECUTION_ERROR",
    "errorMessage": "Service temporarily unavailable",
    "duration": 1000,
    "failedAt": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "service": "mcp-server",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### service.started

Triggered when an AI service starts processing.

```json
{
  "id": "event_id",
  "eventType": "service.started",
  "userId": "user_id",
  "data": {
    "userId": "user_id",
    "requestId": "request_id",
    "service": "mcp",
    "model": "gpt-4",
    "maxTokens": 1000,
    "startedAt": "2025-01-01T00:00:00.000Z"
  },
  "metadata": {
    "service": "mcp-server",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

## Best Practices

### 1. Security

- Always verify webhook signatures
- Use HTTPS URLs for your webhook endpoints
- Keep your webhook secrets secure
- Implement rate limiting on your endpoints

### 2. Reliability

- Respond quickly (within 10 seconds)
- Process webhook events asynchronously
- Implement idempotency for event processing
- Handle duplicate events gracefully

### 3. Error Handling

- Return appropriate HTTP status codes
- Log webhook events for debugging
- Monitor failed deliveries
- Implement retry logic if needed

### 4. Performance

- Optimize your endpoint performance
- Use connection pooling
- Consider using a message queue for processing
- Monitor webhook processing times

## Implementation Examples

### Node.js with Express

```javascript
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();

// Store processed event IDs to handle duplicates
const processedEvents = new Set();

// Use raw body parser for signature verification
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

app.post('/webhook', async (req, res) => {
  try {
    // Verify signature
    const signature = req.headers['x-webhook-signature'];
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (!verifySignature(req.body, signature, webhookSecret)) {
      return res.status(401).send('Invalid signature');
    }

    // Parse event
    const event = JSON.parse(req.body);

    // Check for duplicates
    if (processedEvents.has(event.id)) {
      return res.status(200).send('Duplicate event');
    }

    // Mark as processed
    processedEvents.add(event.id);

    // Process asynchronously
    processWebhookEvent(event).catch((error) => {
      console.error('Error processing webhook:', error);
    });

    // Respond immediately
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

async function processWebhookEvent(event) {
  // Implement your event processing logic here
  console.log(`Processing event: ${event.eventType}`, event.data);

  // Example: Update user in database
  if (event.eventType === 'user.created') {
    await updateUserInDatabase(event.data);
  }

  // Example: Send notification
  if (event.eventType === 'credit.low') {
    await sendLowCreditNotification(event.data);
  }
}

app.listen(3000);
```

### Python with Flask

```python
from flask import Flask, request, jsonify
import hmac
import hashlib
import json
import threading

app = Flask(__name__)

# Store processed event IDs
processed_events = set()

@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        # Get signature
        signature = request.headers.get('X-Webhook-Signature')
        webhook_secret = os.environ.get('WEBHOOK_SECRET')

        # Verify signature
        if not verify_signature(request.data, signature, webhook_secret):
            return jsonify({'error': 'Invalid signature'}), 401

        # Parse event
        event = json.loads(request.data)

        # Check for duplicates
        if event['id'] in processed_events:
            return jsonify({'status': 'duplicate'}), 200

        # Mark as processed
        processed_events.add(event['id'])

        # Process asynchronously
        threading.Thread(target=process_webhook_event, args=(event,)).start()

        return jsonify({'status': 'ok'}), 200
    except Exception as e:
        print(f'Webhook error: {e}')
        return jsonify({'error': 'Internal server error'}), 500

def verify_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    return f'sha256={expected_signature}' == signature

def process_webhook_event(event):
    try:
        print(f"Processing event: {event['eventType']}")
        # Implement your event processing logic here
    except Exception as e:
        print(f"Error processing webhook: {e}")

if __name__ == '__main__':
    app.run(port=3000)
```

### PHP with Laravel

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handle(Request $request)
    {
        try {
            // Get signature
            $signature = $request->header('X-Webhook-Signature');
            $webhookSecret = config('services.webhook.secret');

            // Verify signature
            if (!$this->verifySignature($request->getContent(), $signature, $webhookSecret)) {
                return response()->json(['error' => 'Invalid signature'], 401);
            }

            // Parse event
            $event = json_decode($request->getContent(), true);

            // Check for duplicates
            if (cache()->has("webhook_{$event['id']}")) {
                return response()->json(['status' => 'duplicate'], 200);
            }

            // Mark as processed
            cache()->put("webhook_{$event['id']}", true, 3600);

            // Process asynchronously
            dispatch(function () use ($event) {
                $this->processWebhookEvent($event);
            });

            return response()->json(['status' => 'ok'], 200);
        } catch (\Exception $e) {
            Log::error('Webhook error: ' . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    private function verifySignature($payload, $signature, $secret)
    {
        $expectedSignature = hash_hmac('sha256', $payload, $secret);
        return 'sha256=' . $expectedSignature === $signature;
    }

    private function processWebhookEvent($event)
    {
        try {
            Log::info("Processing event: {$event['eventType']}");

            // Implement your event processing logic here
            switch ($event['eventType']) {
                case 'user.created':
                    $this->handleUserCreated($event['data']);
                    break;
                case 'credit.low':
                    $this->handleCreditLow($event['data']);
                    break;
                // Handle other event types
            }
        } catch (\Exception $e) {
            Log::error('Error processing webhook: ' . $e->getMessage());
        }
    }

    private function handleUserCreated($data)
    {
        // Handle user created event
    }

    private function handleCreditLow($data)
    {
        // Handle credit low event
    }
}
```

## Troubleshooting

### Common Issues

1. **Signature verification fails**
   - Ensure you're using the correct webhook secret
   - Verify you're using the raw request body
   - Check for encoding issues

2. **Webhook not received**
   - Check if the webhook is active
   - Verify the URL is accessible
   - Check delivery logs

3. **Timeout errors**
   - Ensure your endpoint responds quickly
   - Process events asynchronously

4. **Duplicate events**
   - Implement idempotency
   - Track processed event IDs

### Debugging Tools

1. Use the test endpoint to verify configuration
2. Check delivery logs in the webhook service
3. Monitor rate limit headers
4. Use webhook testing tools like ngrok for local development

## Support

For additional support:

1. Check the API documentation
2. Review delivery logs
3. Contact the development team
4. Check the troubleshooting guide

Remember to always test your webhook implementation thoroughly before deploying to production.
