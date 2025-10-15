import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import creditRoutes from './routes/credit.routes';
import paymentRoutes from './routes/payment.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
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

// Routes
app.use('/api', creditRoutes);
app.use('/api/payments', paymentRoutes);

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
