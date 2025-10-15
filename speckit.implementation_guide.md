# Smart AI Hub - Implementation Guide

**Document Version**: 1.0  
**Date**: October 14, 2025  
**Purpose**: Step-by-step implementation guide for priority tasks  

---

## 1. Claude Integration Implementation

### Step 1: Complete Claude Provider

Create/Update `packages/mcp-server/src/providers/claude.provider.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMRequest, LLMResponse } from '../types/mcp.types';

export class ClaudeProvider implements LLMProvider {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({
      apiKey,
    });
  }

  async execute(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await this.anthropic.messages.create({
        model: request.model,
        max_tokens: request.maxTokens || 1000,
        messages: this.convertMessages(request.messages),
        stream: false, // We'll implement streaming separately
        temperature: request.temperature,
      });

      return {
        content: response.content[0]?.type === 'text' ? response.content[0].text : '',
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: request.model,
        finishReason: response.stop_reason || 'stop',
      };
    } catch (error) {
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *executeStream(request: LLMRequest): AsyncGenerator<{ content: string; finishReason?: string }> {
    try {
      const stream = await this.anthropic.messages.create({
        model: request.model,
        max_tokens: request.maxTokens || 1000,
        messages: this.convertMessages(request.messages),
        stream: true,
        temperature: request.temperature,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullContent += chunk.delta.text;
          yield { content: chunk.delta.text };
        }
        if (chunk.type === 'message_stop') {
          yield { content: '', finishReason: chunk.stop_reason || 'stop' };
          break;
        }
      }
    } catch (error) {
      throw new Error(`Claude streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  estimateCredits(request: LLMRequest): number {
    // Claude pricing: approximately $0.015 per 1K input tokens, $0.075 per 1K output tokens
    const inputTokens = this.estimateTokens(request.messages.join(' '));
    const estimatedOutputTokens = Math.max(100, inputTokens * 0.7);
    
    const inputCost = (inputTokens / 1000) * 0.015;
    const outputCost = (estimatedOutputTokens / 1000) * 0.075;
    
    return Math.ceil((inputCost + outputCost) * 10); // Convert to credits (1 credit = $0.10)
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  private convertMessages(messages: any[]): Anthropic.MessageParam[] {
    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
```

### Step 2: Update Provider Manager

Update `packages/mcp-server/src/services/provider.manager.ts`:

```typescript
import { LLMProvider, LLMRequest, MCPProvider } from '../types/mcp.types';

export class ProviderManager {
  private providers: Map<string, LLMProvider> = new Map();
  private lastHealthCheck: Map<string, Date> = new Map();
  private healthStatus: Map<string, boolean> = new Map();

  constructor(providers: { name: string; instance: LLMProvider }[]) {
    providers.forEach(({ name, instance }) => {
      this.providers.set(name, instance);
      this.healthStatus.set(name, true);
    });
    
    // Start health checking
    this.startHealthCheck();
  }

  async handleRequest(request: LLMRequest): Promise<LLMResponse | AsyncIterable<any>> {
    const provider = this.selectProvider(request);
    
    if (!provider) {
      throw new Error('No available providers');
    }

    try {
      if (request.stream) {
        return provider.executeStream ? provider.executeStream(request) : provider.execute(request);
      } else {
        return provider.execute(request);
      }
    } catch (error) {
      // Mark provider as unhealthy
      const providerName = this.getProviderName(request.provider);
      if (providerName) {
        this.healthStatus.set(providerName, false);
      }
      
      // Try fallback provider
      const fallbackProvider = this.selectFallbackProvider(request);
      if (fallbackProvider) {
        return fallbackProvider.execute(request);
      }
      
      throw error;
    }
  }

  private selectProvider(request: LLMRequest): LLMProvider | null {
    // If specific provider requested and healthy
    if (request.provider && request.provider !== 'auto') {
      const provider = this.providers.get(request.provider);
      if (provider && this.healthStatus.get(request.provider)) {
        return provider;
      }
    }

    // Auto-select based on availability and load
    for (const [name, provider] of this.providers) {
      if (this.healthStatus.get(name)) {
        return provider;
      }
    }

    return null;
  }

  private selectFallbackProvider(request: LLMRequest): LLMProvider | null {
    // Try all providers except the one that failed
    for (const [name, provider] of this.providers) {
      if (name !== request.provider && this.healthStatus.get(name)) {
        return provider;
      }
    }
    return null;
  }

  private getProviderName(provider: MCPProvider | undefined): string | null {
    if (!provider || provider === 'auto') return null;
    return provider;
  }

  private async startHealthCheck(): Promise<void> {
    setInterval(async () => {
      for (const [name, provider] of this.providers) {
        try {
          const isHealthy = await provider.checkAvailability();
          this.healthStatus.set(name, isHealthy);
          this.lastHealthCheck.set(name, new Date());
        } catch {
          this.healthStatus.set(name, false);
        }
      }
    }, 60000); // Check every minute
  }

  getStatus(): Record<string, boolean> {
    return Object.fromEntries(this.healthStatus);
  }
}
```

### Step 3: Update MCP Server Configuration

Update `packages/mcp-server/src/config/config.ts`:

```typescript
export const config = {
  PORT: parseInt(process.env.PORT || '3003'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/smart_ai_hub',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // API Keys
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  
  // WebSocket
  WS_HEARTBEAT_INTERVAL: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000'),
  WS_CONNECTION_TIMEOUT: parseInt(process.env.WS_CONNECTION_TIMEOUT || '60000'),
  
  // Credits
  CREDIT_COST_PER_TOKEN: {
    'gpt-3.5-turbo': 0.001,
    'gpt-4': 0.01,
    'claude-3-haiku': 0.0015,
    'claude-3-sonnet': 0.015,
    'claude-3-opus': 0.075,
  },
};

export function validateConfig(): void {
  const required = ['DATABASE_URL', 'REDIS_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (!config.openaiApiKey && !config.anthropicApiKey) {
    throw new Error('At least one AI provider API key must be configured');
  }
}
```

---

## 2. Payment System Implementation

### Step 1: Create Payment Service

Create `packages/core-service/src/services/payment.service.ts`:

```typescript
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents
  stripePriceId: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    price: 1000, // $10.00
    stripePriceId: process.env.STRIPE_STARTNER_PRICE_ID || '',
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 1000,
    price: 8000, // $80.00
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
  },
  {
    id: 'business',
    name: 'Business Pack',
    credits: 10000,
    price: 60000, // $600.00
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || '',
  },
];

export class PaymentService {
  async createCheckoutSession(userId: string, packageId: string): Promise<{ sessionId: string; url: string }> {
    const packageInfo = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!packageInfo) {
      throw new Error('Invalid package selected');
    }

    try {
      const session = await stripe.checkout.sessions.create({
        customer_email: await this.getUserEmail(userId),
        billing_address_collection: 'auto',
        line_items: [
          {
            price: packageInfo.stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata: {
          userId,
          packageId,
          credits: packageInfo.credits.toString(),
        },
      });

      // Create pending payment record
      await prisma.payment.create({
        data: {
          userId,
          amount: packageInfo.price,
          credits: packageInfo.credits,
          status: 'pending',
          stripeSessionId: session.id,
          metadata: {
            packageId,
            packageName: packageInfo.name,
          },
        },
      });

      return {
        sessionId: session.id,
        url: session.url!,
      };
    } catch (error) {
      logger.error('Failed to create checkout session', { error, userId, packageId });
      throw new Error('Failed to create payment session');
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleSuccessfulPayment(event.data.object as Stripe.Checkout.Session);
        break;
      case 'checkout.session.expired':
        await this.handleExpiredPayment(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.payment_failed':
        await this.handleFailedPayment(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        logger.warn('Unhandled webhook event type', { type: event.type });
    }
  }

  private async handleSuccessfulPayment(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0');
    const packageId = session.metadata?.packageId;

    if (!userId || !credits || !packageId) {
      logger.error('Invalid payment metadata', { session });
      return;
    }

    try {
      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { stripeSessionId: session.id },
          data: {
            status: 'completed',
            stripePaymentIntentId: session.payment_intent as string,
          },
        });

        // Add credits to user account
        const creditAccount = await tx.creditAccount.upsert({
          where: { userId },
          update: {
            currentBalance: { increment: credits },
            totalPurchased: { increment: credits },
          },
          create: {
            userId,
            currentBalance: credits,
            totalPurchased: credits,
            totalUsed: 0,
          },
        });

        // Create transaction record
        await tx.creditTransaction.create({
          data: {
            userId,
            type: 'purchase',
            amount: credits,
            balanceAfter: creditAccount.currentBalance,
            description: `Purchased ${session.metadata?.packageName}`,
            metadata: {
              stripeSessionId: session.id,
              packageId,
            },
          },
        });
      });

      logger.info('Payment processed successfully', { userId, credits, sessionId: session.id });
    } catch (error) {
      logger.error('Failed to process payment', { error, session });
      throw error;
    }
  }

  private async handleExpiredPayment(session: Stripe.Checkout.Session): Promise<void> {
    await prisma.payment.update({
      where: { stripeSessionId: session.id },
      data: { status: 'expired' },
    });

    logger.info('Payment session expired', { sessionId: session.id });
  }

  private async handleFailedPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Find payment by payment intent ID
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
    }

    logger.info('Payment failed', { paymentIntentId: paymentIntent.id });
  }

  async getPaymentHistory(userId: string, page = 1, limit = 20): Promise<{
    payments: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async getUserEmail(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.email;
  }
}
```

### Step 2: Create Payment Routes

Create `packages/core-service/src/routes/payment.routes.ts`:

```typescript
import express from 'express';
import { PaymentService, CREDIT_PACKAGES } from '../services/payment.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = express.Router();
const paymentService = new PaymentService();

