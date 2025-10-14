# Epic 4: MCP Server Development (Sprint 3-4)

## E4.1: MCP Server Foundation

**Story Points**: 8
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E2.1 (JWT middleware), E3.1 (Credit system)
**Risk Level**: High
- **links_to_architecture**:
  - Service: `../../02_architecture/services/mcp_server.md`, `../../02_architecture/services/api_gateway.md`
  - Data Models: `../../02_architecture/data_models/usage_log.md`

**Acceptance Criteria**:

- [x] MCP protocol implementation ✅
- [x] WebSocket server with authentication ✅
- [x] Request/response message format ✅
- [x] Connection lifecycle management ✅
- [x] Error handling and logging ✅
- [x] Heartbeat/ping-pong mechanism ✅

**WebSocket Server Setup**:

```typescript
import WebSocket from 'ws';

const wss = new WebSocket.Server({
  port: 3003,
  verifyClient: async (info, callback) => {
    // Verify JWT from query param or header
    try {
      const token = extractToken(info.req);
      const user = await verifyToken(token);
      info.req.user = user;
      callback(true);
    } catch (error) {
      callback(false, 401, 'Unauthorized');
    }
  },
});
```

**Message Protocol**:

```typescript
// Client → Server
interface MCPRequest {
  id: string; // Unique request ID
  type: 'completion' | 'chat'; // Request type
  provider?: 'openai' | 'claude' | 'auto';
  model: string;
  messages: Message[];
  stream: boolean;
  maxTokens?: number;
  temperature?: number;
}

// Server → Client
interface MCPResponse {
  id: string; // Matches request ID
  type: 'chunk' | 'done' | 'error';
  data?: string; // Content chunk
  usage?: TokenUsage; // Final usage stats
  error?: ErrorDetails;
}
```

**Connection Management**:

- [x] Handle client connect ✅
- [x] Authenticate with JWT ✅
- [x] Track active connections (Map) ✅
- [x] Handle client disconnect ✅
- [x] Clean up resources ✅
- [x] Implement reconnection logic ✅

**Heartbeat**:

```typescript
// Ping every 30 seconds
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
```

**Completion Notes**:

- Full WebSocket server implementation with authentication
- Connection service for managing active connections
- Credit service integration for pre-request validation
- Logging service for request tracking and analytics
- Health check and stats endpoints for monitoring
- Comprehensive error handling and structured logging
- Mock LLM processing (placeholder for actual AI integration)

---

## E4.2: OpenAI Integration

**Story Points**: 5
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-13
**Dependencies**: E4.1
**Risk Level**: Medium
**Assigned To**: Backend Team
- **links_to_architecture**:
  - Service: `../../02_architecture/services/mcp_server.md`
  - Data Models: `../../02_architecture/data_models/usage_log.md`, `../../02_architecture/data_models/credit_transaction.md`

**Acceptance Criteria**:

- [x] OpenAI SDK integration
- [x] Support for GPT-3.5, GPT-4
- [x] Streaming responses
- [x] Token usage tracking
- [x] Error handling (rate limits, timeouts)
- [x] Credit deduction per request

**Completion Notes**:

- Full OpenAI SDK integration completed with streaming support
- GPT-3.5 and GPT-4 models implemented
- Token usage tracking and credit deduction working
- Rate limiting and timeout handling implemented
- Comprehensive error handling for all failure scenarios
- Integration with MCP server foundation completed

**Implementation**:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function callOpenAI(request: MCPRequest): Promise<MCPResponse> {
  // Check user credits before making request
  await checkSufficientCredits(request.userId, estimateCredits(request));

  try {
    const stream = await openai.chat.completions.create({
      model: request.model,
      messages: request.messages,
      stream: true,
      max_tokens: request.maxTokens,
    });

    // Stream chunks back to client
    for await (const chunk of stream) {
      ws.send(
        JSON.stringify({
          id: request.id,
          type: 'chunk',
          data: chunk.choices[0]?.delta?.content,
        })
      );
    }

    // Deduct credits based on actual usage
    await deductCredits(request.userId, usage.totalTokens);
  } catch (error) {
    // Handle errors (rate limit, timeout, etc.)
  }
}
```

**Rate Limit Handling**:

- [ ] Detect 429 status code
- [ ] Implement exponential backoff
- [ ] Queue requests if rate limited
- [ ] Fallback to Claude if persistent

**Tasks**:

- [ ] Install OpenAI SDK
- [ ] Create OpenAI provider wrapper
- [ ] Implement streaming logic
- [ ] Add token counting
- [ ] Integrate credit deduction
- [ ] Add comprehensive error handling

---

## E4.5: Sora2 Video Generator Integration

**Story Points**: 5
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-13
**Dependencies**: E4.1, E4.2
**Risk Level**: Medium
- **links_to_architecture**:
  - Service: `../../02_architecture/services/mcp_server.md`, `../../02_architecture/services/auth_service.md`
  - Data Models: `../../02_architecture/data_models/usage_log.md`, `../../02_architecture/data_models/credit_transaction.md`

**Acceptance Criteria**:

- [x] Sora2 Video API integration
- [x] Session-based authentication with verification codes
- [x] Google OAuth integration for Sora2
- [x] Credit management for video generation
- [x] Custom GPT integration for video workflows
- [x] Error handling for video generation failures

**Completion Notes**:

- Full Sora2 Video Generator integration completed
- Session-based authentication system implemented with verification codes
- Google OAuth integration with session parameters working
- Credit management APIs (check and deduct) implemented for video generation
- Custom GPT integration for video workflows completed
- Comprehensive error handling for all video generation scenarios
- Redis session storage implemented for OAuth tokens
- Atomic credit transactions for video generation

**Implementation Details**:

```typescript
// Sora2 Video Generation Endpoint
POST /api/sora2/generate
{
  "prompt": "A beautiful sunset over the ocean",
  "duration": 10,
  "resolution": "1080p"
}

