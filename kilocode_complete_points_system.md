Complete Points System Implementation for Smart AI Hub

## Context

The Multi-tier User Hierarchy and Referral System has been successfully implemented. However, the **Points System** (including Auto Top-up feature) is still incomplete.

This prompt will guide you to complete the Points System implementation to match the specification in `kilocode_points_system_spec.md` and `kilocode_points_prompt_v2.txt`.

---

## Objective

Implement the complete Points System with the following features:

1. Points data model and management
2. Points APIs (balance, deduct, history, purchase, exchange)
3. Credit-to-Points exchange system
4. Points purchase with money
5. Daily login rewards
6. **Auto Top-up feature** (automatic Points refill when balance is low)
7. Exchange rate configuration (admin-controlled)
8. Frontend UI components
9. Comprehensive tests

---

## Task 1: Database Schema for Points System

### 1.1 Update User Model

Add Points field to User model if not already present:

```prisma
model User {
  // Existing fields...
  
  // Points System
  points                Int              @default(0)
  credits               Int              @default(0)
  
  // Relations
  pointTransactions     PointTransaction[]
  creditTransactions    CreditTransaction[]
  dailyRewards          DailyReward[]
}
```

### 1.2 Create PointTransaction Model

```prisma
model PointTransaction {
  id          String              @id @default(uuid())
  userId      String
  type        PointTransactionType
  amount      Int
  balanceBefore Int
  balanceAfter  Int
  description String?
  metadata    Json                @default("{}")
  createdAt   DateTime            @default(now())
  
  user        User                @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}

enum PointTransactionType {
  purchase          // Purchased with money
  exchange          // Exchanged from credits
  transfer_in       // Received from transfer
  transfer_out      // Sent via transfer
  deduct            // Deducted for service usage
  refund            // Refunded
  daily_reward      // Daily login reward
  referral_reward   // Referral reward
  auto_topup        // Auto top-up from credits
  admin_adjustment  // Admin adjustment
}
```

### 1.3 Create CreditTransaction Model

```prisma
model CreditTransaction {
  id          String                @id @default(uuid())
  userId      String
  type        CreditTransactionType
  amount      Int
  balanceBefore Int
  balanceAfter  Int
  description String?
  metadata    Json                  @default("{}")
  createdAt   DateTime              @default(now())
  
  user        User                  @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}

enum CreditTransactionType {
  purchase          // Purchased with money
  transfer_in       // Received from transfer
  transfer_out      // Sent via transfer
  exchange_to_points // Exchanged to points
  admin_adjustment  // Admin adjustment
}
```

### 1.4 Create ExchangeRate Model

```prisma
model ExchangeRate {
  id                    String   @id @default(uuid())
  creditToPointsRate    Int      @default(1000)  // 1 Credit = X Points
  pointsToDollarRate    Int      @default(10000) // X Points = 1 USD
  isActive              Boolean  @default(true)
  createdBy             String
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  creator               User     @relation(fields: [createdBy], references: [id])
}
```

### 1.5 Create DailyReward Model

```prisma
model DailyReward {
  id          String   @id @default(uuid())
  userId      String
  points      Int      @default(100)
  claimedAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId, claimedAt])
}
```

### 1.6 Create AutoTopupLog Model

```prisma
model AutoTopupLog {
  id              String   @id @default(uuid())
  userId          String
  creditsDeducted Int
  pointsAdded     Int
  triggerReason   String   // "low_balance", "manual"
  balanceBefore   Json     // { points: X, credits: Y }
  balanceAfter    Json     // { points: X, credits: Y }
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}
```

### 1.7 Run Migrations

```bash
npx prisma migrate dev --name add_points_system
npx prisma generate
```

---

## Task 2: Points Service Layer

### 2.1 Create PointService

**File:** `packages/core-service/src/services/point.service.ts`

