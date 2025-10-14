# FR-CREDIT-03: User-Specific Credit Check API

## Priority
High

## Description
Provide API for third-party services to check user credit balance

## Requirements
- Accept user ID via X-User-ID header
- Accept service name and cost in request body
- Return whether user has sufficient credits
- Return current credit balance
- Support different service types and costs
- Respond within 200ms

## API Specification
```
POST /api/mcp/v1/credits/check
Headers: X-User-ID: {user_id}
Body: { service: string, cost: number }
Response: { sufficient: boolean, balance: number }
```

## Acceptance Criteria
- Accurately checks user credit balance
- Returns 402 if insufficient credits
- Returns 404 if user not found
- Handles concurrent requests correctly