// Schema validation
const createCheckoutSchema = z.object({
  packageId: z.enum(['starter', 'pro', 'business']),
});

// Get available packages
router.get('/packages', (req, res) => {
  res.json({
    packages: CREDIT_PACKAGES.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price / 100, // Convert to dollars
    })),
  });
});

// Create checkout session
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { packageId } = createCheckoutSchema.parse(req.body);
    const userId = req.user.id;

    const session = await paymentService.createCheckoutSession(userId, packageId);
    
    res.json({
      sessionId: session.sessionId,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get payment history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const history = await paymentService.getPaymentHistory(userId, page, limit);
    
    res.json(history);
  } catch (error) {
    console.error('Failed to get payment history:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

// Webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await paymentService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
```

### Step 3: Update Core Service

Update `packages/core-service/src/index.ts` to include payment routes:

```typescript
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
```

---

## 3. Frontend Authentication UI Implementation

### Step 1: Create Authentication Store

Create `packages/frontend/src/store/authSlice.ts`:

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../services/auth.api';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  creditAccount?: {
    currentBalance: number;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await authApi.login(email, password);
    localStorage.setItem('token', response.data.token);
    return response.data;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password, firstName, lastName }: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await authApi.register(email, password, firstName, lastName);
    localStorage.setItem('token', response.data.token);
    return response.data;
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async () => {
    const response = await authApi.refreshToken();
    localStorage.setItem('token', response.data.token);
    return response.data;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await authApi.logout();
    localStorage.removeItem('token');
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Registration failed';
        state.isAuthenticated = false;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
```

### Step 2: Create Login Page

Create `packages/frontend/src/pages/LoginPage.tsx`:

```typescript
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { login, clearError } from '../store/authSlice';
import { RootState, AppDispatch } from '../store';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await dispatch(login(data)).unwrap();
      navigate('/dashboard');
    } catch (error) {
      // Error is handled in the slice
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.VITE_API_URL}/api/auth/google`;
  };

  return (
    <Container component="main" maxWidth="sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Card sx={{ width: '100%', maxWidth: 400, p: 2 }}>
            <CardContent>
              <Typography component="h1" variant="h4" align="center" gutterBottom>
                Smart AI Hub
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                Sign in to access AI services
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      required
                      fullWidth
                      label="Email Address"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      disabled={isLoading}
                    />
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      required
                      fullWidth
                      label="Password"
                      type="password"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      disabled={isLoading}
                    />
                  )}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : null}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>

                <Box sx={{ mb: 2 }}>
                  <Link href="/forgot-password" variant="body2">
                    Forgot password?
                  </Link>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }}>OR</Divider>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                sx={{ mb: 2 }}
                startIcon={
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
              >
                Continue with Google
              </Button>

              <Box textAlign="center" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <Link href="/register" variant="body2">
                    Sign up
                  </Link>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </motion.div>
    </Container>
  );
};

