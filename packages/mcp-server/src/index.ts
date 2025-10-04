/**
 * MCP Server Main Implementation
 * WebSocket server with JWT authentication, credit checking, and usage logging
 */

import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { config, validateConfig } from './config/config';
import { logger } from './utils/logger';
import { authenticateWebSocket } from './utils/jwt.util';
import { connectionService } from './services/connection.service';
import { creditService } from './services/credit.service';
import { loggingService } from './services/logging.service';
import { MCPRequest, MCPResponse, MCPProvider, LLMRequest } from './types/mcp.types';
import { OpenAIProvider } from './providers/openai.provider';
import { LLMProvider } from './providers/base.provider';

// Validate configuration on startup
validateConfig();

// Initialize Providers
const openAIProvider = new OpenAIProvider(config.openaiApiKey);

const providers: { [key in MCPProvider]?: LLMProvider } = {
  openai: openAIProvider,
};

const app: Application = express();
const PORT = config.PORT;
const server = createServer(app);

// Middleware for HTTP
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const stats = connectionService.getStats();
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    connections: stats,
  });
});

// Stats endpoint for monitoring
app.get('/stats', (req: Request, res: Response) => {
  const stats = connectionService.getStats();
  res.json({
    ...stats,
    timestamp: new Date().toISOString(),
  });
});

