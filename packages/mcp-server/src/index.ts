/**
 * MCP Server Main Implementation
 * WebSocket server with JWT authentication, authorization, credit checking, and usage logging
 */

import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { config, validateConfig } from './config/config';
import { logger } from './utils/logger';
import { authenticateWebSocket } from './utils/jwt.util';
import {
  createConnectionMetadata,
  authorizeWebSocket,
  checkRateLimit,
  canAccessModel,
  getMaxTokens,
  ConnectionMetadata
} from './middlewares/auth.middleware';
import { connectionService } from './services/connection.service';
import { creditService } from './services/credit.service';
import { loggingService } from './services/logging.service';
import webhookService from './services/webhook.service';
import { MCPRequest, MCPResponse, LLMRequest } from './types/mcp.types';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { ProviderManager } from './services/provider.manager';

// Validate configuration on startup
validateConfig();

// Initialize Providers
const openAIProvider = new OpenAIProvider(config.openaiApiKey);
const claudeProvider = new ClaudeProvider(config.anthropicApiKey);

// Initialize Provider Manager
const providerManager = new ProviderManager([
  { name: 'openai', instance: openAIProvider },
  { name: 'claude', instance: claudeProvider },
]);

const app: Application = express();
const PORT = config.PORT;
const server = createServer(app);

// Middleware for HTTP
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
  const stats = connectionService.getStats();
  const response = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    connections: stats,
    providers: providerManager.getStatus(),
  };
  
  // Generate request ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set request ID header
  res.setHeader('X-Request-ID', requestId);
  
  res.json({
    data: response,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: requestId
    }
  });
});

// Stats endpoint for monitoring
app.get('/api/v1/stats', (req: Request, res: Response) => {
  const stats = connectionService.getStats();
  const response = {
    ...stats,
    timestamp: new Date().toISOString(),
  };
  
  // Generate request ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set request ID header
  res.setHeader('X-Request-ID', requestId);
  
  res.json({
    data: response,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: requestId
    }
  });
});

// Legacy routes for backward compatibility with deprecation headers
app.get('/health', (req: Request, res: Response) => {
  // Set deprecation headers
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
  res.setHeader('Link', '</api/v1/health>; rel="successor-version"');
  
  // Forward to versioned endpoint
  res.redirect(302, '/api/v1/health');
});

