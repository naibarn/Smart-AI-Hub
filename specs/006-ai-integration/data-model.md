# AI Integration Data Model

## Overview

The AI Integration data model provides a comprehensive structure for managing AI provider integrations, tracking usage, handling video generation workflows, and maintaining real-time communication sessions. This model supports multiple LLM providers, WebSocket connections, and specialized AI workflows while maintaining data integrity and performance.

## Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   AIProvider    │       │   AIModel         │       │  AIUsageLog     │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────┤ id (PK)          │◄──────┤ id (PK)         │
│ name            │       │ providerId (FK)  │       │ userId (FK)     │
│ type            │       │ name             │       │ modelId (FK)    │
│ status          │       │ type             │       │ providerId (FK) │
│ capabilities    │       │ maxTokens        │       │ sessionId       │
│ config          │       │ pricing          │       │ requestType     │
│ createdAt       │       │ createdAt        │       │ tokensUsed      │
└─────────────────┘       └──────────────────┘       │ creditsUsed    │
                                                    │ latency         │
                                                    │ createdAt       │
                                                    └─────────────────┘
                                                              │
┌─────────────────┐       ┌──────────────────┐              │
│  VideoRequest   │       │  VideoWorkflow   │              │
├─────────────────┤       ├──────────────────┤              │
│ id (PK)         │◄──────┤ id (PK)          │              │
│ userId (FK)     │       │ videoRequestId   │              │
│ prompt          │       │ workflowType     │              │
│ parameters      │       │ input            │              │
│ status          │       │ enhancedPrompt   │              │
│ url             │       │ status           │              │
│ thumbnailUrl    │       │ createdAt        │              │
│ creditsUsed     │       └──────────────────┘              │
│ duration        │                                      │
│ createdAt       │                                      │
│ completedAt     │                                      │
└─────────────────┘                                      │
         │                                               │
         └───────────────────────────────────────────────┘
