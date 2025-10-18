# Pricing System Technical Documentation

## Overview

The Pricing System is a comprehensive multi-platform pricing and cost calculation system for agent execution. It supports various AI platforms and models, with flexible pricing rules, credit reservation, and detailed usage tracking.

## Architecture

### Components

1. **Pricing Rule Engine**
   - Manages pricing rules for different platforms and models
   - Supports various pricing components (input tokens, output tokens, RAG operations, tool calls)
   - Handles tier-based pricing with user tier multipliers

2. **Cost Calculation Service**
   - Calculates costs for agent executions
   - Supports cost estimation before execution
   - Provides detailed cost breakdowns

3. **Credit Reservation System**
   - Reserves credits before agent execution
   - Handles credit charging and refunding
   - Prevents overspending with distributed locking

4. **Usage Tracking Service**
   - Tracks all agent executions and usage metrics
   - Maintains detailed usage history
   - Provides analytics and reporting

### Data Flow

1. **Cost Estimation**
   - User requests cost estimation for agent execution
   - System calculates estimated cost based on pricing rules
   - User's credit balance is checked
   - Estimation is returned with balance information

2. **Credit Reservation**
   - Before execution, credits are reserved
   - System uses distributed locking to prevent race conditions
   - Reservation is created with expiration time
   - Reservation ID is returned for later charging

3. **Agent Execution**
   - Agent is executed with the reserved credits
   - Actual usage metrics are collected
   - Credits are charged based on actual usage
   - Reservation is marked as charged

4. **Usage Tracking**
   - All usage is logged with detailed metrics
   - Cost breakdown is stored for analytics
   - User's credit balance is updated

## API Reference

### Pricing Rules Management

#### Get Pricing Rules
```http
GET /api/pricing/rules?platformId=openai&modelId=gpt-4&page=1&limit=10
Authorization: Bearer {token}
```

#### Create Pricing Rule
```http
POST /api/pricing/rules
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "modelId": "gpt-4",
  "componentType": "LLM_INPUT",
  "unitType": "TOKEN",
  "costPerUnit": 0.000003,
  "markupPercent": 20,
  "pricePerUnit": 0.0000036,
  "creditsPerUnit": 0.00036,
  "tierMultiplier": 1,
  "isActive": true,
  "effectiveFrom": "2024-01-01T00:00:00Z",
  "metadata": {}
}
```

#### Update Pricing Rule
```http
PATCH /api/pricing/rules/{id}
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "costPerUnit": 0.0000035,
  "markupPercent": 25,
  "isActive": true
}
```

#### Delete Pricing Rule
```http
DELETE /api/pricing/rules/{id}
Authorization: Bearer {token}
```

### Cost Calculation

#### Calculate Cost
```http
POST /api/pricing/calculate
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "platformId": "openai",
  "modelId": "gpt-4",
  "inputTokens": 1000,
  "outputTokens": 500,
  "ragEmbeddings": 10,
  "ragSearches": 5,
  "toolCalls": 2,
  "userTier": "PRO"
}
```

#### Estimate Cost
```http
POST /api/pricing/estimate
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "platformId": "openai",
  "modelId": "gpt-4",
  "estimatedInputTokens": 1000,
  "estimatedOutputTokens": 500,
  "ragOperations": 15,
  "toolCalls": 2
}
```

### Credit Management

#### Reserve Credits
```http
POST /api/pricing/reserve
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "amount": 100,
  "sessionId": "session-123"
}

Response:
{
  "success": true,
  "reservationId": "reservation-abc123"
}
```

#### Charge Credits
```http
POST /api/core/credit-reservations/{reservationId}/charge
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "actualAmount": 85,
  "usageLogId": "usage-log-456"
}

Response:
{
  "success": true,
  "balanceAfter": 915
}
```

#### Refund Credits
```http
POST /api/core/credit-reservations/{reservationId}/refund
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "reason": "Agent execution failed"
}
```

### Usage Tracking

#### Get Usage History
```http
GET /api/pricing/usage-history?page=1&limit=20&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}
```

#### Get Session Usage
```http
GET /api/pricing/session/{sessionId}/usage
Authorization: Bearer {token}
```

## Data Models

### PricingRule
```typescript
interface PricingRule {
  id: string;
  modelId: string;
  componentType: PricingComponentType;
  unitType: PricingUnitType;
  costPerUnit: number;
  markupPercent: number;
  pricePerUnit: number;
  creditsPerUnit: number;
  minUnits?: number;
  tierMultiplier: number;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### CostBreakdown
```typescript
interface CostBreakdown {
  llmInputCost: number;
  llmOutputCost: number;
  ragCost: number;
  toolCallCost: number;
  nestedAgentCost: number;
  totalCostUsd: number;
  totalCredits: number;
  breakdown: CostBreakdownItem[];
}
```

### CreditReservation
```typescript
interface CreditReservation {
  id: string;
  userId: string;
  amount: number;
  sessionId?: string;
  status: CreditReservationStatus;
  chargedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}
