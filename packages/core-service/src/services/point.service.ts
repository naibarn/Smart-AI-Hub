import { PrismaClient, Prisma, PointTransactionType } from '@prisma/client';
import { createClient } from 'redis';
import { createNotFoundError, createInternalServerError } from '@smart-ai-hub/shared';
import { recordUsage } from './analytics.service';
import * as creditService from './credit.service';

const prisma = new PrismaClient();

// Redis client for caching
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis for point service:', error);
  }
};

// Initialize Redis connection
connectRedis();

// Configuration constants from environment variables
const POINTS_DAILY_REWARD_AMOUNT = parseInt(process.env.POINTS_DAILY_REWARD_AMOUNT || '50');
const POINTS_PER_CREDIT = parseInt(process.env.POINTS_PER_CREDIT || '1000');
const POINTS_PER_USD = parseInt(process.env.POINTS_PER_USD || '10000');
const DAILY_REWARD_ENABLED = process.env.DAILY_REWARD_ENABLED !== 'false';
const DAILY_REWARD_TIMEZONE = process.env.DAILY_REWARD_TIMEZONE || 'UTC';
const AUTO_TOPUP_ENABLED = process.env.AUTO_TOPUP_ENABLED !== 'false';
const AUTO_TOPUP_THRESHOLD = parseInt(process.env.AUTO_TOPUP_THRESHOLD || '10');
const AUTO_TOPUP_AMOUNT_CREDITS = parseInt(process.env.AUTO_TOPUP_AMOUNT_CREDITS || '1');

// Interfaces for type safety
export interface PointBalance {
  balance: number;
  lastUpdate: Date;
}

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: PointTransactionType;
  description: string | null;
  createdAt: Date;
}

export interface PointHistory {
  data: PointTransaction[];
  total: number;
}

export interface ExchangeRate {
  id: string;
  name: string;
  rate: number;
  description: string | null;
}

/**
 * Get exchange rate by name from database or cache
 */
export const getExchangeRate = async (name: string): Promise<number> => {
  try {
    // Check cache first
    const cacheKey = `exchange_rate:${name}`;
    const cachedRate = await redisClient.get(cacheKey);
    if (cachedRate) {
      return parseFloat(cachedRate);
    }

    // Get from database
    const exchangeRate = await prisma.exchangeRate.findUnique({
      where: { name },
    });

    if (!exchangeRate) {
      // Return default rates if not found in database
      switch (name) {
        case 'credit_to_points':
          return POINTS_PER_CREDIT;
        case 'points_per_usd':
          return POINTS_PER_USD;
        case 'daily_reward_amount':
          return POINTS_DAILY_REWARD_AMOUNT;
        default:
          throw new Error(`Exchange rate not found: ${name}`);
      }
    }

    // Cache the result for 5 minutes
    await redisClient.setEx(cacheKey, 300, exchangeRate.rate.toString());

    return exchangeRate.rate;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    throw error;
  }
};

/**
 * Get user's current point balance
 */
export const getBalance = async (userId: string): Promise<number> => {
  try {
    // Query point_accounts table
    const pointAccount = await prisma.pointAccount.findUnique({
      where: { userId },
    });

    // Throw NotFoundError if no account exists
    if (!pointAccount) {
      throw createNotFoundError(`Point account not found for user: ${userId}`);
    }

    // Return balance
    return pointAccount.balance || 0;
  } catch (error) {
    console.error('Error getting point balance:', error);
    throw error;
  }
};

/**
 * Get user's point transaction history
 */
export const getHistory = async (
  userId: string,
  page: number,
  limit: number
): Promise<{ data: PointTransaction[]; total: number }> => {
  try {
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.pointTransaction.count({
      where: { userId },
    });

    // Get transactions with pagination, ordered by createdAt DESC
    const transactions = await prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: transactions as PointTransaction[],
      total,
    };
  } catch (error) {
    console.error('Error getting point history:', error);
    throw createInternalServerError('Failed to get point history');
  }
};

/**
 * Check and trigger auto top-up if needed
 * This function should be called before any point deduction
 */
