import { PrismaClient, Prisma } from '@prisma/client';
import { createClient } from 'redis';
import { 
  CreditReservation, 
  CreditReservationStatus, 
  CreditService,
  PRICING_CONSTANTS 
} from '@smart-ai-hub/shared';
import { createNotFoundError, createInternalServerError, createConflictError } from '@smart-ai-hub/shared';

const prisma = new PrismaClient();

// Redis client for distributed locking
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis for credit reservation service:', error);
  }
};

// Initialize Redis connection
connectRedis();

/**
 * Credit Reservation Service
 * Handles credit reservations for agent execution with distributed locking
 */
export class CreditReservationService implements CreditService {
  /**
   * Reserve credits for a user
   * @param userId - User ID
   * @param amount - Amount to reserve
   * @param sessionId - Session ID (optional)
   * @returns Reservation result
   */
  async reserveCredits(
    userId: string,
    amount: number,
    sessionId?: string
  ): Promise<{ success: boolean; reservationId: string }> {
    // Validate amount
    if (amount <= 0 || amount > PRICING_CONSTANTS.RESERVATION.MAX_RESERVATION_AMOUNT) {
      throw new Error(`Invalid reservation amount: ${amount}`);
    }

    const lockKey = `credit:lock:${userId}`;
    const lock = await this.acquireLock(lockKey);

    try {
      // Get user's credit account
      const creditAccount = await prisma.creditAccount.findUnique({
        where: { userId },
      });

      if (!creditAccount) {
        throw createNotFoundError(`Credit account not found for user: ${userId}`);
      }

      // Check if user has sufficient balance
      const availableBalance = await this.getAvailableBalance(userId);
      if (availableBalance < amount) {
        throw createConflictError('Insufficient credits for reservation');
      }

      // Create reservation
      const reservation = await prisma.creditReservation.create({
        data: {
          userId,
          amount,
          sessionId,
          status: CreditReservationStatus.ACTIVE,
          expiresAt: new Date(
            Date.now() + PRICING_CONSTANTS.RESERVATION.EXPIRY_MINUTES * 60 * 1000
          ),
        },
      });

      return {
        success: true,
        reservationId: reservation.id,
      };
    } finally {
      await this.releaseLock(lock);
    }
  }

  /**
   * Charge credits from a reservation
   * @param userId - User ID
   * @param reservationId - Reservation ID
   * @param actualAmount - Actual amount to charge (may be less than reserved)
   * @param usageLogId - Usage log ID for tracking
   * @returns Charge result
   */
  async chargeCredits(
    userId: string,
    reservationId: string,
    actualAmount: number,
    usageLogId: string
  ): Promise<{ success: boolean; balanceAfter: number }> {
    const lockKey = `credit:lock:${userId}`;
    const lock = await this.acquireLock(lockKey);

    try {
      // Get reservation
      const reservation = await prisma.creditReservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw createNotFoundError(`Reservation not found: ${reservationId}`);
      }

      if (reservation.userId !== userId) {
        throw new Error('Reservation does not belong to user');
      }

      if (reservation.status !== CreditReservationStatus.ACTIVE) {
        throw createConflictError(`Reservation is not active: ${reservation.status}`);
      }

      if (new Date() > reservation.expiresAt) {
        // Mark as expired
        await prisma.creditReservation.update({
          where: { id: reservationId },
          data: { status: CreditReservationStatus.EXPIRED },
        });
        throw createConflictError('Reservation has expired');
      }

      // Get credit account
      const creditAccount = await prisma.creditAccount.findUnique({
        where: { userId },
      });

      if (!creditAccount) {
        throw createNotFoundError(`Credit account not found for user: ${userId}`);
      }

      // Check if actual amount is within reservation
      if (actualAmount > reservation.amount) {
        throw createConflictError('Actual amount exceeds reserved amount');
      }

      // Deduct credits
      const newBalance = (creditAccount.balance || 0) - actualAmount;
      
      await prisma.$transaction([
        // Update credit account
        prisma.creditAccount.update({
          where: { userId },
          data: { balance: newBalance },
        }),
        
        // Create transaction
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: -actualAmount,
            type: 'usage',
            balanceAfter: newBalance,
            description: `Agent execution - Reservation: ${reservationId}`,
            metadata: {
              reservationId,
              usageLogId,
            },
          },
        }),
        