```typescript
import { prisma } from '../lib/prisma';
import { PointTransactionType } from '@prisma/client';

export class PointService {
  /**
   * Get user's points balance
   */
  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.points;
  }
  
  /**
   * Add points to user (with transaction logging)
   */
  async addPoints(
    userId: string,
    amount: number,
    type: PointTransactionType,
    description?: string,
    metadata?: any
  ): Promise<void> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    await prisma.$transaction(async (tx) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const balanceBefore = user.points;
      const balanceAfter = balanceBefore + amount;
      
      // Update balance
      await tx.user.update({
        where: { id: userId },
        data: { points: balanceAfter }
      });
      
      // Log transaction
      await tx.pointTransaction.create({
        data: {
          userId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          description,
          metadata: metadata || {}
        }
      });
    });
  }
  
  /**
   * Deduct points from user (with transaction logging)
   */
  async deductPoints(
    userId: string,
    amount: number,
    type: PointTransactionType,
    description?: string,
    metadata?: any
  ): Promise<void> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    await prisma.$transaction(async (tx) => {
      // Get current balance with row lock
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const balanceBefore = user.points;
      
      if (balanceBefore < amount) {
        throw new Error('Insufficient points balance');
      }
      
      const balanceAfter = balanceBefore - amount;
      
      // Update balance
      await tx.user.update({
        where: { id: userId },
        data: { points: balanceAfter }
      });
      
      // Log transaction
      await tx.pointTransaction.create({
        data: {
          userId,
          type,
          amount: -amount,
          balanceBefore,
          balanceAfter,
          description,
          metadata: metadata || {}
        }
      });
    });
  }
  
  /**
   * Get points transaction history
   */
  async getHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.pointTransaction.count({
        where: { userId }
      })
    ]);
    
    return {
      data: transactions,
      total,
      page,
      limit,
      hasMore: skip + transactions.length < total
    };
  }
  
  /**
   * Exchange credits to points
   */
  async exchangeCreditsToPoints(
    userId: string,
    creditsAmount: number
  ): Promise<void> {
    if (creditsAmount <= 0) {
      throw new Error('Credits amount must be positive');
    }
    
    // Get exchange rate
    const exchangeRate = await this.getActiveExchangeRate();
    const pointsAmount = creditsAmount * exchangeRate.creditToPointsRate;
    
    await prisma.$transaction(async (tx) => {
      // Get current balances
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true, points: true }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.credits < creditsAmount) {
        throw new Error('Insufficient credits balance');
      }
      
      // Deduct credits
      await tx.user.update({
        where: { id: userId },
        data: { credits: user.credits - creditsAmount }
      });
      
      // Log credit transaction
      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'exchange_to_points',
          amount: -creditsAmount,
          balanceBefore: user.credits,
          balanceAfter: user.credits - creditsAmount,
          description: `Exchanged ${creditsAmount} credits to ${pointsAmount} points`,
          metadata: { pointsAmount, exchangeRate: exchangeRate.creditToPointsRate }
        }
      });
      
      // Add points
      await tx.user.update({
        where: { id: userId },
        data: { points: user.points + pointsAmount }
      });
      
      // Log point transaction
      await tx.pointTransaction.create({
        data: {
          userId,
          type: 'exchange',
          amount: pointsAmount,
          balanceBefore: user.points,
          balanceAfter: user.points + pointsAmount,
          description: `Exchanged from ${creditsAmount} credits`,
          metadata: { creditsAmount, exchangeRate: exchangeRate.creditToPointsRate }
        }
      });
    });
  }
  
  /**
   * Purchase points with money (USD)
   */
  async purchasePoints(
    userId: string,
    amountUSD: number,
    paymentMethod: string,
    paymentId: string
  ): Promise<void> {
    if (amountUSD <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // Get exchange rate
    const exchangeRate = await this.getActiveExchangeRate();
    const pointsAmount = Math.floor(amountUSD * exchangeRate.pointsToDollarRate);
    
    await this.addPoints(
      userId,
      pointsAmount,
      'purchase',
      `Purchased ${pointsAmount} points for $${amountUSD}`,
      {
        amountUSD,
        paymentMethod,
        paymentId,
        exchangeRate: exchangeRate.pointsToDollarRate
      }
    );
  }
  
  /**
   * Get active exchange rate
   */
  async getActiveExchangeRate(): Promise<any> {
    const rate = await prisma.exchangeRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!rate) {
      // Return default rates if none configured
      return {
        creditToPointsRate: 1000,
        pointsToDollarRate: 10000
      };
    }
    
    return rate;
  }
  
  /**
   * Check if user needs auto top-up and execute if needed
   */
  async checkAndExecuteAutoTopup(userId: string): Promise<boolean> {
    const AUTO_TOPUP_ENABLED = process.env.AUTO_TOPUP_ENABLED === 'true';
    const AUTO_TOPUP_THRESHOLD = parseInt(process.env.AUTO_TOPUP_THRESHOLD || '10');
    const AUTO_TOPUP_CREDITS = parseInt(process.env.AUTO_TOPUP_CREDITS || '1');
    
    if (!AUTO_TOPUP_ENABLED) {
      return false;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, credits: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if auto top-up is needed
    const needsTopup = user.points <= AUTO_TOPUP_THRESHOLD && user.credits >= AUTO_TOPUP_CREDITS;
    
    if (!needsTopup) {
      return false;
    }
    
    // Execute auto top-up
    await this.executeAutoTopup(userId, AUTO_TOPUP_CREDITS);
    
    return true;
  }
  
  /**
   * Execute auto top-up
   */
  private async executeAutoTopup(userId: string, creditsToUse: number): Promise<void> {
    const exchangeRate = await this.getActiveExchangeRate();
    const pointsToAdd = creditsToUse * exchangeRate.creditToPointsRate;
    
    await prisma.$transaction(async (tx) => {
      // Get current balances
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true, points: true }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.credits < creditsToUse) {
        throw new Error('Insufficient credits for auto top-up');
      }
      
      const balanceBefore = {
        points: user.points,
        credits: user.credits
      };
      
      // Deduct credits
      await tx.user.update({
        where: { id: userId },
        data: { credits: user.credits - creditsToUse }
      });
      
      // Log credit transaction
      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'exchange_to_points',
          amount: -creditsToUse,
          balanceBefore: user.credits,
          balanceAfter: user.credits - creditsToUse,
          description: `Auto top-up: ${creditsToUse} credits to ${pointsToAdd} points`,
          metadata: { autoTopup: true, pointsAdded: pointsToAdd }
        }
      });
      
      // Add points
      await tx.user.update({
        where: { id: userId },
        data: { points: user.points + pointsToAdd }
      });
      
      // Log point transaction
      await tx.pointTransaction.create({
        data: {
          userId,
          type: 'auto_topup',
          amount: pointsToAdd,
          balanceBefore: user.points,
          balanceAfter: user.points + pointsToAdd,
          description: `Auto top-up from ${creditsToUse} credits`,
          metadata: { creditsUsed: creditsToUse, autoTopup: true }
        }
      });
      
      const balanceAfter = {
        points: user.points + pointsToAdd,
        credits: user.credits - creditsToUse
      };
      
      // Log auto top-up
      await tx.autoTopupLog.create({
        data: {
          userId,
          creditsDeducted: creditsToUse,
          pointsAdded: pointsToAdd,
          triggerReason: 'low_balance',
          balanceBefore,
          balanceAfter
        }
      });
    });
  }
  
  /**
   * Claim daily login reward
   */
  async claimDailyReward(userId: string): Promise<number> {
    const DAILY_REWARD_POINTS = parseInt(process.env.DAILY_REWARD_POINTS || '100');
    
    // Check if already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingReward = await prisma.dailyReward.findFirst({
      where: {
        userId,
        claimedAt: {
          gte: today
        }
      }
    });
    
    if (existingReward) {
      throw new Error('Daily reward already claimed today');
    }
    
    await prisma.$transaction(async (tx) => {
      // Add points
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      await tx.user.update({
        where: { id: userId },
        data: { points: user.points + DAILY_REWARD_POINTS }
      });
      
      // Log transaction
      await tx.pointTransaction.create({
        data: {
          userId,
          type: 'daily_reward',
          amount: DAILY_REWARD_POINTS,
          balanceBefore: user.points,
          balanceAfter: user.points + DAILY_REWARD_POINTS,
          description: 'Daily login reward'
        }
      });
      
      // Record daily reward
      await tx.dailyReward.create({
        data: {
          userId,
          points: DAILY_REWARD_POINTS
        }
      });
    });
    
    return DAILY_REWARD_POINTS;
  }
}

export const pointService = new PointService();
```