export const checkAndTriggerAutoTopup = async (userId: string): Promise<boolean> => {
  try {
    // Check if auto top-up is enabled
    if (!AUTO_TOPUP_ENABLED) {
      return false;
    }

    // Get current Points and Credits balance
    const pointBalance = await getBalance(userId);
    const creditBalance = await creditService.getBalance(userId);

    // Check if conditions are met
    if (pointBalance <= AUTO_TOPUP_THRESHOLD && creditBalance >= AUTO_TOPUP_AMOUNT_CREDITS) {
      // Execute auto top-up in a transaction
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Deduct Credits
        await creditService.deductCredits(userId, 'auto_topup', AUTO_TOPUP_AMOUNT_CREDITS, {
          autoTopup: true,
        });

        // Add Points
        const pointsToAdd = AUTO_TOPUP_AMOUNT_CREDITS * (await getExchangeRate('credit_to_points'));
        await addPointsInTransaction(
          userId,
          pointsToAdd,
          'auto_topup_from_credit',
          `Auto top-up: ${AUTO_TOPUP_AMOUNT_CREDITS} Credit → ${pointsToAdd} Points`,
          tx
        );
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error in auto top-up:', error);
    throw error;
  }
};

/**
 * Exchange Credits to Points (manual)
 */
export const exchangeCreditsToPoints = async (
  userId: string,
  creditAmount: number
): Promise<{ newCreditBalance: number; newPointBalance: number; pointsReceived: number }> => {
  try {
    if (creditAmount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    const exchangeRate = await getExchangeRate('credit_to_points');
    const pointsToReceive = creditAmount * exchangeRate;

    // Use Prisma transaction for atomic operation
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Deduct Credits
      await creditService.deductCredits(userId, 'exchange_to_points', creditAmount, {
        exchangeToPoints: true,
      });

      // Add Points
      await addPointsInTransaction(
        userId,
        pointsToReceive,
        'exchange_from_credit',
        `Manual exchange: ${creditAmount} Credit → ${pointsToReceive} Points`,
        tx
      );

      // Get updated balances
      const newCreditBalance = await creditService.getBalance(userId);
      const newPointBalance = await getBalance(userId);

      return {
        newCreditBalance,
        newPointBalance,
        pointsReceived: pointsToReceive,
      };
    });

    return result;
  } catch (error) {
    console.error('Error exchanging credits to points:', error);
    throw error;
  }
};

/**
 * Add points to user account with transaction record
 */
export const addPoints = async (
  userId: string,
  amount: number,
  type: PointTransactionType,
  description?: string
): Promise<{ new_balance: number; transaction_id: string }> => {
  try {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Use Prisma transaction for atomic operation
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return await addPointsInTransaction(userId, amount, type, description, tx);
    });

    return result;
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
};

/**
 * Add points within a transaction (internal function)
 */
export const addPointsInTransaction = async (
  userId: string,
  amount: number,
  type: PointTransactionType,
  description?: string,
  tx?: Prisma.TransactionClient
): Promise<{ new_balance: number; transaction_id: string }> => {
  try {
    const client = tx || prisma;

    // Get or create point account
    let pointAccount = await client.pointAccount.findUnique({
      where: { userId },
    });

    if (!pointAccount) {
      pointAccount = await client.pointAccount.create({
        data: {
          userId,
          balance: amount,
        },
      });
    } else {
      // Update point account balance
      await client.pointAccount.update({
        where: { userId },
        data: { balance: (pointAccount.balance || 0) + amount },
      });

      // Refresh the account to get updated values
      pointAccount = await client.pointAccount.findUnique({
        where: { userId },
      });
    }

    // Create transaction record
    const newBalance = (pointAccount?.balance || 0) + amount;
    const transaction = await client.pointTransaction.create({
      data: {
        userId,
        amount,
        type,
        balanceAfter: newBalance,
        description,
      },
    });

    // Update user's points field for backward compatibility
    await client.user.update({
      where: { id: userId },
      data: { points: newBalance },
    });

    return {
      new_balance: newBalance,
      transaction_id: transaction.id,
    };
  } catch (error) {
    console.error('Error adding points in transaction:', error);
    throw error;
  }
};

/**
 * Deduct points from user account with transaction record
 * This function automatically checks for auto top-up before deduction
 */
export const deductPoints = async (
  userId: string,
  amount: number,
  description?: string,
  metadata?: any
): Promise<{
  status: string;
  new_balance: number;
  transaction_id: string;
  autoTopupTriggered?: boolean;
}> => {
  try {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Check auto top-up BEFORE deduction
    const autoTopupTriggered = await checkAndTriggerAutoTopup(userId);

    // Use Prisma transaction for atomic operation
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get point account
      const pointAccount = await tx.pointAccount.findUnique({
        where: { userId },
      });

      if (!pointAccount) {
        throw new Error(`Point account not found for user: ${userId}`);
      }

      // Check sufficient balance (after potential auto top-up)
      if ((pointAccount.balance || 0) < amount) {
        throw new Error('Insufficient points');
      }

      // Update point account balance
      await tx.pointAccount.update({
        where: { userId },
        data: { balance: (pointAccount.balance || 0) - amount },
      });

      // Refresh the account to get updated values
      const updatedAccount = await tx.pointAccount.findUnique({
        where: { userId },
      });

      // Create transaction record
      const transaction = await tx.pointTransaction.create({
        data: {
          userId,
          amount: -amount, // Negative for deduction
          type: 'usage',
          balanceAfter: (pointAccount.balance || 0) - amount,
          description,
          metadata: metadata || {},
        },
      });

      // Update user's points field for backward compatibility
      await tx.user.update({
        where: { id: userId },
        data: { points: (pointAccount.balance || 0) - amount },
      });

      return {
        new_balance: (pointAccount.balance || 0) - amount,
        transaction_id: transaction.id,
      };
    });

    return {
      status: 'ok',
      ...result,
      autoTopupTriggered,
    };
  } catch (error) {
    console.error('Error deducting points:', error);
    throw error;
  }
};

