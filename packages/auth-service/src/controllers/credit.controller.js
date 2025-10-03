// src/controllers/credit.controller.js
const Credit = require('../models/Credit');

const creditController = {
  /**
   * Get Credit Balance - ดูยอด credit ปัจจุบัน
   */
  async getBalance(req, res, next) {
    try {
      const userId = req.user.id;

      const account = await Credit.getAccount(userId);

      if (!account) {
        return res.status(404).json({
          success: false,
          error: { message: 'Credit account not found' }
        });
      }

      res.json({
        success: true,
        data: { 
          balance: account.balance,
          total_earned: account.total_earned,
          total_spent: account.total_spent
        }
      });
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

      res.json({
        success: true,
        data: {
          account: result.account,
          transaction: result.transaction
        },
        message: `Successfully purchased ${amount} credits`
      });
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

      res.json({
        success: true,
        data: {
          account: result.account,
          transaction: result.transaction
        },
        message: `Successfully used ${amount} credits`
      });
    } catch (error) {
      if (error.message === 'Insufficient credits') {
        return res.status(400).json({
          success: false,
          error: { message: 'Insufficient credits' }
        });
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
      const { limit = 50 } = req.query;

      const transactions = await Credit.getTransactions(userId, parseInt(limit));

      res.json({
        success: true,
        data: { 
          transactions,
          count: transactions.length
        }
      });
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
        return res.status(400).json({
          success: false,
          error: { message: 'user_id and amount are required' }
        });
      }

      const result = await Credit.addCredits(user_id, amount, 'bonus', description);

      res.json({
        success: true,
        data: {
          account: result.account,
          transaction: result.transaction
        },
        message: `Successfully added ${amount} bonus credits to user ${user_id}`
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = creditController;