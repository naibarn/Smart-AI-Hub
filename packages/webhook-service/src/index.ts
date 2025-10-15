import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { webhookQueue } from './config/queue';
import logger from './config/logger';
import webhookRoutes from './routes/webhook.routes';
import internalRoutes from './routes/internal.routes';
import { webhookDeliveryService } from './services/webhook-delivery.service';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3005;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3004'],
  credentials: true,
}));

// Body parser middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { prisma } = require('./config/database');
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    const { testRedisConnection } = require('./config/redis');
    const redisStatus = await testRedisConnection();

    res.json({
      success: true,
      message: 'Webhook Service is running',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisStatus ? 'connected' : 'disconnected',
        queue: 'active',
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/internal', internalRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Webhook Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Initialize webhook queue processor
webhookQueue.process('deliver-webhook', async (job) => {
  const { webhookDeliveryService } = require('./services/webhook-delivery.service');
  return await webhookDeliveryService.processWebhookDelivery(job.data);
});

// Start periodic tasks
const startPeriodicTasks = () => {
  // Retry failed webhooks every minute
  setInterval(async () => {
    try {
      await webhookDeliveryService.retryFailedWebhooks();
    } catch (error) {
      logger.error('Failed to retry failed webhooks:', error);
    }
  }, 60000); // 1 minute

  // Clean up old logs every hour
  setInterval(async () => {
    try {
      await webhookDeliveryService.cleanupOldLogs(30); // Keep logs for 30 days
    } catch (error) {
      logger.error('Failed to cleanup old logs:', error);
    }
  }, 3600000); // 1 hour
};

// Initialize application
const initializeApp = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Connect to Redis
    await connectRedis();
    
    // Start periodic tasks
    startPeriodicTasks();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Webhook Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  logger.info('Shutting down gracefully...');
  
  try {
    // Close queue
    await webhookQueue.close();
    
    // Disconnect from Redis
    await disconnectRedis();
    
    // Disconnect from database
    await disconnectDatabase();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start the application
if (require.main === module) {
  initializeApp();
}

export default app;