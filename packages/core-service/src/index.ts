import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import creditRoutes from './routes/credit.routes';
import paymentRoutes from './routes/payment.routes';
import analyticsRoutes from './routes/analytics.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { requestIdMiddleware } from './middlewares/requestId';
import { rateLimiter } from './middlewares/rateLimiter';
import { connectRedis, disconnectRedis } from './config/redis';

const prisma = new PrismaClient();
const app: Application = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());

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
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Legacy routes for backward compatibility with deprecation headers
app.use('/api', (req, res, next) => {
  // Set deprecation headers
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
  res.setHeader('Link', '</api/v1' + req.url + '>; rel="successor-version"');
  
  // Forward to versioned routes
  req.url = '/api/v1' + req.url;
  next();
}, creditRoutes);

// Legacy analytics routes for backward compatibility
app.use('/api/analytics', (req, res, next) => {
  // Set deprecation headers
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
  res.setHeader('Link', '</api/v1/analytics' + req.url + '>; rel="successor-version"');
  
  // Forward to versioned routes
  req.url = '/api/v1/analytics' + req.url;
  next();
}, analyticsRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Health check with DB connection
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK' });
  } catch (error) {
    res.status(500).json({ error: 'DB connection failed' });
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
  console.log(`Core Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
