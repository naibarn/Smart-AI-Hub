// src/controllers/credit.controller.js
const Credit = require('../models/Credit');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const creditController = {
  /**
   * Get Credit Balance - ดูยอด credit ปัจจุบัน
   */
  async getBalance(req, res, next) {
    try {
      const userId = req.user.id;

      const account = await Credit.getAccount(userId);

      if (!account) {
        return errorResponse(res, 404, 'ACCOUNT_NOT_FOUND', 'Credit account not found', null, req.requestId);
      }

      // Get credit statistics for more detailed information
      const stats = await Credit.getCreditStats(userId);

      return successResponse({
        balance: account.balance,
        totalPurchased: stats?.totalPurchased || 0,
        totalUsed: stats?.totalUsed || 0,
        totalRefunded: stats?.totalRefunded || 0,
        transactionCount: stats?.transactionCount || 0
      }, res, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Purchase Credits - ซื้อ credits
   */
  async purchaseCredits(req, res, next) {
    try {
      const userId = req.user.id;
      const { amount, payment_method = 'credit_card' } = req.body;

      // TODO: ในการใช้งานจริง ต้องเชื่อมต่อกับ Payment Gateway
      // เช่น Stripe, Omise, PayPal เป็นต้น

      const description = `Purchased ${amount} credits via ${payment_method}`;

      const result = await Credit.addCredits(userId, amount, 'purchase', description);

      return successResponse({
        account: result.account,
        transaction: result.transaction
      }, res, 200, req.requestId, `Successfully purchased ${amount} credits`);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Use Credits - ใช้ credits
   */
  async useCredits(req, res, next) {
    try {
      const userId = req.user.id;
      const { amount, description } = req.body;

      const result = await Credit.useCredits(userId, amount, description);

      return successResponse({
        account: result.account,
        transaction: result.transaction
      }, res, 200, req.requestId, `Successfully used ${amount} credits`);
    } catch (error) {
      if (error.message === 'Insufficient credits') {
        return errorResponse(res, 400, 'INSUFFICIENT_CREDITS', 'Insufficient credits', null, req.requestId);
      }
      next(error);
    }
  },

  /**
   * Get Transaction History - ดูประวัติการทำธุรกรรม
   */
  async getTransactions(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, per_page = 20 } = req.query;
      const pageNum = parseInt(page);
      const perPageNum = parseInt(per_page);

      // Get total count for pagination
      const totalCount = await Credit.getTransactionCount(userId);
      
      // Calculate pagination
      const skip = (pageNum - 1) * perPageNum;
      const totalPages = Math.ceil(totalCount / perPageNum);

      // Get paginated transactions
      const transactions = await Credit.getTransactionsPaginated(userId, skip, perPageNum);

      return paginatedResponse(
        transactions,
        pageNum,
        perPageNum,
        totalCount,
        totalPages,
        res,
        req.requestId
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Account with Transactions - ดูข้อมูลบัญชีพร้อมประวัติการทำธุรกรรม
   */
  async getAccountWithTransactions(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 50 } = req.query;

      const account = await Credit.getAccountWithTransactions(userId, parseInt(limit));

      if (!account) {
        return errorResponse(res, 404, 'ACCOUNT_NOT_FOUND', 'Credit account not found', null, req.requestId);
      }

      return successResponse({ account }, res, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add Bonus Credits - เพิ่ม credits แบบโบนัส (admin only)
   */
  async addBonusCredits(req, res, next) {
    try {
      const { user_id, amount, description = 'Bonus credits from admin' } = req.body;

      if (!user_id || !amount) {
        return errorResponse(res, 400, 'INVALID_INPUT', 'user_id and amount are required', null, req.requestId);
      }

      const result = await Credit.addCredits(user_id, amount, 'admin_adjustment', description);

      return successResponse({
        account: result.account,
        transaction: result.transaction
      }, res, 200, req.requestId, `Successfully added ${amount} bonus credits to user ${user_id}`);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update User Balance - อัปเดตยอดเงินโดยตรง (admin only)
   */
  async updateBalance(req, res, next) {
    try {
      const { user_id, new_balance, description = 'Admin balance adjustment' } = req.body;

      if (!user_id || new_balance === undefined) {
        return errorResponse(res, 400, 'INVALID_INPUT', 'user_id and new_balance are required', null, req.requestId);
      }

      const result = await Credit.updateBalance(user_id, new_balance, description);

      return successResponse({
        account: result.account,
        transaction: result.transaction
      }, res, 200, req.requestId, `Successfully updated balance to ${new_balance} for user ${user_id}`);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Credit Statistics - ดูสถิติการใช้งาน credits
   */
  async getCreditStats(req, res, next) {
    try {
      const userId = req.params.id || req.user.id;

      const stats = await Credit.getCreditStats(userId);

      if (!stats) {
        return errorResponse(res, 404, 'ACCOUNT_NOT_FOUND', 'Credit account not found', null, req.requestId);
      }

      return successResponse({ stats }, res, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = creditController;