/**
 * Claim daily login reward
 */
export const claimDailyReward = async (
  userId: string
): Promise<{ points: number; message: string }> => {
  try {
    if (!DAILY_REWARD_ENABLED) {
      throw new Error('Daily rewards are currently disabled');
    }

    const rewardAmount = await getExchangeRate('daily_reward_amount');

    // Get user's timezone from profile or default to UTC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const userTimezone = (user?.profile?.preferences as any)?.timezone || DAILY_REWARD_TIMEZONE;

    // Get current date in user's timezone
    const now = new Date();
    const rewardDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    rewardDate.setHours(0, 0, 0, 0); // Set to start of day

    // Check if reward already claimed for today
    const existingReward = await prisma.dailyLoginReward.findUnique({
      where: {
        userId_rewardDate: {
          userId,
          rewardDate,
        },
      },
    });

    if (existingReward) {
      throw new Error('Daily reward already claimed for today');
    }

    // Create reward record and add points in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create daily reward record
      await tx.dailyLoginReward.create({
        data: {
          userId,
          rewardDate,
          points: rewardAmount,
        },
      });

      // Add points to user account
      await addPointsInTransaction(
        userId,
        rewardAmount,
        'daily_reward',
        `Daily login reward - ${rewardDate.toDateString()}`,
        tx
      );
    });

    return {
      points: rewardAmount,
      message: `Successfully claimed ${rewardAmount} points as your daily reward!`,
    };
  } catch (error) {
    console.error('Error claiming daily reward:', error);
    throw error;
  }
};

/**
 * Check daily reward status
 */
export const getDailyRewardStatus = async (
  userId: string
): Promise<{
  canClaim: boolean;
  nextClaimDate?: Date;
  lastClaimDate?: Date;
  rewardAmount: number;
}> => {
  try {
    const rewardAmount = await getExchangeRate('daily_reward_amount');

    // Get user's timezone from profile or default to UTC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const userTimezone = (user?.profile?.preferences as any)?.timezone || DAILY_REWARD_TIMEZONE;

    // Get current date in user's timezone
    const now = new Date();
    const rewardDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    rewardDate.setHours(0, 0, 0, 0); // Set to start of day

    // Check if reward already claimed for today
    const existingReward = await prisma.dailyLoginReward.findUnique({
      where: {
        userId_rewardDate: {
          userId,
          rewardDate,
        },
      },
    });

    if (existingReward) {
      // Calculate next claim date (tomorrow in user's timezone)
      const tomorrow = new Date(rewardDate);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        canClaim: false,
        nextClaimDate: tomorrow,
        lastClaimDate: existingReward.claimedAt,
        rewardAmount,
      };
    }

    return {
      canClaim: true,
      rewardAmount,
    };
  } catch (error) {
    console.error('Error checking daily reward status:', error);
    throw error;
  }
};

/**
 * Adjust user points (admin only)
 */
export const adjustPoints = async (
  userId: string,
  amount: number,
  reason: string
): Promise<number> => {
  try {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required for point adjustment');
    }

    // Use Prisma transaction for atomic operation
    const newBalance = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let pointAccount = await tx.pointAccount.findUnique({
        where: { userId },
      });

      if (!pointAccount) {
        pointAccount = await tx.pointAccount.create({
          data: {
            userId,
            balance: amount,
          },
        });
      } else {
        // Update point account balance
        await tx.pointAccount.update({
          where: { userId },
          data: { balance: (pointAccount.balance || 0) + amount },
        });

        // Refresh the account to get updated values
        pointAccount = await tx.pointAccount.findUnique({
          where: { userId },
        });
      }

      // Create transaction record
      const newBalance = (pointAccount?.balance || 0) + amount;
      await tx.pointTransaction.create({
        data: {
          userId,
          amount,
          type: 'admin_adjustment',
          balanceAfter: newBalance,
          description: `Admin adjustment: ${reason}`,
        },
      });

      // Update user's points field for backward compatibility
      await tx.user.update({
        where: { id: userId },
        data: { points: newBalance },
      });

      return newBalance;
    });

    return newBalance as number;
  } catch (error) {
    console.error('Error adjusting points:', error);
    throw error;
  }
};

