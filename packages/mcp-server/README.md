# MCP Server

## Overview

The MCP (Model Context Protocol) Server provides real-time WebSocket communication for Smart AI Hub with comprehensive authentication, credit management, and usage logging. It serves as the gateway for AI model requests from clients.

## Features

- **WebSocket Server** with real-time bidirectional communication
- **JWT Authentication** for secure connection establishment
- **Credit Management** with pre-request validation and post-request deduction
- **Usage Logging** for analytics and billing
- **Connection Lifecycle Management** with heartbeat/ping-pong mechanism
- **Rate Limiting** and request validation
- **Structured Logging** with Winston
- **Health Checks** and monitoring endpoints

## Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Client App    │ ◄──────────────► │   MCP Server    │
└─────────────────┘                 └─────────────────┘
                                            │
                                            ▼
┌─────────────────┐    HTTP API      ┌─────────────────┐
│  Auth Service   │ ◄──────────────► │  Credit Service │
└─────────────────┘                 └─────────────────┘
```

## Setup Instructions

### Prerequisites

- Node.js 20+
- TypeScript 5+
- Redis server
- PostgreSQL database
- npm or yarn

### Installation

1. Navigate to the service directory:

   ```bash
   cd packages/mcp-server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy and configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   - Set `JWT_SECRET` to a secure value
   - Configure `REDIS_URL` and `DATABASE_URL`
   - Add AI provider API keys (`OPENAI_API_KEY`, `CLAUDE_API_KEY`)
   - Set service URLs for auth and credit services

### Development

1. Run in development mode (with hot-reload):

   ```bash
   npm run dev
   ```

   The server will start on port 3003 (or configured PORT).

2. Build for production:

   ```bash
   npm run build
   ```

3. Start production build:

   ```bash
   npm start
   ```

### Testing

1. Run tests:

   ```bash
   npm test
   ```

2. Run tests in watch mode:

   ```bash
   npm run test:watch
   ```

3. Generate coverage report:

   ```bash
   npm run test:coverage
   ```

### Docker

1. Build the image:

   ```bash
   docker build -t mcp-server .
   ```

2. Run the container:

   ```bash
   docker run -p 3003:3003 -e NODE_ENV=production mcp-server
   ```

## API Documentation

### HTTP Endpoints

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-03T16:00:00.000Z",
  "version": "1.0.0",
  "connections": {
    "totalConnections": 5,
    "totalUsers": 3,
    "totalPendingRequests": 2,
    "connectionsByRole": {
      "user": 3,
      "admin": 2
    }
  }
}
```

#### GET /stats
Connection statistics for monitoring.

**Response:**
```json
{
  "totalConnections": 5,
  "totalUsers": 3,
  "totalPendingRequests": 2,
  "connectionsByRole": {
    "user": 3,
    "admin": 2
  },
  "timestamp": "2025-10-03T16:00:00.000Z"
}
```

### WebSocket Protocol

#### Connection Authentication

WebSocket connections must include a JWT token for authentication. The token can be provided in three ways:

1. **Query Parameter**: `ws://localhost:3003?token=YOUR_JWT_TOKEN`
2. **Authorization Header**: `Authorization: Bearer YOUR_JWT_TOKEN`
3. **WebSocket Protocol**: `Sec-WebSocket-Protocol: Bearer YOUR_JWT_TOKEN`

#### Message Format

**Client → Server Request:**
```json
{
  "id": "req-123",
  "type": "completion",
  "provider": "openai",
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "stream": false,
  "maxTokens": 1000,
  "temperature": 0.7
}
```

**Server → Client Response:**
```json
{
  "id": "req-123",
  "type": "done",
  "data": "Hello! I'm doing well, thank you for asking.",
  "usage": {
    "promptTokens": 10,
    "completionTokens": 15,
    "totalTokens": 25
  },
  "timestamp": "2025-10-03T16:00:00.000Z"
}
```

**Error Response:**
```json
{
  "id": "req-123",
  "type": "error",
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Insufficient credits for this request"
  },
  "timestamp": "2025-10-03T16:00:00.000Z"
}
```

#### Request Types

- `completion`: Text completion requests
- `chat`: Chat conversation requests

#### Supported Providers

- `openai`: OpenAI GPT models
- `claude`: Anthropic Claude models
- `auto`: Automatic provider selection based on availability

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3003 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT signing secret | Required |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 |
| `DATABASE_URL` | PostgreSQL URL | Required |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `CLAUDE_API_KEY` | Claude API key | Optional |
| `CREDIT_SERVICE_URL` | Credit service URL | http://localhost:3002 |
| `AUTH_SERVICE_URL` | Auth service URL | http://localhost:3001 |

### Model Pricing

Configure model pricing in credits per 1K tokens:

```typescript
MODEL_PRICING: {
  'gpt-3.5-turbo': 0.002,
  'gpt-4': 0.03,
  'gpt-4-turbo': 0.01,
  'claude-3-haiku': 0.00025,
  'claude-3-sonnet': 0.003,
  'claude-3-opus': 0.015,
}
```

## Project Structure

```
src/
├── config/          # Configuration management
├── middleware/      # WebSocket middleware
├── services/        # Business logic services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── tests/          # Test files
└── index.ts        # Main server entry point
```

## Dependencies

### Core Dependencies
- `ws`: WebSocket library
- `express`: HTTP server framework
- `jsonwebtoken`: JWT token handling
- `uuid`: Unique ID generation
- `winston`: Structured logging
- `axios`: HTTP client for service communication

### Development Dependencies
- `typescript`: TypeScript compiler
- `ts-node-dev`: Development server with hot reload
- `jest`: Testing framework
- `@types/*`: TypeScript type definitions

## Monitoring and Logging

### Structured Logging

The server uses Winston for structured logging with the following levels:
- `error`: Error conditions
- `warn`: Warning conditions
- `info`: Informational messages
- `debug`: Debug information

### Connection Monitoring

- Active connection tracking
- Heartbeat/ping-pong mechanism
- Connection lifecycle events
- Performance metrics

### Usage Analytics

- Request logging
- Token usage tracking
- Credit consumption
- Error rate monitoring

## Security Considerations

1. **JWT Authentication**: All connections require valid JWT tokens
2. **Token Validation**: Tokens are verified against auth service
3. **Credit Validation**: Requests are checked for sufficient credits
4. **Rate Limiting**: Configurable rate limits per user
5. **Input Validation**: All requests are validated before processing

## Troubleshooting

### Common Issues

1. **Connection Authentication Failed**
   - Check JWT token validity
   - Verify JWT_SECRET configuration
   - Ensure token is not expired

2. **Credit Check Failed**
   - Verify user has sufficient credits
   - Check credit service connectivity
   - Review credit pricing configuration

3. **WebSocket Connection Issues**
   - Check firewall settings
   - Verify port availability
   - Review WebSocket client implementation

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

### Health Checks

Monitor server health:
```bash
curl http://localhost:3003/health
```

## Integration with Smart AI Hub

The MCP Server integrates with:
- **Auth Service**: For JWT validation and user authentication
- **Credit Service**: For credit balance checking and deduction
- **Shared Package**: For common utilities and type definitions

## Future Enhancements

- OpenAI and Claude API integration
- Streaming response support
- Advanced rate limiting
- Connection pooling
- Load balancing
- Metrics dashboard
- Alerting system

For more details, see the main project README.
