// src/models/Credit.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const Credit = {
  /**
   * สร้าง Credit Account สำหรับ User ใหม่
   */
  async createAccount(user_id) {
    const account = await prisma.creditAccount.create({
      data: {
        userId: user_id,
        balance: 1, // Start with 1 credit
      }
    });

    return account;
  },

  /**
   * ดึงข้อมูล Credit Account
   */
  async getAccount(user_id) {
    const account = await prisma.creditAccount.findUnique({
      where: { userId: user_id }
    });
    
    return account;
  },

  /**
   * เพิ่ม Credit (ซื้อ/ได้รับ)
   */
  async addCredits(user_id, amount, type = 'purchase', description = null) {
    const result = await prisma.$transaction(async (tx) => {
      // Get current account
      const account = await tx.creditAccount.findUnique({
        where: { userId: user_id }
      });

      if (!account) {
        throw new Error('Credit account not found');
      }

      // Update balance
      const updatedAccount = await tx.creditAccount.update({
        where: { userId: user_id },
        data: {
          balance: account.balance + amount
        }
      });

      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          creditAccountId: account.id,
          type,
          amount,
          balanceAfter: updatedAccount.balance,
          description
        }
      });

      return {
        account: updatedAccount,
        transaction
      };
    });

    return result;
  },

  /**
   * ใช้ Credit
   */
  async useCredits(user_id, amount, description = null) {
    const result = await prisma.$transaction(async (tx) => {
      // Get current account
      const account = await tx.creditAccount.findUnique({
        where: { userId: user_id }
      });

      if (!account) {
        throw new Error('Credit account not found');
      }

      if (account.balance < amount) {
        throw new Error('Insufficient credits');
      }

      // Update balance
      const updatedAccount = await tx.creditAccount.update({
        where: { userId: user_id },
        data: {
          balance: account.balance - amount
        }
      });

      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          creditAccountId: account.id,
          type: 'usage',
          amount,
          balanceAfter: updatedAccount.balance,
          description
        }
      });

      return {
        account: updatedAccount,
        transaction
      };
    });

    return result;
  },

  /**
   * ดึงประวัติ transactions
   */
  async getTransactions(user_id, limit = 50) {
    const account = await prisma.creditAccount.findUnique({
      where: { userId: user_id }
    });

    if (!account) {
      return [];
    }

    const transactions = await prisma.creditTransaction.findMany({
      where: { creditAccountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    return transactions;
  },

  /**
   * Get transaction count for pagination
   */
  async getTransactionCount(user_id) {
    const account = await prisma.creditAccount.findUnique({
      where: { userId: user_id }
    });

    if (!account) {
      return 0;
    }

    const count = await prisma.creditTransaction.count({
      where: { creditAccountId: account.id }
    });
    
    return count;
  },

  /**
   * Get paginated transactions
   */
  async getTransactionsPaginated(user_id, skip = 0, take = 20) {
    const account = await prisma.creditAccount.findUnique({
      where: { userId: user_id }
    });

    if (!account) {
      return [];
    }

    const transactions = await prisma.creditTransaction.findMany({
      where: { creditAccountId: account.id },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: take
    });
    
    return transactions;
  },

  /**
   * Get account with transactions
   */
  async getAccountWithTransactions(user_id, limit = 50) {
    const account = await prisma.creditAccount.findUnique({
      where: { userId: user_id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: limit
        }
      }
    });

    return account;
  },

  /**
   * Update account balance directly (for admin adjustments)
   */
  async updateBalance(user_id, newBalance, description = 'Admin adjustment') {
    const result = await prisma.$transaction(async (tx) => {
      // Get current account
      const account = await tx.creditAccount.findUnique({
        where: { userId: user_id }
      });

      if (!account) {
        throw new Error('Credit account not found');
      }

      const difference = newBalance - account.balance;

      // Update balance
      const updatedAccount = await tx.creditAccount.update({
        where: { userId: user_id },
        data: {
          balance: newBalance
        }
      });

      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          creditAccountId: account.id,
          type: 'admin_adjustment',
          amount: difference,
          balanceAfter: updatedAccount.balance,
          description
        }
      });

      return {
        account: updatedAccount,
        transaction
      };
    });

    return result;
  },

  /**
   * Get credit statistics for a user
   */
  async getCreditStats(user_id) {
    const account = await prisma.creditAccount.findUnique({
      where: { userId: user_id },
      include: {
        transactions: {
          select: {
            type: true,
            amount: true,
            createdAt: true
          }
        }
      }
    });

    if (!account) {
      return null;
    }

    const purchases = account.transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0);

    const usage = account.transactions
      .filter(t => t.type === 'usage')
      .reduce((sum, t) => sum + t.amount, 0);

    const refunds = account.transactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      currentBalance: account.balance,
      totalPurchased: purchases,
      totalUsed: usage,
      totalRefunded: refunds,
      transactionCount: account.transactions.length
    };
  },

  /**
   * Create credit account with initial balance
   */
  async createAccountWithBalance(user_id, initialBalance = 0) {
    const account = await prisma.creditAccount.create({
      data: {
        userId: user_id,
        balance: initialBalance,
      }
    });

    // If initial balance > 0, create a transaction record
    if (initialBalance > 0) {
      await prisma.creditTransaction.create({
        data: {
          creditAccountId: account.id,
          type: 'purchase',
          amount: initialBalance,
          balanceAfter: initialBalance,
          description: 'Initial credit allocation'
        }
      });
    }

    return account;
  }
};

module.exports = Credit;