```

### AgentUsageLog
```typescript
interface AgentUsageLog {
  id: string;
  userId: string;
  agentId?: string;
  platformId: string;
  modelId: string;
  sessionId?: string;
  parentCallId?: string;
  callDepth: number;
  
  // Usage metrics
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  ragEmbeddings: number;
  ragSearches: number;
  toolCalls: number;
  nestedAgentCalls: number;
  
  // Cost breakdown
  llmInputCost: number;
  llmOutputCost: number;
  ragCost: number;
  toolCallCost: number;
  nestedAgentCost: number;
  totalCostUsd: number;
  
  // Credits/Points charged
  creditsCharged: number;
  pointsCharged: number;
  currency: string;
  
  // Status
  status: string;
  errorMessage?: string;
  
  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  
  // Metadata
  metadata: Record<string, any>;
}
```

## Pricing Components

### Component Types

1. **LLM_INPUT**: Input tokens for language models
2. **LLM_OUTPUT**: Output tokens from language models
3. **RAG_EMBEDDING**: Text embedding operations
4. **RAG_SEARCH**: Vector search operations
5. **TOOL_CALL**: Tool/function call operations
6. **STORAGE**: Storage operations

### Unit Types

1. **TOKEN**: Per token pricing
2. **REQUEST**: Per request pricing
3. **GB**: Per gigabyte pricing
4. **CALL**: Per call pricing

## User Tiers

### Tier Structure

1. **FREE**: Standard pricing (1.0x multiplier)
2. **BASIC**: 10% discount (0.9x multiplier)
3. **PRO**: 20% discount (0.8x multiplier)
4. **ENTERPRISE**: 30% discount (0.7x multiplier)

### Tier Benefits

| Tier | Discount | Features |
|------|----------|----------|
| FREE | 0% | Basic access |
| BASIC | 10% | Priority support |
| PRO | 20% | Advanced analytics |
| ENTERPRISE | 30% | Custom integrations |

## Configuration

### Environment Variables

```bash
# Credit System Configuration
CREDIT_TO_USD_RATE=0.01
RESERVATION_EXPIRY_MINUTES=30
MAX_RESERVATION_AMOUNT=1000

# Pricing Configuration
DEFAULT_MARKUP_PERCENT=20
MIN_CREDITS_FOR_EXECUTION=1

# Redis Configuration (for distributed locking)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/smart-ai-hub
```

### Default Pricing

```javascript
DEFAULT_PRICING = {
  LLM_INPUT_COST_PER_TOKEN: 0.000003,  // $0.003 per 1K tokens
  LLM_OUTPUT_COST_PER_TOKEN: 0.000015, // $0.015 per 1K tokens
  RAG_EMBEDDING_COST: 0.001,           // $0.001 per embedding
  RAG_SEARCH_COST: 0.0005,             // $0.0005 per search
  TOOL_CALL_COST: 0.01,                // $0.01 per tool call
}
```

## Security Considerations

1. **Credit Protection**: Distributed locking prevents credit overspending
2. **Access Control**: All operations require valid authentication
3. **Audit Trail**: All pricing and usage operations are logged
4. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
5. **Input Validation**: All inputs are validated and sanitized

## Performance Optimization

1. **Caching**: Pricing rules are cached for fast access
2. **Batch Processing**: Usage logs are processed in batches
3. **Connection Pooling**: Database connections are pooled
4. **Async Processing**: Cost calculations are processed asynchronously

## Monitoring and Logging

1. **Credit Balance Monitoring**: Track user credit balances
2. **Usage Analytics**: Monitor usage patterns and trends
3. **Cost Tracking**: Track costs across platforms and models
4. **Error Monitoring**: Monitor and alert on pricing errors

## Troubleshooting

### Common Issues

1. **Credit Reservation Fails**
   - Check user's credit balance
   - Verify Redis connection
   - Check for concurrent reservations

2. **Cost Calculation Errors**
   - Verify pricing rules exist for the model
   - Check input parameters
   - Review tier multipliers

3. **Usage Tracking Issues**
   - Check database connection
   - Verify session IDs
   - Review error logs

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Invalid request | Check request parameters |
| 401 | Unauthorized | Verify authentication token |
| 402 | Insufficient credits | Add more credits to account |
| 404 | Pricing rule not found | Create pricing rule for model |
| 409 | Reservation conflict | Retry with new reservation |
| 500 | Internal error | Check system logs |

## Future Enhancements

1. **Dynamic Pricing**: Implement demand-based pricing
2. **Subscription Plans**: Add monthly subscription options
3. **Cost Alerts**: Notify users of unusual spending
4. **Budget Management**: Allow users to set spending limits
5. **Advanced Analytics**: More detailed usage analytics