```

## Data Models

### AIProvider

The `AIProvider` entity represents external AI service providers that can be integrated with the platform.

#### Prisma Schema

```prisma
model AIProvider {
  id           String   @id @default(uuid())
  name         String   @unique
  type         String   // 'llm' | 'video' | 'image'
  status       String   @default('active') // 'active' | 'inactive' | 'degraded'
  capabilities Json     // Array of capability strings
  config       Json     // Provider-specific configuration
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  models       AIModel[]
  usageLogs    AIUsageLog[]
  videoRequests VideoRequest[]

  @@index([type])
  @@index([status])
  @@map("ai_providers")
}
```

#### Field Descriptions

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | String | Primary key identifier | UUID, Required |
| name | String | Provider name (e.g., "OpenAI", "Claude") | Unique, Required |
| type | String | Provider type | 'llm' | 'video' | 'image', Required |
| status | String | Current status | 'active' | 'inactive' | 'degraded', Default: active |
| capabilities | Json | Array of supported capabilities | JSON array, Required |
| config | Json | Provider-specific configuration | JSON object, Required |
| createdAt | DateTime | Creation timestamp | Auto-generated, Required |
| updatedAt | DateTime | Last update timestamp | Auto-updated, Required |

### AIModel

The `AIModel` entity represents specific AI models offered by providers.

#### Prisma Schema

```prisma
model AIModel {
  id            String   @id @default(uuid())
  providerId    String
  name          String
  type          String   // 'completion' | 'chat' | 'embedding' | 'video'
  maxTokens     Int?
  pricing       Json     // Pricing information
  capabilities  Json?    // Model-specific capabilities
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  provider      AIProvider @relation(fields: [providerId], references: [id])
  usageLogs     AIUsageLog[]

  @@unique([providerId, name])
  @@index([type])
  @@map("ai_models")
}
```

#### Field Descriptions

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | String | Primary key identifier | UUID, Required |
| providerId | String | Reference to AI provider | UUID, Required |
| name | String | Model name (e.g., "gpt-4", "claude-3") | Required |
| type | String | Model type | 'completion' | 'chat' | 'embedding' | 'video', Required |
| maxTokens | Int? | Maximum token limit | Positive integer or null |
| pricing | Json | Pricing information | JSON object, Required |
| capabilities | Json? | Model-specific capabilities | JSON object or null |
| createdAt | DateTime | Creation timestamp | Auto-generated, Required |
| updatedAt | DateTime | Last update timestamp | Auto-updated, Required |

### AIUsageLog

The `AIUsageLog` entity tracks all AI interactions for billing and analytics.

#### Prisma Schema

```prisma
model AIUsageLog {
  id           String   @id @default(uuid())
  userId       String
  modelId      String
  providerId   String
  sessionId    String?
  requestType  String   // 'completion' | 'chat' | 'video' | 'workflow'
  tokensUsed   Int      @default(0)
  creditsUsed  Int      @default(0)
  latency      Int?     // Response time in milliseconds
  status       String   // 'success' | 'error' | 'timeout'
  errorMessage String?
  metadata     Json?    // Additional request/response data
  createdAt    DateTime @default(now())

  user         User @relation(fields: [userId], references: [id])
  model        AIModel @relation(fields: [modelId], references: [id])
  provider     AIProvider @relation(fields: [providerId], references: [id])

  @@index([userId])
  @@index([modelId])
  @@index([providerId])
  @@index([createdAt])
  @@index([sessionId])
  @@map("ai_usage_logs")
}
```

#### Field Descriptions

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | String | Primary key identifier | UUID, Required |
| userId | String | User who made the request | UUID, Required |
| modelId | String | AI model used | UUID, Required |
| providerId | String | AI provider used | UUID, Required |
| sessionId | String? | WebSocket session identifier | String or null |
| requestType | String | Type of request | 'completion' | 'chat' | 'video' | 'workflow', Required |
| tokensUsed | Int | Number of tokens consumed | Non-negative integer, Default: 0 |
| creditsUsed | Int | Credits charged | Non-negative integer, Default: 0 |
| latency | Int? | Response time in milliseconds | Positive integer or null |
| status | String | Request status | 'success' | 'error' | 'timeout', Required |
| errorMessage | String? | Error message (if failed) | String or null |
| metadata | Json? | Additional request/response data | JSON object or null |
| createdAt | DateTime | Request timestamp | Auto-generated, Required |

### VideoRequest

The `VideoRequest` entity manages video generation requests.

#### Prisma Schema

```prisma
model VideoRequest {
  id            String    @id @default(uuid())
  userId        String
  providerId    String
  prompt        String
  parameters    Json      // Video generation parameters
  status        String    @default('queued') // 'queued' | 'processing' | 'completed' | 'failed'
  url           String?
  thumbnailUrl  String?
  creditsUsed   Int       @default(0)
  duration      Int?      // Video duration in seconds
  progress      Int       @default(0) // Progress percentage
  errorMessage  String?
  metadata      Json?     // Additional video metadata
  createdAt     DateTime  @default(now())
  completedAt   DateTime?
  expiresAt     DateTime? // URL expiration

  user          User @relation(fields: [userId], references: [id])
  provider      AIProvider @relation(fields: [providerId], references: [id])
  workflow      VideoWorkflow?

  @@index([userId])
  @@index([providerId])
  @@index([status])
  @@index([createdAt])
  @@map("video_requests")
}
```

#### Field Descriptions

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | String | Primary key identifier | UUID, Required |
| userId | String | User who requested the video | UUID, Required |
| providerId | String | Video generation provider | UUID, Required |
| prompt | String | Text prompt for video generation | String, Required |
| parameters | Json | Video generation parameters | JSON object, Required |
| status | String | Generation status | 'queued' | 'processing' | 'completed' | 'failed', Default: queued |
| url | String? | URL of generated video | String or null |
| thumbnailUrl | String? | URL of video thumbnail | String or null |
| creditsUsed | Int | Credits charged for generation | Non-negative integer, Default: 0 |
| duration | Int? | Video duration in seconds | Positive integer or null |
| progress | Int | Generation progress percentage | 0-100, Default: 0 |
| errorMessage | String? | Error message (if failed) | String or null |
| metadata | Json? | Additional video metadata | JSON object or null |
| createdAt | DateTime | Request timestamp | Auto-generated, Required |
| completedAt | DateTime? | Completion timestamp | DateTime or null |
| expiresAt | DateTime? | URL expiration date | DateTime or null |

### VideoWorkflow

The `VideoWorkflow` entity manages enhanced video generation workflows.

#### Prisma Schema

```prisma
model VideoWorkflow {
  id              String   @id @default(uuid())
  videoRequestId  String   @unique
  workflowType    String   // 'text-to-video' | 'image-to-video' | 'video-enhancement'
  input           Json     // Workflow input data
  enhancedPrompt  String?  // GPT-enhanced prompt
  parameters      Json     // Workflow parameters
  status          String   @default('processing') // 'processing' | 'completed' | 'failed'
  steps           Json?    // Workflow step tracking
  metadata        Json?    // Additional workflow data
  createdAt       DateTime @default(now())
  completedAt     DateTime?

  videoRequest    VideoRequest @relation(fields: [videoRequestId], references: [id])

  @@index([workflowType])
  @@index([status])
  @@map("video_workflows")
}
```

#### Field Descriptions

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | String | Primary key identifier | UUID, Required |
| videoRequestId | String | Reference to video request | UUID, Unique, Required |
| workflowType | String | Type of workflow | 'text-to-video' | 'image-to-video' | 'video-enhancement', Required |
| input | Json | Workflow input data | JSON object, Required |
| enhancedPrompt | String? | GPT-enhanced prompt | String or null |
| parameters | Json | Workflow parameters | JSON object, Required |
| status | String | Workflow status | 'processing' | 'completed' | 'failed', Default: processing |
| steps | Json? | Workflow step tracking | JSON array or null |
| metadata | Json? | Additional workflow data | JSON object or null |
| createdAt | DateTime | Creation timestamp | Auto-generated, Required |
| completedAt | DateTime? | Completion timestamp | DateTime or null |

## Database Schema

### SQL Schema (PostgreSQL)

```sql
-- AI Providers Table
CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('llm', 'video', 'image')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'degraded')),
    capabilities JSONB NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for AI Providers
