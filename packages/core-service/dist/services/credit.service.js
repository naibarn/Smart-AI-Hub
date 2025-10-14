"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.deductCredits = exports.checkCredits = exports.adjustCredits = exports.redeemPromo = exports.getHistory = exports.getBalance = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("redis");
// Custom error class for this service
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}
const prisma = new client_1.PrismaClient();
// Redis client for caching
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
// Connect to Redis
const connectRedis = async () => {
    try {
        await redisClient.connect();
    }
    catch (error) {
        console.error('Failed to connect to Redis for credit service:', error);
    }
};
// Initialize Redis connection
connectRedis();
/**
 * Get user's current credit balance
 */
const getBalance = async (userId) => {
    try {
        // Query credit_accounts table
        const creditAccount = await prisma.creditAccount.findUnique({
            where: { userId },
        });
        // Throw NotFoundError if no account exists
        if (!creditAccount) {
            throw new NotFoundError(`Credit account not found for user: ${userId}`);
        }
        // Return balance
        return creditAccount.currentBalance;
    }
    catch (error) {
        console.error('Error getting credit balance:', error);
        throw error;
    }
};
exports.getBalance = getBalance;
/**
 * Get user's credit transaction history
 */
const getHistory = async (userId, page, limit) => {
    try {
        const skip = (page - 1) * limit;
        // Get total count for pagination
        const total = await prisma.creditTransaction.count({
            where: { userId },
        });
        // Get transactions with pagination, ordered by createdAt DESC
        const transactions = await prisma.creditTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });
        return {
            data: transactions,
            total,
        };
    }
    catch (error) {
        console.error('Error getting credit history:', error);
        throw new Error('Failed to get credit history');
    }
};
exports.getHistory = getHistory;
/**
 * Redeem a promo code for credits
 */
const redeemPromo = async (userId, code) => {
    try {
        // Query promo_codes table
        const promoCode = await prisma.promoCode.findUnique({
            where: { code: code.toUpperCase() },
        });
        // Validate: exists, active, not expired, not used by user
        if (!promoCode) {
            throw new Error('Promo code not found');
        }
        if (!promoCode.isActive) {
            throw new Error('Promo code is not active');
        }
        if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
            throw new Error('Promo code has expired');
        }
        // Check if user has already used this promo code
        const existingUsage = await prisma.promoCodeUsage.findUnique({
            where: {
                userId_promoCodeId: {
                    userId,
                    promoCodeId: promoCode.id,
                },
            },
        });
        if (existingUsage) {
            throw new Error('You have already used this promo code');
        }
        // Check maxUses if set
        if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
            throw new Error('Promo code has reached maximum uses');
        }
        // Create transaction in atomic operation
        const result = await prisma.$transaction(async (tx) => {
            // Get or create credit account
            let creditAccount = await tx.creditAccount.findUnique({
                where: { userId },
            });
            if (!creditAccount) {
                creditAccount = await tx.creditAccount.create({
                    data: {
                        userId,
                        currentBalance: promoCode.credits,
                        totalPurchased: promoCode.credits,
                    },
                });
            }
            else {
                // Update credit account balance
                creditAccount = await tx.creditAccount.update({
                    where: { userId },
                    data: {
                        currentBalance: creditAccount.currentBalance + promoCode.credits,
                        totalPurchased: creditAccount.totalPurchased + promoCode.credits,
                    },
                });
            }
            // Create credit transaction
            await tx.creditTransaction.create({
                data: {
                    userId,
                    amount: promoCode.credits,
                    type: 'promo',
                    balanceAfter: creditAccount.currentBalance,
                    description: `Redeemed promo code: ${promoCode.code}`,
                },
            });
            // Record promo code usage
            await tx.promoCodeUsage.create({
                data: {
                    userId,
                    promoCodeId: promoCode.id,
                },
            });
            // Update promo usedCount
            await tx.promoCode.update({
                where: { id: promoCode.id },
                data: { usedCount: { increment: 1 } },
            });
            return promoCode.credits;
        });
        return result;
    }
    catch (error) {
        console.error('Error redeeming promo code:', error);
        throw error;
    }
};
exports.redeemPromo = redeemPromo;
/**
 * Adjust user credits (admin only)
 */
