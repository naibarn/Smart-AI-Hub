import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { redisSubscriber, connectRedisClients } from '@shared/redis-client';
import {
  initializeMetrics,
  createMetricsMiddleware,
  createMetricsEndpoint,
  createHealthCheckEndpoint,
  apiSecurityHeaders,
} from '@smart-ai-hub/shared';

const app: Application = express();
const PORT = process.env.PORT || 3006;

// Initialize monitoring
const metrics = initializeMetrics({
  serviceName: 'notification-service',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  port: typeof PORT === 'string' ? parseInt(PORT, 10) : PORT,
  defaultLabels: {
    service: 'notification-service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
});

// Security middleware (API-specific - no CSP needed)
app.use(apiSecurityHeaders);

// CORS middleware
app.use(cors());
app.use(express.json());

// Add monitoring middleware
app.use(createMetricsMiddleware(metrics));

// Health check endpoint
app.get('/health', createHealthCheckEndpoint(metrics));

// Metrics endpoint
app.get('/metrics', createMetricsEndpoint(metrics));

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Notification Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

async function startSubscriber() {
  try {
    await connectRedisClients();

    redisSubscriber.subscribe('user-events', (message: string) => {
      try {
        const event = JSON.parse(message);
        if (event.type === 'USER_REGISTERED') {
          console.log(`Received USER_REGISTERED event for email: ${event.email}`);
          // Record metrics for processed events
          metrics.incrementHttpRequests('PROCESS', 'user-events', 200);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        // Record metrics for processing errors
        metrics.incrementHttpRequests('PROCESS', 'user-events', 500);
        metrics.setErrorRate('processing_error', 1);
      }
    });
  } catch (error) {
    console.error('Error starting subscriber:', error);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
  startSubscriber();
});

export default app;