CREATE INDEX idx_ai_providers_type ON ai_providers(type);
CREATE INDEX idx_ai_providers_status ON ai_providers(status);

-- AI Models Table
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('completion', 'chat', 'embedding', 'video')),
    max_tokens INTEGER,
    pricing JSONB NOT NULL,
    capabilities JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_provider_model UNIQUE (provider_id, name)
);

-- Indexes for AI Models
CREATE INDEX idx_ai_models_type ON ai_models(type);
CREATE INDEX idx_ai_models_provider_id ON ai_models(provider_id);

-- AI Usage Logs Table
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    model_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    session_id VARCHAR(100),
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('completion', 'chat', 'video', 'workflow')),
    tokens_used INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    latency INTEGER,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_usage_logs_model FOREIGN KEY (model_id) REFERENCES ai_models(id),
    CONSTRAINT fk_usage_logs_provider FOREIGN KEY (provider_id) REFERENCES ai_providers(id)
);

-- Indexes for AI Usage Logs
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_model_id ON ai_usage_logs(model_id);
CREATE INDEX idx_ai_usage_logs_provider_id ON ai_usage_logs(provider_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_session_id ON ai_usage_logs(session_id);

-- Video Requests Table
CREATE TABLE video_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    prompt TEXT NOT NULL,
    parameters JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    url TEXT,
    thumbnail_url TEXT,
    credits_used INTEGER NOT NULL DEFAULT 0,
    duration INTEGER,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_video_requests_provider FOREIGN KEY (provider_id) REFERENCES ai_providers(id)
);

-- Indexes for Video Requests
CREATE INDEX idx_video_requests_user_id ON video_requests(user_id);
CREATE INDEX idx_video_requests_provider_id ON video_requests(provider_id);
CREATE INDEX idx_video_requests_status ON video_requests(status);
CREATE INDEX idx_video_requests_created_at ON video_requests(created_at);

-- Video Workflows Table
CREATE TABLE video_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_request_id UUID NOT NULL UNIQUE,
    workflow_type VARCHAR(50) NOT NULL CHECK (workflow_type IN ('text-to-video', 'image-to-video', 'video-enhancement')),
    input JSONB NOT NULL,
    enhanced_prompt TEXT,
    parameters JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    steps JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_video_workflows_request FOREIGN KEY (video_request_id) REFERENCES video_requests(id) ON DELETE CASCADE
);

