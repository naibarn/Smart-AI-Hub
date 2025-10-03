// src/routes/credit.routes.js
const express = require('express');
const router = express.Router();
const creditController = require('../controllers/credit.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateCreditPurchase, validateCreditUsage } = require('../middleware/validation');

/**
 * @route   GET /api/credits/balance
 * @desc    ดูยอด credit ปัจจุบัน
 * @access  Private
 */
router.get('/balance', authenticate, creditController.getBalance);

/**
 * @route   POST /api/credits/purchase
 * @desc    ซื้อ credits
 * @access  Private
 */
router.post('/purchase', authenticate, validateCreditPurchase, creditController.purchaseCredits);

/**
 * @route   POST /api/credits/use
 * @desc    ใช้ credits
 * @access  Private
 */
router.post('/use', authenticate, validateCreditUsage, creditController.useCredits);

/**
 * @route   GET /api/credits/transactions
 * @desc    ดูประวัติการทำธุรกรรม
 * @access  Private
 */
router.get('/transactions', authenticate, creditController.getTransactions);

/**
 * @route   POST /api/credits/bonus
 * @desc    เพิ่ม credits แบบโบนัส (admin only)
 * @access  Private (Admin only)
 */
router.post('/bonus', authenticate, authorize('admin', 'super_admin'), creditController.addBonusCredits);

module.exports = router;