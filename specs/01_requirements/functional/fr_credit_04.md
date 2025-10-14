# FR-CREDIT-04: User-Specific Credit Deduction API

## Priority
High

## Description
Provide API for third-party services to deduct credits from user balance

## Requirements
- Accept user ID via X-User-ID header
- Accept service name, cost, and metadata in request body
- Atomically deduct credits from user balance
- Create transaction record with metadata
- Return new balance and transaction ID
- Support rollback on failure

## API Specification
```
POST /api/mcp/v1/credits/deduct
Headers: X-User-ID: {user_id}
Body: { service: string, cost: number, metadata: object }
Response: { status: "ok", new_balance: number, transaction_id: string }
```

## Acceptance Criteria
- Deduction is atomic (no race conditions)
- Transaction record is created
- Returns 402 if insufficient credits
- Supports concurrent deductions safely