-- Indexes for Video Workflows
CREATE INDEX idx_video_workflows_workflow_type ON video_workflows(workflow_type);
CREATE INDEX idx_video_workflows_status ON video_workflows(status);
```

## Business Logic Constraints

### Provider Management

1. **Unique Provider Names**: Each provider must have a unique name
2. **Provider Types**: Providers must be classified by type (LLM, video, image)
3. **Status Management**: Provider status must be accurately tracked
4. **Configuration Validation**: Provider configurations must be valid JSON

### Model Management

1. **Unique Model Names**: Model names must be unique within each provider
2. **Type Consistency**: Model types must match provider capabilities
3. **Pricing Structure**: Pricing information must follow standard format
4. **Token Limits**: Maximum token limits must be enforced

### Usage Tracking

1. **Accurate Logging**: All AI interactions must be logged
2. **Credit Calculation**: Credit usage must be accurately calculated
3. **Session Tracking**: WebSocket sessions must be properly tracked
4. **Error Handling**: Failed requests must be logged with error details

### Video Generation

1. **Request Validation**: Video requests must be validated before processing
2. **Progress Tracking**: Generation progress must be accurately tracked
3. **URL Management**: Generated URLs must have expiration dates
4. **Workflow Integration**: Enhanced workflows must be properly linked

## Performance Considerations

### Indexing Strategy

1. **User-based Queries**: Index on userId for efficient user history queries
2. **Time-based Queries**: Index on createdAt for analytics and reporting
3. **Status Queries**: Index on status fields for efficient filtering
4. **Session Queries**: Index on sessionId for WebSocket session tracking

### Query Optimization

```sql
-- Efficient usage analytics query
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_requests,
    SUM(tokens_used) as total_tokens,
    SUM(credits_used) as total_credits,
    AVG(latency) as avg_latency
FROM ai_usage_logs
WHERE user_id = $1 
  AND created_at BETWEEN $2 AND $3
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date;

-- Efficient video status tracking
SELECT 
    vr.id,
    vr.status,
    vr.progress,
    vr.created_at,
    vw.workflow_type
FROM video_requests vr
LEFT JOIN video_workflows vw ON vr.id = vw.video_request_id
WHERE vr.user_id = $1
ORDER BY vr.created_at DESC;
```

### Scaling Considerations

1. **Partitioning**: Consider time-based partitioning for usage logs
2. **Archiving**: Archive old usage logs to separate tables
3. **Caching**: Cache frequently accessed provider and model data
4. **Connection Pooling**: Optimize database connections for high-volume requests

## Security Considerations

### Data Protection

1. **Input Validation**: All inputs must be validated and sanitized
2. **Access Control**: Implement proper authorization for data access
3. **Audit Logging**: Log all data modifications and access
4. **Data Encryption**: Sensitive data must be encrypted at rest

### Privacy Protection

1. **User Data**: User prompts and responses must be protected
2. **Session Data**: WebSocket session data must be secured
3. **Usage Data**: Usage analytics must be anonymized where appropriate
4. **Retention Policies**: Implement data retention policies for compliance

## Migration Strategy

### Initial Migration

```sql
-- Create tables
CREATE TABLE ai_providers (...);
CREATE TABLE ai_models (...);
CREATE TABLE ai_usage_logs (...);
CREATE TABLE video_requests (...);
CREATE TABLE video_workflows (...);

-- Create indexes
CREATE INDEX idx_ai_providers_type ON ai_providers(type);
-- ... other indexes