export default LoginPage;
```

### Step 3: Create Dashboard Layout

Create `packages/frontend/src/components/DashboardLayout.tsx`:

```typescript
import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  CreditCard,
  Settings,
  Logout,
  AccountCircle,
  Notifications,
  Psychology,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../store/authSlice';
import { RootState, AppDispatch } from '../store';

const drawerWidth = 240;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
    handleProfileMenuClose();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'AI Services', icon: <Psychology />, path: '/ai-services' },
    { text: 'Credits', icon: <CreditCard />, path: '/credits' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Smart AI Hub
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          
          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar
              src={user?.profile?.avatarUrl}
              alt={user?.email}
              sx={{ width: 32, height: 32 }}
            >
              {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
```

---

## 4. Production Deployment Setup

### Step 1: Create Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - smart-ai-hub
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - smart-ai-hub
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    networks:
      - smart-ai-hub
    depends_on:
      - api-gateway
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  api-gateway:
    build: 
      context: ./packages/api-gateway
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - AUTH_SERVICE_URL=http://auth-service:3001
      - CORE_SERVICE_URL=http://core-service:3002
      - MCP_SERVER_URL=http://mcp-server:3003
    networks:
      - smart-ai-hub
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      auth-service:
        condition: service_healthy
      core-service:
        condition: service_healthy
      mcp-server:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  auth-service:
    build:
      context: ./packages/auth-service
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID}
      - OAUTH_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    networks:
      - smart-ai-hub
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  core-service:
    build:
      context: ./packages/core-service
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
    networks:
      - smart-ai-hub
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mcp-server:
    build:
      context: ./packages/mcp-server
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    networks:
      - smart-ai-hub
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile.prod
    networks:
      - smart-ai-hub
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  smart-ai-hub:
    driver: bridge
```

### Step 2: Create Production Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name smartaihub.com www.smartaihub.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name smartaihub.com www.smartaihub.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Frontend
        location / {
            proxy_pass http://frontend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API Gateway
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://api-gateway:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Auth endpoints with stricter rate limiting
        location /api/auth/login {
            limit_req zone=auth burst=10 nodelay;
            
            proxy_pass http://api-gateway:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### Step 3: Create Deployment Script

Create `scripts/deploy-production.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Starting Smart AI Hub Production Deployment"

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "❌ .env.production file not found"
    exit 1
fi

# Check required environment variables
required_vars=(
    "POSTGRES_DB"
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "STRIPE_SECRET_KEY"
    "OPENAI_API_KEY"
    "ANTHROPIC_API_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Create SSL directory if it doesn't exist
mkdir -p nginx/ssl

# Check SSL certificates
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    echo "⚠️ SSL certificates not found. Generating self-signed certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=smartaihub.com"
    echo "⚠️ Self-signed certificates generated. Replace with Let's Encrypt certificates in production."
fi

# Create necessary directories
mkdir -p logs/nginx
mkdir -p backups

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose -f docker-compose.prod.yml pull

# Build custom images
echo "🔨 Building custom images..."
docker-compose -f docker-compose.prod.yml build

# Stop existing services
echo "⏹️ Stopping existing services..."
docker-compose -f docker-compose.prod.yml down

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm core-service npm run prisma:migrate

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
services=("api-gateway:3000" "auth-service:3001" "core-service:3002" "mcp-server:3003")
all_healthy=true

for service in "${services[@]}"; do
    service_name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $service_name is healthy"
    else
        echo "❌ $service_name is not healthy"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    echo "🎉 All services are healthy! Deployment successful."
    echo "🌐 Smart AI Hub is now running at https://smartaihub.com"
else
    echo "❌ Some services are not healthy. Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Set up log rotation
echo "📋 Setting up log rotation..."
cat > /etc/logrotate.d/smart-ai-hub << EOF
/path/to/smart-ai-hub/logs/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /path/to/smart-ai-hub/docker-compose.prod.yml exec nginx nginx -s reload
    endscript
}
EOF

echo "✅ Deployment completed successfully!"
echo "📊 Monitor services with: docker-compose -f docker-compose.prod.yml logs -f"
echo "🔧 Manage services with: docker-compose -f docker-compose.prod.yml [start|stop|restart]"
```

---

## 5. Testing Framework Implementation

### Step 1: Create Test Configuration

Create `jest.config.js` in the root directory:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  testTimeout: 10000,
};
```

### Step 2: Create Test Setup

Create `test-setup.ts` in the root directory:

```typescript
import { PrismaClient } from '@prisma/client';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5433/smart_ai_hub_test';
process.env.REDIS_URL = 'redis://localhost:6380';

// Global test setup
beforeAll(async () => {
  // Setup test database
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Clean database before tests
  await prisma.creditTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.promoCodeUsage.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.creditAccount.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  await prisma.$disconnect();
});

afterAll(async () => {
  // Cleanup after all tests
  // Add any necessary cleanup code
});
```

### Step 3: Create API Test Example

Create `packages/auth-service/src/__tests__/auth.test.ts`:

```typescript
import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Authentication API', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });
      
      token = response.body.token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
```

---

## Quick Start Commands

### For Immediate Implementation (Today)

```bash
# 1. Complete Claude Integration
cd packages/mcp-server
npm install @anthropic-ai/sdk
# Update claude.provider.ts with the code above
# Update provider.manager.ts with the code above

# 2. Start Payment System
cd packages/core-service
npm install stripe
# Create payment.service.ts with the code above
# Create payment.routes.ts with the code above

# 3. Frontend Development
cd packages/frontend
npm install @reduxjs/toolkit react-redux
# Create authSlice.ts with the code above
# Create LoginPage.tsx with the code above

# 4. Testing Setup
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
# Create jest.config.js with the code above
# Create test-setup.ts with the code above
```

### For Production Deployment (Next Week)

```bash
# 1. Create production environment file
cp .env.example .env.production
# Edit .env.production with production values

# 2. Create SSL certificates
sudo certbot certonly --standalone -d smartaihub.com

# 3. Deploy to production
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh

# 4. Monitor deployment
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Conclusion

This implementation guide provides detailed, step-by-step instructions for completing the highest priority tasks in the Smart AI Hub project. Each section includes:

1. **Complete code examples** that can be directly implemented
2. **File structure** showing where to place the code
3. **Configuration details** for production deployment
4. **Testing examples** to ensure quality

The implementation is prioritized based on the critical path to MVP launch:
1. **Claude Integration** - Complete AI provider support
2. **Payment System** - Enable revenue generation
3. **Frontend UI** - User-facing components
4. **Production Deployment** - Go-live readiness
5. **Testing Framework** - Quality assurance

By following this guide, the development team can systematically complete the remaining Phase 1 tasks and achieve MVP launch within the target timeline of November 3, 2025.