---

## Task 3: Points Controller and Routes

### 3.1 Create PointController

**File:** `packages/core-service/src/controllers/point.controller.ts`

```typescript
import { Request, Response } from 'express';
import { pointService } from '../services/point.service';

export class PointController {
  /**
   * GET /api/v1/points/balance
   */
  async getBalance(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const balance = await pointService.getBalance(userId);
      
      res.json({
        success: true,
        data: { points: balance }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * POST /api/v1/points/deduct
   */
  async deduct(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { amount, description } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount'
        });
      }
      
      await pointService.deductPoints(userId, amount, 'deduct', description);
      
      // Check and execute auto top-up if needed
      const toppedUp = await pointService.checkAndExecuteAutoTopup(userId);
      
      const newBalance = await pointService.getBalance(userId);
      
      res.json({
        success: true,
        data: {
          points: newBalance,
          autoToppedUp: toppedUp
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * GET /api/v1/points/history
   */
  async getHistory(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const history = await pointService.getHistory(userId, page, limit);
      
      res.json({
        success: true,
        ...history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * POST /api/v1/points/exchange
   */
  async exchange(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { credits } = req.body;
      
      if (!credits || credits <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid credits amount'
        });
      }
      
      await pointService.exchangeCreditsToPoints(userId, credits);
      
      const newBalance = await pointService.getBalance(userId);
      
      res.json({
        success: true,
        data: { points: newBalance }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * POST /api/v1/points/purchase
   */
  async purchase(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { amountUSD, paymentMethod, paymentId } = req.body;
      
      if (!amountUSD || amountUSD <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount'
        });
      }
      
      if (!paymentMethod || !paymentId) {
        return res.status(400).json({
          success: false,
          error: 'Payment information required'
        });
      }
      
      await pointService.purchasePoints(userId, amountUSD, paymentMethod, paymentId);
      
      const newBalance = await pointService.getBalance(userId);
      
      res.json({
        success: true,
        data: { points: newBalance }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * POST /api/v1/points/daily-reward
   */
  async claimDailyReward(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const points = await pointService.claimDailyReward(userId);
      
      res.json({
        success: true,
        data: { points }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * GET /api/v1/points/exchange-rate
   */
  async getExchangeRate(req: Request, res: Response) {
    try {
      const rate = await pointService.getActiveExchangeRate();
      
      res.json({
        success: true,
        data: rate
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const pointController = new PointController();
```

