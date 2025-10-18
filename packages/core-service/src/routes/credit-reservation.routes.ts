import { Router } from 'express';
import {
  reserveCredits,
  chargeCredits,
  refundCredits,
  getBalance,
  getAvailableBalance,
  getActiveReservations,
  cleanupExpiredReservations,
} from '../controllers/credit-reservation.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/rbac.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * @route POST /api/credits/reserve
 * @desc Reserve credits for a user
 * @access Private
 */
router.post('/reserve', reserveCredits);

/**
 * @route POST /api/credits/charge
 * @desc Charge credits from a reservation
 * @access Private
 */
router.post('/charge', chargeCredits);

/**
 * @route POST /api/credits/refund
 * @desc Refund credits from a reservation
 * @access Private
 */
router.post('/refund', refundCredits);

/**
 * @route GET /api/credits/balance
 * @desc Get user's current balance
 * @access Private
 */
router.get('/balance', getBalance);

/**
 * @route GET /api/credits/available-balance
 * @desc Get user's available balance (excluding active reservations)
 * @access Private
 */
router.get('/available-balance', getAvailableBalance);

/**
 * @route GET /api/credits/reservations
 * @desc Get user's active reservations
 * @access Private
 */
router.get('/reservations', getActiveReservations);

/**
 * @route POST /api/credits/cleanup-expired
 * @desc Clean up expired reservations
 * @access Admin only
 */
router.post('/cleanup-expired',
  requireRoles(['administrator']),
  cleanupExpiredReservations
);

export default router;