const adjustCredits = async (userId, amount, reason) => {
    try {
        if (!reason || reason.trim().length === 0) {
            throw new Error('Reason is required for credit adjustment');
        }
        // Use Prisma transaction for atomic operation
        const newBalance = await prisma.$transaction(async (tx) => {
            // Get or create credit account
            let creditAccount = await tx.creditAccount.findUnique({
                where: { userId },
            });
            if (!creditAccount) {
                creditAccount = await tx.creditAccount.create({
                    data: {
                        userId,
                        currentBalance: amount,
                        totalPurchased: amount > 0 ? amount : 0,
                        totalUsed: amount < 0 ? Math.abs(amount) : 0,
                    },
                });
            }
            else {
                // Update credit account balance
                creditAccount = await tx.creditAccount.update({
                    where: { userId },
                    data: {
                        currentBalance: creditAccount.currentBalance + amount,
                        totalPurchased: amount > 0 ? creditAccount.totalPurchased + amount : creditAccount.totalPurchased,
                        totalUsed: amount < 0 ? creditAccount.totalUsed + Math.abs(amount) : creditAccount.totalUsed,
                    },
                });
            }
            // Create transaction record
            await tx.creditTransaction.create({
                data: {
                    userId,
                    amount,
                    type: 'admin_adjustment',
                    balanceAfter: creditAccount.currentBalance,
                    description: `Admin adjustment: ${reason}`,
                },
            });
            return creditAccount.currentBalance;
        });
        return newBalance;
    }
    catch (error) {
        console.error('Error adjusting credits:', error);
        throw error;
    }
};
exports.adjustCredits = adjustCredits;
/**
 * Check if user has sufficient credits for a service
 */
const checkCredits = async (userId, service, cost) => {
    try {
        // Get current balance
        const balance = await (0, exports.getBalance)(userId);
        // Check if balance is sufficient
        const sufficient = balance >= cost;
        return {
            sufficient,
            balance,
        };
    }
    catch (error) {
        console.error('Error checking credits:', error);
        throw error;
    }
};
exports.checkCredits = checkCredits;
/**
 * Deduct credits from user account with transaction record
 */
const deductCredits = async (userId, service, cost, metadata) => {
    try {
        if (!service || typeof service !== 'string') {
            throw new Error('Service is required and must be a string');
        }
        if (typeof cost !== 'number' || cost <= 0) {
            throw new Error('Cost must be a positive number');
        }
        // Use Prisma transaction for atomic operation
        const result = await prisma.$transaction(async (tx) => {
            // Get credit account
            const creditAccount = await tx.creditAccount.findUnique({
                where: { userId },
            });
            if (!creditAccount) {
                throw new Error(`Credit account not found for user: ${userId}`);
            }
            // Check sufficient balance
            if (creditAccount.currentBalance < cost) {
                throw new Error('Insufficient credits');
            }
            // Update credit account balance
            const updatedAccount = await tx.creditAccount.update({
                where: { userId },
                data: {
                    currentBalance: creditAccount.currentBalance - cost,
                    totalUsed: creditAccount.totalUsed + cost,
                },
            });
            // Create transaction record with unique ID
            const transaction = await tx.creditTransaction.create({
                data: {
                    userId,
                    amount: -cost, // Negative for deduction
                    type: 'usage',
                    balanceAfter: updatedAccount.currentBalance,
                    description: `Service usage: ${service}`,
                    metadata: metadata || {},
                },
            });
            return {
                new_balance: updatedAccount.currentBalance,
                transaction_id: transaction.id,
            };
        });
        return {
            status: 'ok',
            ...result,
        };
    }
    catch (error) {
        console.error('Error deducting credits:', error);
        throw error;
    }
};
exports.deductCredits = deductCredits;
/**
 * Disconnect Redis client (call this when shutting down the application)
 */
const disconnectRedis = async () => {
    try {
        await redisClient.quit();
    }
    catch (error) {
        console.error('Error disconnecting Redis from credit service:', error);
    }
};
exports.disconnectRedis = disconnectRedis;
//# sourceMappingURL=credit.service.js.map