-- Insert initial providers
INSERT INTO ai_providers (name, type, capabilities, config) VALUES
('OpenAI', 'llm', '["completion", "chat", "embedding"]', '{"api_key": "..."}'),
('Claude', 'llm', '["completion", "chat"]', '{"api_key": "..."}'),
('Sora2', 'video', '["text-to-video"]', '{"api_key": "..."}');
```

### Data Migration

```typescript
// Example migration script
async function migrateAIProviders() {
  const providers = [
    {
      name: 'OpenAI',
      type: 'llm',
      capabilities: ['completion', 'chat', 'embedding'],
      config: { apiVersion: 'v1', endpoint: 'https://api.openai.com' }
    },
    {
      name: 'Claude',
      type: 'llm',
      capabilities: ['completion', 'chat'],
      config: { apiVersion: '2023-06-01', endpoint: 'https://api.anthropic.com' }
    }
  ];
  
  for (const provider of providers) {
    await db.aIProvider.create({
      data: provider
    });
  }
}
```

## Analytics and Reporting

### Key Metrics

1. **Usage Volume**: Total requests and tokens by provider/model
2. **Performance Metrics**: Average latency and success rates
3. **Cost Analysis**: Credit consumption and cost trends
4. **User Engagement**: Active users and session duration

### Sample Queries

```sql
-- Provider performance metrics
SELECT 
    p.name as provider_name,
    COUNT(*) as total_requests,
    AVG(ul.latency) as avg_latency,
    SUM(ul.credits_used) as total_credits,
    COUNT(CASE WHEN ul.status = 'success' THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM ai_usage_logs ul
JOIN ai_providers p ON ul.provider_id = p.id
WHERE ul.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY total_requests DESC;

-- Video generation analytics
SELECT 
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as total_requests,
    SUM(credits_used) as total_credits,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_processing_time,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as completion_rate
FROM video_requests
WHERE created_at >= NOW() - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week;
```

## Integration Points

### User Management System

```typescript
interface UserService {
  validateUser(userId: string): Promise<boolean>;
  deductCredits(userId: string, amount: number): Promise<void>;
  getUserBalance(userId: string): Promise<number>;
}
```

### Financial System

```typescript
interface FinancialService {
  recordTransaction(transaction: CreditTransaction): Promise<void>;
  getCreditRate(modelId: string, tokens: number): Promise<number>;
}
```

### Queue System

```typescript
interface QueueService {
  enqueueVideoGeneration(request: VideoRequest): Promise<string>;
  dequeueVideoGeneration(): Promise<VideoRequest | null>;
  updateJobStatus(jobId: string, status: string): Promise<void>;
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('AIProvider Model', () => {
  test('should validate provider creation', async () => {
    const provider = await AIProvider.create({
      name: 'Test Provider',
      type: 'llm',
      capabilities: ['completion', 'chat'],
      config: { apiKey: 'test-key' }
    });
    
    expect(provider.name).toBe('Test Provider');
    expect(provider.status).toBe('active');
  });
  
  test('should enforce unique provider names', async () => {
    await AIProvider.create({ name: 'DUPLICATE', type: 'llm' });
    
    await expect(
      AIProvider.create({ name: 'DUPLICATE', type: 'llm' })
    ).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
describe('Video Generation Flow', () => {
  test('should complete video generation workflow', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider();
    
    const videoRequest = await VideoRequest.create({
      userId: user.id,
      providerId: provider.id,
      prompt: 'Test video',
      parameters: { duration: 30, resolution: '1080p' }
    });
    
    // Simulate processing
    await videoRequest.update({
      status: 'completed',
      url: 'https://cdn.example.com/video.mp4',
      completedAt: new Date()
    });
    
    expect(videoRequest.status).toBe('completed');
    expect(videoRequest.url).toBeTruthy();
  });
});
```

## Future Enhancements

### Advanced AI Features

```prisma
model AIAgent {
  id          String   @id @default(uuid())
  name        String
  type        String   // 'chatbot' | 'assistant' | 'analyzer'
  config      Json     // Agent configuration
  capabilities Json    // Agent capabilities
  userId      String   // Owner user
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  conversations AIConversation[]
  
  @@index([userId])
  @@map("ai_agents")
}

model AIConversation {
  id        String   @id @default(uuid())
  agentId   String
  userId    String
  messages  Json     // Conversation history
  status    String   // 'active' | 'archived'
  createdAt DateTime @default(now())
  
  agent     AIAgent @relation(fields: [agentId], references: [id])
  
  @@index([agentId])
  @@index([userId])
  @@map("ai_conversations")
}
```

### Multi-Modal Support

```prisma
model MultiModalRequest {
  id          String   @id @default(uuid())
  userId      String
  inputType   String   // 'text' | 'image' | 'video' | 'audio'
  inputData   Json     // Input data with type-specific structure
  outputType  String   // 'text' | 'image' | 'video' | 'audio'
  parameters  Json     // Processing parameters
  status      String
  result      Json?    // Processing result
  metadata    Json?    // Additional metadata
  createdAt   DateTime @default(now())
  completedAt DateTime?
  
  @@index([userId])
  @@index([inputType])
  @@index([status])
  @@map("multimodal_requests")
}
```

## Cross-References

- [EPIC-002: Financial System & Credits](../004-financial-system/data-model.md) - Credit account management
- [FEAT-001: User Management & Profiles](../002-user-management/data-model.md) - User data model
- [API Documentation](./contracts/api-spec.json) - Detailed API documentation