### 3.2 Create Point Routes

**File:** `packages/core-service/src/routes/point.routes.ts`

```typescript
import { Router } from 'express';
import { pointController } from '../controllers/point.controller';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get points balance
router.get('/balance', pointController.getBalance);

// Deduct points
router.post('/deduct', 
  rateLimit({ max: 100, windowMs: 60000 }), // 100 requests per minute
  pointController.deduct
);

// Get points history
router.get('/history', pointController.getHistory);

// Exchange credits to points
router.post('/exchange',
  rateLimit({ max: 10, windowMs: 60000 }), // 10 exchanges per minute
  pointController.exchange
);

// Purchase points with money
router.post('/purchase',
  rateLimit({ max: 5, windowMs: 60000 }), // 5 purchases per minute
  pointController.purchase
);

// Claim daily reward
router.post('/daily-reward',
  rateLimit({ max: 1, windowMs: 86400000 }), // 1 claim per day
  pointController.claimDailyReward
);

// Get exchange rate
router.get('/exchange-rate', pointController.getExchangeRate);

export default router;
```

### 3.3 Register Routes in Main App

**File:** `packages/core-service/src/app.ts`

```typescript
import pointRoutes from './routes/point.routes';

// ... existing code ...

app.use('/api/v1/points', pointRoutes);
```

---

## Task 4: Admin Exchange Rate Management

### 4.1 Create ExchangeRateController

**File:** `packages/core-service/src/controllers/admin/exchangeRate.controller.ts`

```typescript
import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export class ExchangeRateController {
  /**
   * GET /api/v1/admin/exchange-rates
   */
  async getAll(req: Request, res: Response) {
    try {
      const rates = await prisma.exchangeRate.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });
      
      res.json({
        success: true,
        data: rates
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * POST /api/v1/admin/exchange-rates
   */
  async create(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { creditToPointsRate, pointsToDollarRate } = req.body;
      
      if (!creditToPointsRate || creditToPointsRate <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid creditToPointsRate'
        });
      }
      
      if (!pointsToDollarRate || pointsToDollarRate <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pointsToDollarRate'
        });
      }
      
      // Deactivate all existing rates
      await prisma.exchangeRate.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
      
      // Create new rate
      const rate = await prisma.exchangeRate.create({
        data: {
          creditToPointsRate,
          pointsToDollarRate,
          isActive: true,
          createdBy: userId
        }
      });
      
      res.json({
        success: true,
        data: rate
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * PUT /api/v1/admin/exchange-rates/:id/activate
   */
  async activate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Deactivate all rates
      await prisma.exchangeRate.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
      
      // Activate this rate
      const rate = await prisma.exchangeRate.update({
        where: { id },
        data: { isActive: true }
      });
      
      res.json({
        success: true,
        data: rate
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const exchangeRateController = new ExchangeRateController();
```