        // Update reservation
        prisma.creditReservation.update({
          where: { id: reservationId },
          data: {
            status: CreditReservationStatus.CHARGED,
            chargedAt: new Date(),
          },
        }),
      ]);

      // Refund any unused credits
      const refundAmount = reservation.amount - actualAmount;
      if (refundAmount > 0) {
        await this.refundCredits(userId, reservationId, `Unused reservation: ${refundAmount} credits`);
      }

      return {
        success: true,
        balanceAfter: newBalance,
      };
    } finally {
      await this.releaseLock(lock);
    }
  }

  /**
   * Refund credits from a reservation
   * @param userId - User ID
   * @param reservationId - Reservation ID
   * @param reason - Refund reason
   * @returns Refund result
   */
  async refundCredits(
    userId: string,
    reservationId: string,
    reason: string
  ): Promise<{ success: boolean }> {
    const lockKey = `credit:lock:${userId}`;
    const lock = await this.acquireLock(lockKey);

    try {
      // Get reservation
      const reservation = await prisma.creditReservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw createNotFoundError(`Reservation not found: ${reservationId}`);
      }

      if (reservation.userId !== userId) {
        throw new Error('Reservation does not belong to user');
      }

      if (reservation.status !== CreditReservationStatus.ACTIVE) {
        throw createConflictError(`Reservation is not active: ${reservation.status}`);
      }

      // Get credit account
      const creditAccount = await prisma.creditAccount.findUnique({
        where: { userId },
      });

      if (!creditAccount) {
        throw createNotFoundError(`Credit account not found for user: ${userId}`);
      }

      // Refund credits
      const newBalance = (creditAccount.balance || 0) + reservation.amount;
      
      await prisma.$transaction([
        // Update credit account
        prisma.creditAccount.update({
          where: { userId },
          data: { balance: newBalance },
        }),
        
        // Create transaction
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: reservation.amount,
            type: 'refund',
            balanceAfter: newBalance,
            description: `Refund: ${reason}`,
            metadata: {
              reservationId,
            },
          },
        }),
        
        // Update reservation
        prisma.creditReservation.update({
          where: { id: reservationId },
          data: {
            status: CreditReservationStatus.REFUNDED,
            refundedAt: new Date(),
          },
        }),
      ]);

      return {
        success: true,
      };
    } finally {
      await this.releaseLock(lock);
    }
  }

  /**
   * Get user's current balance (excluding active reservations)
   * @param userId - User ID
   * @returns Current balance
   */
  async getUserBalance(userId: string): Promise<number> {
    const creditAccount = await prisma.creditAccount.findUnique({
      where: { userId },
    });

    if (!creditAccount) {
      throw createNotFoundError(`Credit account not found for user: ${userId}`);
    }

    return creditAccount.balance || 0;
  }

  /**
   * Get user's available balance (excluding active reservations)
   * @param userId - User ID
   * @returns Available balance
   */
  async getAvailableBalance(userId: string): Promise<number> {
    const currentBalance = await this.getUserBalance(userId);
    
    // Get total active reservations
    const activeReservations = await prisma.creditReservation.aggregate({
      where: {
        userId,
        status: CreditReservationStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      _sum: {
        amount: true,
      },
    });

    const reservedAmount = activeReservations._sum.amount || 0;
    return currentBalance - reservedAmount;
  }

  /**
   * Clean up expired reservations
   * Should be run periodically (e.g., every hour)
   */
  async cleanupExpiredReservations(): Promise<number> {
    const expiredReservations = await prisma.creditReservation.findMany({
      where: {
        status: CreditReservationStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
    });

    let cleanedCount = 0;

    for (const reservation of expiredReservations) {
      try {
        await this.refundCredits(
          reservation.userId,
          reservation.id,
          'Reservation expired'
        );
        cleanedCount++;
      } catch (error) {
        console.error(`Failed to cleanup expired reservation ${reservation.id}:`, error);
      }
    }

    return cleanedCount;
  }

  /**
   * Get user's active reservations
   * @param userId - User ID
   * @returns Active reservations
   */
  async getActiveReservations(userId: string): Promise<CreditReservation[]> {
    return prisma.creditReservation.findMany({
      where: {
        userId,
        status: CreditReservationStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Acquire distributed lock
   * @param key - Lock key
   * @returns Lock object
   */
  private async acquireLock(key: string): Promise<any> {
    const lockValue = `${Date.now()}-${Math.random()}`;
    const ttl = 30; // 30 seconds

    // Try to acquire lock
    const acquired = await redisClient.set(key, lockValue, {
      NX: true,
      EX: ttl,
    });

    if (!acquired) {
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.acquireLock(key);
    }

    return {
      key,
      value: lockValue,
      release: async () => {
        const script = `
          if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
          else
            return 0
          end
        `;
        await redisClient.eval(script, { keys: [key], arguments: [lockValue] });
      },
    };
  }

  /**
   * Release distributed lock
   * @param lock - Lock object
   */
  private async releaseLock(lock: any): Promise<void> {
    await lock.release();
  }
}

// Export singleton instance
export const creditReservationService = new CreditReservationService();

/**
 * Cleanup expired reservations (should be called periodically)
 */
export const cleanupExpiredReservations = async (): Promise<void> => {
  try {
    const cleanedCount = await creditReservationService.cleanupExpiredReservations();
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired credit reservations`);
    }
  } catch (error) {
    console.error('Error cleaning up expired reservations:', error);
  }
};

/**
 * Disconnect Redis client (call this when shutting down the application)
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
  } catch (error) {
    console.error('Error disconnecting Redis from credit reservation service:', error);
  }
};