// Session-based Authentication
GET /api/sora2/auth/session?code=verification_code
{
  "sessionToken": "session_token_here",
  "expiresAt": "2025-10-14T08:57:00Z"
}

// Credit Management for Video Generation
POST /api/credits/check
POST /api/credits/deduct
{
  "userId": "user_id",
  "credits": 5,
  "service": "sora2",
  "sessionId": "session_token_here"
}
```

**OAuth Flow with Verification Codes**:

1. User initiates video generation request
2. System generates verification code and stores in Redis
3. User authorizes via Google OAuth with verification code
4. System receives OAuth callback with verification code
5. System creates session token and stores in Redis
6. User can now generate videos using session token

**Security Measures**:

- [x] Verification codes expire after 15 minutes
- [x] Session tokens expire after 24 hours
- [x] All requests require valid session token
- [x] Credit deduction happens before video generation
- [x] Audit trail for all video generation requests

**Tests Completed**:

- [x] OAuth flow with verification codes
- [x] Session management in Redis
- [x] Credit check and deduction for video generation
- [x] Video generation with valid session
- [x] Error handling for expired sessions
- [x] Error handling for insufficient credits

---

## E4.3: Claude Integration

**Story Points**: 5
**Priority**: P1 (High)
**Status**: Not Started
**Dependencies**: E4.1, E4.2
**Risk Level**: Medium
- **links_to_architecture**:
  - Service: `../../02_architecture/services/mcp_server.md`
  - Data Models: `../../02_architecture/data_models/usage_log.md`

**Acceptance Criteria**:

- [ ] Anthropic SDK integration
- [ ] Support for Claude-3 models
- [ ] Unified interface with OpenAI
- [ ] Provider switching logic
- [ ] Load balancing between providers

**Provider Abstraction**:

```typescript
interface LLMProvider {
  execute(request: MCPRequest): Promise<MCPResponse>;
  estimateCredits(request: MCPRequest): number;
  checkAvailability(): Promise<boolean>;
}

class OpenAIProvider implements LLMProvider {
  // Implementation
}

class ClaudeProvider implements LLMProvider {
  // Implementation
}

// Provider selection
const providers = {
  openai: new OpenAIProvider(),
  claude: new ClaudeProvider(),
};

function selectProvider(request: MCPRequest): LLMProvider {
  if (request.provider && request.provider !== 'auto') {
    return providers[request.provider];
  }

  // Auto-select based on availability and load
  return selectBestProvider();
}
```

---

## E4.4: MCP Authentication & Authorization

**Story Points**: 3
**Priority**: P1 (High)
**Status**: Not Started
**Dependencies**: E4.1, E2.1
**Risk Level**: Low
- **links_to_architecture**:
  - Service: `../../02_architecture/services/mcp_server.md`, `../../02_architecture/services/auth_service.md`, `../../02_architecture/services/core_service.md`
  - Data Models: `../../02_architecture/data_models/user.md`, `../../02_architecture/data_models/role.md`, `../../02_architecture/data_models/permission.md`, `../../02_architecture/data_models/credit_account.md`

**Acceptance Criteria**:

- [ ] JWT validation for WebSocket connections
- [ ] User permission checking per request
- [ ] Credit validation before LLM calls
- [ ] Service access control by role
- [ ] Usage logging per user

**Pre-request Checks**:

```typescript
async function handleMCPRequest(ws: WebSocket, request: MCPRequest) {
  const user = ws.user; // From JWT validation

  // 1. Check user has permission to use service
  if (!(await hasPermission(user, 'services', 'use'))) {
    return sendError(ws, 'FORBIDDEN', 'No permission to use AI services');
  }

  // 2. Check sufficient credits
  const estimatedCredits = estimateCredits(request);
  const balance = await getCreditBalance(user.id);

  if (balance < estimatedCredits) {
    return sendError(ws, 'INSUFFICIENT_CREDITS', 'Not enough credits');
  }

  // 3. Check rate limits
  if (await isRateLimited(user.id)) {
    return sendError(ws, 'RATE_LIMIT_EXCEEDED', 'Too many requests');
  }

  // 4. Process request
  await processLLMRequest(ws, request);

  // 5. Log usage
  await logUsage(user.id, request, response);
}