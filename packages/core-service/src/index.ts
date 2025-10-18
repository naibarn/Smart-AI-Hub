import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { initializeMetrics, apiSecurityHeaders } from '@smart-ai-hub/shared';
import creditRoutes from './routes/credit.routes';
import creditReservationRoutes from './routes/credit-reservation.routes';
import pointRoutes from './routes/point.routes';
import paymentRoutes from './routes/payment.routes';
import analyticsRoutes from './routes/analytics.routes';
import monitoringRoutes from './routes/monitoring.routes';
import transferRoutes from './routes/transfer.routes';
import referralRoutes from './routes/referral.routes';
import blockRoutes from './routes/block.routes';
import hierarchyRoutes from './routes/hierarchy.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { requestIdMiddleware } from './middlewares/requestId';
import { rateLimiter } from './middlewares/rateLimiter';
import { connectRedis, disconnectRedis } from './config/redis';

const prisma = new PrismaClient();
const app: Application = express();
const PORT = process.env.PORT || 3002;

// Initialize monitoring
const metrics = initializeMetrics({
  serviceName: 'core-service',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  port: typeof PORT === 'string' ? parseInt(PORT, 10) : PORT,
  defaultLabels: {
    service: 'core-service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
});

// Security middleware (API-specific - no CSP needed)
app.use(apiSecurityHeaders);

// CORS middleware
app.use(cors());

// Basic metrics middleware
app.use((req: Request, res: Response, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path || 'unknown';

    // Record basic metrics
    metrics.incrementHttpRequests(req.method, route, res.statusCode);
    metrics.recordHttpRequestDuration(req.method, route, res.statusCode, duration);
  });

  next();
});

// Raw body parser for Stripe webhooks (must be before express.json)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments/stripe-webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Request ID middleware (must be before auth)
app.use(requestIdMiddleware);

// Rate limiting middleware
app.use(rateLimiter);

// Routes - Versioned (v1)
app.use('/api/v1', creditRoutes);
app.use('/api/v1/credits', creditReservationRoutes);
app.use('/api/v1', pointRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/transfer', transferRoutes);
app.use('/api/v1/referral', referralRoutes);
app.use('/api/v1/block', blockRoutes);
app.use('/api/v1/hierarchy', hierarchyRoutes);

// Legacy routes for backward compatibility with deprecation headers
app.use(
  '/api',
  (req, res, next) => {
    // Set deprecation headers
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
    res.setHeader('Link', '</api/v1' + req.url + '>; rel="successor-version"');

    // Forward to versioned routes
    req.url = '/api/v1' + req.url;
    next();
  },
  creditRoutes
);

// Legacy point routes for backward compatibility
app.use(
  '/api',
  (req, res, next) => {
    // Set deprecation headers
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
    res.setHeader('Link', '</api/v1' + req.url + '>; rel="successor-version"');

    // Forward to versioned routes
    req.url = '/api/v1' + req.url;
    next();
  },
  pointRoutes
);

// Legacy analytics routes for backward compatibility
app.use(
  '/api/analytics',
  (req, res, next) => {
    // Set deprecation headers
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
    res.setHeader('Link', '</api/v1/analytics' + req.url + '>; rel="successor-version"');

    // Forward to versioned routes
    req.url = '/api/v1/analytics' + req.url;
    next();
  },
  analyticsRoutes
);

// Error handling middleware (must be last)
app.use(errorHandler);

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metricsText = await metrics.getMetricsAsText();
    res.set('Content-Type', 'text/plain');
    res.send(metricsText);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).send('Error generating metrics');
  }
});

// Enhanced health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      service: 'core-service',
    };

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.database = 'connected';

    res.json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Basic users route
app.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/users', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.create({
      data: { email },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.listen(PORT, async () => {
  await prisma.$connect();
  // Initialize Redis connection
  await connectRedis();
  // console.log(`Core Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  // console.log('Shutting down gracefully...');
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  // console.log('Shutting down gracefully...');
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