/**
 * Get all exchange rates (admin only)
 */
export const getExchangeRates = async (): Promise<ExchangeRate[]> => {
  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { name: 'asc' },
    });

    return rates as ExchangeRate[];
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    throw error;
  }
};

/**
 * Update exchange rate (admin only)
 */
export const updateExchangeRate = async (
  name: string,
  rate: number,
  description?: string
): Promise<ExchangeRate> => {
  try {
    if (rate <= 0) {
      throw new Error('Rate must be positive');
    }

    const updatedRate = await prisma.exchangeRate.upsert({
      where: { name },
      update: {
        rate,
        description,
      },
      create: {
        name,
        rate,
        description,
      },
    });

    // Clear cache for this rate
    await redisClient.del(`exchange_rate:${name}`);

    return updatedRate as ExchangeRate;
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    throw error;
  }
};

/**
 * Get points statistics (admin only)
 */
export const getPointsStats = async (): Promise<{
  totalPoints: number;
  totalUsers: number;
  activeUsers: number;
  averageBalance: number;
  totalTransactions: number;
}> => {
  try {
    const [totalPointsResult, totalUsersResult, activeUsersResult, totalTransactionsResult] =
      await Promise.all([
        prisma.pointAccount.aggregate({
          _sum: { balance: true },
        }),
        prisma.pointAccount.count(),
        prisma.pointAccount.count({
          where: {
            balance: {
              gt: 0,
            },
          },
        }),
        prisma.pointTransaction.count(),
      ]);

    const totalPoints = totalPointsResult._sum.balance || 0;
    const totalUsers = totalUsersResult;
    const activeUsers = activeUsersResult;
    const totalTransactions = totalTransactionsResult;
    const averageBalance = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;

    return {
      totalPoints,
      totalUsers,
      activeUsers,
      averageBalance,
      totalTransactions,
    };
  } catch (error) {
    console.error('Error getting points stats:', error);
    throw error;
  }
};

/**
 * Get auto top-up statistics (admin only)
 */
export const getAutoTopupStats = async (): Promise<{
  totalAutoTopups: number;
  totalCreditsConverted: number;
  totalPointsGenerated: number;
  recentAutoTopups: PointTransaction[];
}> => {
  try {
    const [
      totalAutoTopupsResult,
      totalCreditsConvertedResult,
      totalPointsGeneratedResult,
      recentAutoTopups,
    ] = await Promise.all([
      prisma.pointTransaction.count({
        where: {
          type: 'auto_topup_from_credit',
        },
      }),
      prisma.pointTransaction.aggregate({
        where: {
          type: 'auto_topup_from_credit',
        },
        _sum: { amount: true },
      }),
      prisma.pointTransaction.aggregate({
        where: {
          type: 'auto_topup_from_credit',
        },
        _avg: { amount: true },
      }),
      prisma.pointTransaction.findMany({
        where: {
          type: 'auto_topup_from_credit',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const totalAutoTopups = totalAutoTopupsResult;
    const totalPointsGenerated = totalCreditsConvertedResult._sum.amount || 0;
    const totalCreditsConverted = Math.round(totalPointsGenerated / POINTS_PER_CREDIT);

    return {
      totalAutoTopups,
      totalCreditsConverted,
      totalPointsGenerated,
      recentAutoTopups: recentAutoTopups as PointTransaction[],
    };
  } catch (error) {
    console.error('Error getting auto top-up stats:', error);
    throw error;
  }
};

/**
 * Purchase points with real money
 */
export const purchasePoints = async (
  userId: string,
  pointsAmount: number,
  paymentDetails: {
    stripeSessionId: string;
    stripePaymentIntentId?: string;
    amount: number;
  }
): Promise<{ new_balance: number; transaction_id: string }> => {
  try {
    if (pointsAmount <= 0) {
      throw new Error('Points amount must be positive');
    }

    // Use Prisma transaction for atomic operation
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create payment record
      await tx.payment.create({
        data: {
          userId,
          amount: paymentDetails.amount,
          credits: 0, // No credits for point purchases
          points: pointsAmount,
          status: 'completed',
          stripeSessionId: paymentDetails.stripeSessionId,
          stripePaymentIntentId: paymentDetails.stripePaymentIntentId,
        },
      });

      // Add points to user account
      const pointsResult = await addPointsInTransaction(
        userId,
        pointsAmount,
        'purchase',
        `Purchased ${pointsAmount} points for $${paymentDetails.amount}`,
        tx
      );

      return pointsResult;
    });

    return result;
  } catch (error) {
    console.error('Error purchasing points:', error);
    throw error;
  }
};

/**
 * Disconnect Redis client (call this when shutting down the application)
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
  } catch (error) {
    console.error('Error disconnecting Redis from point service:', error);
  }
};