// WebSocket setup with authentication
const wss = new WebSocketServer({
  server,
  verifyClient: async (info: any, callback: any) => {
    try {
      // Authenticate WebSocket connection
      const auth = await authenticateWebSocket(info.req);
      
      if (!auth) {
        callback(false, 401, 'Unauthorized');
        return;
      }
      
      // Attach user info to request for later use
      (info.req as any).user = auth.user;
      (info.req as any).jti = auth.jti;
      
      callback(true);
    } catch (error) {
      logger.error('WebSocket authentication error', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      callback(false, 500, 'Internal server error');
    }
  },
});

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket, req: any) => {
  const user = (req as any).user;
  const jti = (req as any).jti;
  
  // Create connection and track it
  const connection = connectionService.createConnection(ws, user);
  
  logger.info('WebSocket connection established', {
    connectionId: connection.id,
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Handle incoming messages
  ws.on('message', async (data: Buffer) => {
    try {
      const messageStr = data.toString();
      let request: MCPRequest;
      
      // Parse request
      try {
        request = JSON.parse(messageStr);
      } catch (parseError) {
        sendError(ws, 'INVALID_JSON', 'Invalid JSON format');
        return;
      }
      
      // Validate request
      const validation = creditService.validateRequest(request);
      if (!validation.valid) {
        sendError(ws, 'INVALID_REQUEST', validation.error || 'Invalid request');
        return;
      }
      
      // Update connection activity
      connectionService.updateActivity(connection.id);
      
      // Add to pending requests
      connectionService.addPendingRequest(connection.id, request.id, request);
      
      // Process request
      await handleMessage(connection, request);
      
    } catch (error) {
      logger.error('Error processing WebSocket message', {
        connectionId: connection.id,
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      
      sendError(ws, 'INTERNAL_ERROR', 'Internal server error');
    }
  });

  // Handle connection close
  ws.on('close', () => {
    connectionService.removeConnection(connection.id);
  });

  // Handle connection errors
  ws.on('error', (error: any) => {
    logger.error('WebSocket connection error', {
      connectionId: connection.id,
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    connectionService.removeConnection(connection.id);
  });

  // Send welcome message
  const welcomeMessage: MCPResponse = {
    id: 'welcome',
    type: 'done',
    data: `Welcome to MCP Server! Connected as ${user.email}`,
    timestamp: new Date().toISOString(),
  };
  
  connectionService.sendMessage(connection.id, welcomeMessage);
});

async function handleMessage(connection: any, request: MCPRequest): Promise<void> {
  const startTime = Date.now();
  const { id: requestId, model, provider: providerName = 'openai' } = request;
  const { userId } = connection.metadata;

  try {
    const provider = providers[providerName];
    if (!provider) {
      return sendError(connection.ws, 'INVALID_PROVIDER', `Provider '${providerName}' is not supported.`, requestId);
    }

    if (!provider.getSupportedModels().includes(model)) {
      return sendError(connection.ws, 'UNSUPPORTED_MODEL', `Model '${model}' is not supported by ${providerName}.`, requestId);
    }

    const hasCredits = await creditService.checkSufficientCredits(userId, request);

    if (!hasCredits) {
      return sendError(connection.ws, 'INSUFFICIENT_CREDITS', 'Insufficient credits for this request.', requestId);
    }

    if (request.stream) {
      // Streaming logic to be implemented
      return sendError(connection.ws, 'NOT_IMPLEMENTED', 'Streaming is not yet implemented.', requestId);
    }

    const llmRequest: LLMRequest = {
      type: request.type,
      model: request.model,
      messages: request.messages,
      maxTokens: request.maxTokens,
      temperature: request.temperature,
      topP: request.topP,
      frequencyPenalty: request.frequencyPenalty,
      presencePenalty: request.presencePenalty,
      stop: request.stop,
    };

    const llmResponse = await provider.execute(llmRequest);
    const duration = Date.now() - startTime;

    const creditsUsed = (provider as OpenAIProvider).calculateCredits(llmResponse.model, llmResponse.usage.totalTokens);
    await creditService.deductCredits(userId, requestId, llmResponse.usage.totalTokens, llmResponse.model);

    const response: MCPResponse = {
      id: requestId,
      type: 'done',
      data: llmResponse.content,
      usage: llmResponse.usage,
      timestamp: new Date().toISOString(),
    };

    connectionService.sendMessage(connection.id, response);

    const usageLog = loggingService.createUsageLog(
      userId,
      requestId,
      request,
      response,
      duration,
      creditsUsed
    );
    await loggingService.logUsage(usageLog);

  } catch (error: any) {
    logger.error('Error handling message:', { error: error.message, requestId });
    sendError(connection.ws, 'EXECUTION_ERROR', error.message || 'Failed to execute request.', requestId);
  } finally {
    connectionService.removePendingRequest(connection.id, requestId);
  }
}

/**
 * Send error message to client
 */
function sendError(ws: WebSocket, code: string, message: string, requestId?: string): void {
  const errorResponse: MCPResponse = {
    id: requestId || 'error',
    type: 'error',
    error: {
      code,
      message,
    },
    timestamp: new Date().toISOString(),
  };
  
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(errorResponse));
  }
}

/**
 * Heartbeat mechanism - ping all connections periodically
 */
setInterval(() => {
  const connections = connectionService.getAllConnections();
  
  for (const connection of connections) {
    // Mark as not alive (will be marked alive on pong)
    connectionService.markNotAlive(connection.id);
    
    // Send ping
    if (connection.ws.readyState === connection.ws.OPEN) {
      connection.ws.ping();
    }
  }
  
  // Clean up dead connections after ping timeout
  setTimeout(() => {
    connectionService.cleanupDeadConnections();
  }, config.WS_CONNECTION_TIMEOUT);
}, config.WS_HEARTBEAT_INTERVAL);

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  
  // Close all WebSocket connections
  const connections = connectionService.getAllConnections();
  for (const connection of connections) {
    connection.ws.close(1001, 'Server shutting down');
  }
  
  // Close HTTP server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Start server
server.listen(PORT, () => {
  logger.info(`MCP Server started on port ${PORT}`, {
    port: PORT,
    nodeEnv: config.NODE_ENV,
    heartbeatInterval: config.WS_HEARTBEAT_INTERVAL,
    connectionTimeout: config.WS_CONNECTION_TIMEOUT,
  });
});

export default app;