### 4.2 Create Admin Routes

**File:** `packages/core-service/src/routes/admin/exchangeRate.routes.ts`

```typescript
import { Router } from 'express';
import { exchangeRateController } from '../../controllers/admin/exchangeRate.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/requireAdmin';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get all exchange rates
router.get('/', exchangeRateController.getAll);

// Create new exchange rate
router.post('/', exchangeRateController.create);

// Activate exchange rate
router.put('/:id/activate', exchangeRateController.activate);

export default router;
```

### 4.3 Register Admin Routes

**File:** `packages/core-service/src/app.ts`

```typescript
import exchangeRateRoutes from './routes/admin/exchangeRate.routes';

// ... existing code ...

app.use('/api/v1/admin/exchange-rates', exchangeRateRoutes);
```

---

## Task 5: Environment Configuration

Add to `.env`:

```env
# Points System
AUTO_TOPUP_ENABLED=true
AUTO_TOPUP_THRESHOLD=10
AUTO_TOPUP_CREDITS=1
DAILY_REWARD_POINTS=100

# Exchange Rates (defaults)
DEFAULT_CREDIT_TO_POINTS_RATE=1000
DEFAULT_POINTS_TO_DOLLAR_RATE=10000
```

---

## Task 6: Testing

### 6.1 Unit Tests

**File:** `tests/unit/point.service.test.ts`

```typescript
import { pointService } from '../../src/services/point.service';
import { prisma } from '../../src/lib/prisma';

describe('PointService', () => {
  let testUserId: string;
  
  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        points: 1000,
        credits: 10
      }
    });
    testUserId = user.id;
  });
  
  afterEach(async () => {
    // Clean up
    await prisma.user.delete({ where: { id: testUserId } });
  });
  
  describe('getBalance', () => {
    it('should return user points balance', async () => {
      const balance = await pointService.getBalance(testUserId);
      expect(balance).toBe(1000);
    });
  });
  
  describe('addPoints', () => {
    it('should add points and log transaction', async () => {
      await pointService.addPoints(testUserId, 500, 'purchase');
      const balance = await pointService.getBalance(testUserId);
      expect(balance).toBe(1500);
    });
  });
  
  describe('deductPoints', () => {
    it('should deduct points and log transaction', async () => {
      await pointService.deductPoints(testUserId, 300, 'deduct');
      const balance = await pointService.getBalance(testUserId);
      expect(balance).toBe(700);
    });
    
    it('should throw error if insufficient balance', async () => {
      await expect(
        pointService.deductPoints(testUserId, 2000, 'deduct')
      ).rejects.toThrow('Insufficient points balance');
    });
  });
  
  describe('exchangeCreditsToPoints', () => {
    it('should exchange credits to points at correct rate', async () => {
      await pointService.exchangeCreditsToPoints(testUserId, 5);
      
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { points: true, credits: true }
      });
      
      expect(user.credits).toBe(5); // 10 - 5
      expect(user.points).toBe(6000); // 1000 + (5 * 1000)
    });
    
    it('should throw error if insufficient credits', async () => {
      await expect(
        pointService.exchangeCreditsToPoints(testUserId, 20)
      ).rejects.toThrow('Insufficient credits balance');
    });
  });
  
  describe('checkAndExecuteAutoTopup', () => {
    it('should execute auto top-up when points low and credits available', async () => {
      // Set points to 5 (below threshold of 10)
      await prisma.user.update({
        where: { id: testUserId },
        data: { points: 5, credits: 10 }
      });
      
      const toppedUp = await pointService.checkAndExecuteAutoTopup(testUserId);
      expect(toppedUp).toBe(true);
      
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { points: true, credits: true }
      });
      
      expect(user.points).toBe(1005); // 5 + 1000
      expect(user.credits).toBe(9); // 10 - 1
    });
    
    it('should not execute auto top-up when points above threshold', async () => {
      const toppedUp = await pointService.checkAndExecuteAutoTopup(testUserId);
      expect(toppedUp).toBe(false);
    });
    
    it('should not execute auto top-up when insufficient credits', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { points: 5, credits: 0 }
      });
      
      const toppedUp = await pointService.checkAndExecuteAutoTopup(testUserId);
      expect(toppedUp).toBe(false);
    });
  });
  
  describe('claimDailyReward', () => {
    it('should claim daily reward successfully', async () => {
      const points = await pointService.claimDailyReward(testUserId);
      expect(points).toBe(100);
      
      const balance = await pointService.getBalance(testUserId);
      expect(balance).toBe(1100); // 1000 + 100
    });
    
    it('should throw error if already claimed today', async () => {
      await pointService.claimDailyReward(testUserId);
      
      await expect(
        pointService.claimDailyReward(testUserId)
      ).rejects.toThrow('Daily reward already claimed today');
    });
  });
});
```