app.get('/stats', (req: Request, res: Response) => {
  // Set deprecation headers
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
  res.setHeader('Link', '</api/v1/stats>; rel="successor-version"');
  
  // Forward to versioned endpoint
  res.redirect(302, '/api/v1/stats');
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
      // jti is extracted but not used in this context
      // (info.req as any).jti = auth.jti;

      callback(true);
    } catch (error) {
      logger.error('WebSocket authentication error', {
        error: error instanceof Error ? error.message : String(error),
      });
      callback(false, 500, 'Internal server error');
    }
  },
});

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket, req: any) => {
  const user = (req as any).user;
  // jti is available but not used in this context
  // const jti = (req as any).jti;

  // Create connection metadata with authorization info
  const metadata = createConnectionMetadata(user);

  // Create connection and track it
  const connection = connectionService.createConnection(ws, user);
  
  // Store metadata with connection for authorization checks
  connectionService.setConnectionMetadata(connection.id, metadata);

  logger.info('WebSocket connection established', {
    connectionId: connection.id,
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: metadata.permissions,
    allowedModels: metadata.allowedModels,
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

      // Get connection metadata for authorization
      const connectionMetadata = connectionService.getAuthorizationMetadata(connection.id);
      
      if (!connectionMetadata) {
        sendError(ws, 'UNAUTHORIZED', 'Connection metadata not found');
        return;
      }
      
      // Validate basic request structure
      const validation = creditService.validateRequest(request);
      if (!validation.valid) {
        sendError(ws, 'INVALID_REQUEST', validation.error || 'Invalid request');
        return;
      }
      
      // Authorization check - validate user can access this model and features
      const maxTokens = getMaxTokens(user.role);
      const requestedTokens = request.maxTokens || maxTokens;
      
      const authResult = authorizeWebSocket(
        ws,
        connectionMetadata,
        request.model,
        requestedTokens,
        'chat' // Default feature for now
      );
      
      if (!authResult.authorized) {
        sendError(ws, 'UNAUTHORIZED', authResult.reason || 'Unauthorized');
        return;
      }
      
      // Rate limiting check
      const currentUsage = connectionService.getUsageStats(connection.id);
      const rateLimitResult = checkRateLimit(connectionMetadata, currentUsage);
      
      if (!rateLimitResult.allowed) {
        sendError(ws, 'RATE_LIMITED', rateLimitResult.reason || 'Rate limit exceeded');
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

function isAsyncIterable<T>(obj: any): obj is AsyncIterable<T> {
  return obj != null && typeof obj[Symbol.asyncIterator] === 'function';
}

async function handleMessage(connection: any, request: MCPRequest): Promise<void> {
  const startTime = Date.now();
  const { id: requestId } = request;
  const { userId } = connection.metadata;

  try {
    // Trigger service.started webhook
    webhookService.triggerServiceStarted(
      userId,
      requestId,
      request.model,
      request.maxTokens || 1000
    ).catch(error => {
      logger.error('Failed to trigger service.started webhook:', error);
    });

    const hasCredits = await creditService.checkSufficientCredits(userId, request);
    if (!hasCredits) {
      // Trigger service.failed webhook for insufficient credits
      webhookService.triggerServiceFailed(
        userId,
        requestId,
        request.model,
        'INSUFFICIENT_CREDITS',
        'Insufficient credits for this request.',
        Date.now() - startTime
      ).catch(error => {
        logger.error('Failed to trigger service.failed webhook:', error);
      });

      return sendError(
        connection.ws,
        'INSUFFICIENT_CREDITS',
        'Insufficient credits for this request.',
        requestId
      );
    }

    const llmRequest: LLMRequest = { ...request };
    const llmResponse = await providerManager.handleRequest(llmRequest);

    if (isAsyncIterable(llmResponse)) {
      let fullContent = '';
      // fullContent is accumulated but not used in this implementation
      let finalResponse: MCPResponse | null = null;

      for await (const chunk of llmResponse) {
        fullContent += chunk.content;
        const response: MCPResponse = {
          id: requestId,
          type: 'chunk',
          data: chunk.content,
          timestamp: new Date().toISOString(),
        };
        connectionService.sendMessage(connection.id, response);
        if (chunk.finishReason) {
          finalResponse = {
            id: requestId,
            type: 'done',
            usage: chunk.usage,
            timestamp: new Date().toISOString(),
          };
        }
      }

      if (finalResponse) {
        connectionService.sendMessage(connection.id, finalResponse);
        const duration = Date.now() - startTime;
        if (finalResponse.usage) {
          await creditService.deductCredits(
            userId,
            requestId,
            finalResponse.usage.totalTokens,
            request.model
          );
          const creditsUsed = creditService.calculateCredits(
            request.model,
            finalResponse.usage.totalTokens
          );
          
          // Update usage statistics for rate limiting
          connectionService.updateUsageStats(connection.id, finalResponse.usage.totalTokens);
          
          const usageLog = loggingService.createUsageLog(
            userId,
            requestId,
            request,
            finalResponse,
            duration,
            creditsUsed
          );
          await loggingService.logUsage(usageLog);

          // Trigger service.completed webhook
          webhookService.triggerServiceCompleted(
            userId,
            requestId,
            request.model,
            finalResponse.usage.totalTokens,
            creditsUsed,
            duration,
            finalResponse
          ).catch(error => {
            logger.error('Failed to trigger service.completed webhook:', error);
          });
        }
      }
    } else {
      const duration = Date.now() - startTime;

      if (llmResponse.usage) {
        await creditService.deductCredits(
          userId,
          requestId,
          llmResponse.usage.totalTokens,
          llmResponse.model
        );
        const creditsUsed = creditService.calculateCredits(
          llmResponse.model,
          llmResponse.usage.totalTokens
        );
        
        // Update usage statistics for rate limiting
        connectionService.updateUsageStats(connection.id, llmResponse.usage.totalTokens);
        
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

        // Trigger service.completed webhook
        webhookService.triggerServiceCompleted(
          userId,
          requestId,
          llmResponse.model,
          llmResponse.usage.totalTokens,
          creditsUsed,
          duration,
          response
        ).catch(error => {
          logger.error('Failed to trigger service.completed webhook:', error);
        });
      }
    }
  } catch (error: any) {
    logger.error('Error handling message:', { error: error.message, requestId });
    
    // Trigger service.failed webhook for execution errors
    webhookService.triggerServiceFailed(
      userId,
      requestId,
      request.model || 'unknown',
      'EXECUTION_ERROR',
      error.message || 'Failed to execute request.',
      Date.now() - startTime
    ).catch(error => {
      logger.error('Failed to trigger service.failed webhook:', error);
    });

    sendError(
      connection.ws,
      'EXECUTION_ERROR',
      error.message || 'Failed to execute request.',
      requestId
    );
  } finally {
    connectionService.removePendingRequest(connection.id, requestId);
  }
}

/**
 * Send error message to client
 */
function sendError(ws: WebSocket, code: string, message: string, requestId?: string): void {
  const id = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const errorResponse: MCPResponse = {
    id: id,
    type: 'error',
    error: {
      code,
      message,
      request_id: id
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
