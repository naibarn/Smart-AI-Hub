# FR-7: Webhook System

## Priority
Phase 2

## Event Types
- `user.created`
- `credit.depleted`
- `service.completed`

## Features
- Retry policy: 3 attempts with exponential backoff
- Signature verification (HMAC-SHA256)