### 6.2 Integration Tests

**File:** `tests/integration/point.api.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';
import { generateToken } from '../../src/utils/auth';

describe('Points API', () => {
  let authToken: string;
  let testUserId: string;
  
  beforeAll(async () => {
    // Create test user and get token
    const user = await createTestUser();
    testUserId = user.id;
    authToken = generateToken(user);
  });
  
  describe('GET /api/v1/points/balance', () => {
    it('should return points balance', async () => {
      const response = await request(app)
        .get('/api/v1/points/balance')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('points');
    });
    
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/points/balance');
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('POST /api/v1/points/exchange', () => {
    it('should exchange credits to points', async () => {
      const response = await request(app)
        .post('/api/v1/points/exchange')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('should return 400 if invalid credits amount', async () => {
      const response = await request(app)
        .post('/api/v1/points/exchange')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ credits: -5 });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('POST /api/v1/points/daily-reward', () => {
    it('should claim daily reward', async () => {
      const response = await request(app)
        .post('/api/v1/points/daily-reward')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.points).toBe(100);
    });
  });
});
```

---

## Task 7: Documentation

Create API documentation in `API_DOCUMENTATION.md`:

```markdown
## Points System APIs

### Get Points Balance

**GET** `/api/v1/points/balance`

**Response:**
```json
{
  "success": true,
  "data": {
    "points": 5000
  }
}
```

### Deduct Points

**POST** `/api/v1/points/deduct`

**Request:**
```json
{
  "amount": 100,
  "description": "Used for service X"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "points": 4900,
    "autoToppedUp": false
  }
}
```

### Get Points History

**GET** `/api/v1/points/history?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 50,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

### Exchange Credits to Points

**POST** `/api/v1/points/exchange`

**Request:**
```json
{
  "credits": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "points": 10000
  }
}
```

### Purchase Points

**POST** `/api/v1/points/purchase`

**Request:**
```json
{
  "amountUSD": 10,
  "paymentMethod": "stripe",
  "paymentId": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "points": 110000
  }
}
```

### Claim Daily Reward

**POST** `/api/v1/points/daily-reward`

**Response:**
```json
{
  "success": true,
  "data": {
    "points": 100
  }
}
```

### Get Exchange Rate

**GET** `/api/v1/points/exchange-rate`

**Response:**
```json
{
  "success": true,
  "data": {
    "creditToPointsRate": 1000,
    "pointsToDollarRate": 10000
  }
}
```

## Admin APIs

### Get All Exchange Rates

**GET** `/api/v1/admin/exchange-rates`

**Authorization:** Administrator only

### Create Exchange Rate

**POST** `/api/v1/admin/exchange-rates`

**Request:**
```json
{
  "creditToPointsRate": 1200,
  "pointsToDollarRate": 12000
}
```

### Activate Exchange Rate

**PUT** `/api/v1/admin/exchange-rates/:id/activate`
```

---

## Success Criteria

- [ ] All database models created and migrated
- [ ] PointService implemented with all methods
- [ ] All API endpoints working
- [ ] Auto top-up feature working correctly
- [ ] Daily rewards working correctly
- [ ] Exchange rate configuration working
- [ ] Admin can manage exchange rates
- [ ] All unit tests passing (>80% coverage)
- [ ] All integration tests passing
- [ ] API documentation complete
- [ ] Environment variables documented

---

## Deployment Checklist

- [ ] Run database migrations
- [ ] Set environment variables
- [ ] Create default exchange rate
- [ ] Test auto top-up feature
- [ ] Test daily rewards
- [ ] Test rate limiting
- [ ] Monitor transaction logs
- [ ] Set up alerts for failed transactions

---

Please implement the complete Points System following this specification. Ensure all features work correctly and are properly tested before deployment.

