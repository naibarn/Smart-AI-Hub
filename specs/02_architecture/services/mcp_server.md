# MCP Server

## Overview

The MCP (Model Context Protocol) Server handles integration with various LLM providers, manages real-time communication via WebSockets, and tracks usage for billing purposes. It serves as the bridge between the Smart AI Hub platform and external AI services.

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.x
- **Port**: 3003
- **Language**: TypeScript 5.x
- **WebSocket**: ws library
- **Queue**: BullMQ for request management
- **Circuit Breaker**: opossum for fault tolerance

## Responsibilities

1. **LLM Provider Integration**: Connect with OpenAI, Claude, and other providers
2. **WebSocket Real-time Communication**: Handle streaming responses
3. **Request/Response Transformation**: Convert between platform and provider formats
4. **Token Usage Tracking**: Monitor and log usage for billing
5. **Provider Fallback Logic**: Switch providers when one fails
6. **Sora2 Video Generator API Integration**: Handle video generation requests
7. **Custom GPT Integration**: Enhanced video generation workflows

## Components

- **WebSocket Server**: Real-time bidirectional communication
- **OpenAI Client Wrapper**: OpenAI API integration
- **Anthropic Client Wrapper**: Claude API integration
- **Request Queue**: BullMQ for managing request processing
- **Circuit Breaker**: Fault tolerance for provider failures

## Workflow

1. Validate JWT & check credits
2. Route to appropriate LLM provider
3. Transform request to provider format
4. Send request with retry logic
5. Stream response via WebSocket
6. Log usage & deduct credits

## WebSocket Protocol

### Client → Server
```typescript
interface MCPRequest {
  id: string;
  type: 'completion' | 'chat' | 'embedding';
  provider: 'openai' | 'claude' | 'auto';
  model: string;
  messages?: Message[];
  prompt?: string;
  stream: boolean;
  maxTokens?: number;
}
```

### Server → Client (Streaming)
```typescript
interface MCPStreamChunk {
  id: string;
  type: 'chunk' | 'done' | 'error';
  data?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

### Server → Client (Non-streaming)
```typescript
interface MCPResponse {
  id: string;
  type: 'completion';
  data: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    credits: number;
  };
  metadata: {
    model: string;
    provider: string;
    latency: number;
  };
}
```

## Provider Fallback Logic

```typescript
const providerPriority = ['openai', 'claude'];

async function executeWithFallback(request: MCPRequest): Promise<MCPResponse> {
  let lastError: Error;

  for (const provider of providerPriority) {
    try {
      const result = await providers[provider].execute(request);
      return result;
    } catch (error) {
      lastError = error;
      logger.warn(`Provider ${provider} failed, trying next`, { error });

      // If rate limited, add delay
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        await sleep(5000);
      }
    }
  }

  throw new AppError('ALL_PROVIDERS_FAILED', 'All LLM providers failed', { lastError });
}
```

## Sora2 Video Generator Integration

### Video Request Structure
```typescript
interface Sora2VideoRequest {
  prompt: string;
  duration: number; // seconds
  resolution: '720p' | '1080p' | '4K';
  style?: string;
  aspectRatio?: string;
  userId: string;
  sessionId: string;
}
```

### Video Response Structure
```typescript
interface Sora2VideoResponse {
  videoId: string;
  status: 'processing' | 'completed' | 'failed';
  url?: string;
  thumbnailUrl?: string;
  duration: number;
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
}
```

### Sora2 API Endpoints

#### Generate Video
```
POST /api/mcp/sora2/generate
Request: {
  prompt: string,
  duration: number,
  resolution: string,
  style?: string,
  aspectRatio?: string
}
Response: {
  videoId: string,
  status: 'processing',
  creditsUsed: number,
  estimatedTime: number
}
```

#### Check Video Status
```
GET /api/mcp/sora2/status/:videoId
Response: {
  videoId: string,
  status: 'processing' | 'completed' | 'failed',
  url?: string,
  thumbnailUrl?: string,
  progress: number,
  createdAt: string
}
```

## Custom GPT Integration for Video Workflows

### Video Workflow Request
```typescript
interface VideoWorkflowRequest {
  workflow: 'text-to-video' | 'image-to-video' | 'video-enhancement';
  input: {
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
  };
  parameters: {
    style?: string;
    duration?: number;
    resolution?: string;
    enhancementType?: string;
  };
  sessionId: string;
}
```

### GPT-Assisted Video Generation
```typescript
app.post('/api/mcp/gpt/video-workflow', authenticate, async (req, res) => {
  const { workflow, input, parameters, sessionId } = req.body;
  
  // Step 1: Use Custom GPT to analyze and enhance the request
  const enhancedPrompt = await gptService.enhanceVideoPrompt({
    originalPrompt: input.text,
    workflow,
    parameters,
    sessionId
  });
  
  // Step 2: Generate video with Sora2 using enhanced prompt
  const videoRequest = await sora2Service.createVideoRequest({
    prompt: enhancedPrompt,
    duration: parameters.duration || 30,
    resolution: parameters.resolution || '1080p',
    style: parameters.style,
    userId: req.user.id,
    sessionId
  });
  
  res.json({
    workflowId: generateId(),
    videoId: videoRequest.id,
    enhancedPrompt,
    status: 'processing'
  });
});
```

## Circuit Breaker Pattern

```typescript
import CircuitBreaker from 'opossum';

const options = {
  timeout: 30000, // 30 seconds
  errorThresholdPercentage: 50,
  resetTimeout: 30000, // Try again after 30s
};

const breaker = new CircuitBreaker(callOpenAI, options);

breaker.on('open', () => {
  logger.error('Circuit breaker opened for OpenAI');
  // Switch to Claude
});

breaker.on('halfOpen', () => {
  logger.info('Circuit breaker half-open, testing OpenAI');
});
```

## Security Features

- JWT authentication for all requests
- Credit balance verification before processing
- Request size limits
- Input validation and sanitization
- WebSocket connection rate limiting
- Usage tracking and audit logging

## Performance Optimizations

- Request queuing with BullMQ
- Connection pooling for LLM providers
- Response streaming for large outputs
- Provider response caching where appropriate
- Automatic retry with exponential backoff

## Monitoring

- Request/response logging
- Provider performance metrics
- Error rate tracking
- Usage analytics
- Circuit breaker state monitoring