import { Router } from 'express';
import { authenticateJWT } from '@smart-ai-hub/shared';
import { requirePermission, requireRoles } from '../middlewares/rbac.middleware';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

/**
 * @route   POST /payments/checkout-session
 * @desc    Create a Stripe checkout session for credit purchase
 * @access  Private (JWT required)
 */
router.post(
  '/checkout-session',
  authenticateJWT,
  requirePermission('credits', 'write'),
  paymentController.createCheckoutSession
);

/**
 * @route   GET /payments/history
 * @desc    Get payment history for the authenticated user
 * @access  Private (JWT required)
 */
router.get(
  '/history',
  authenticateJWT,
  requirePermission('credits', 'read'),
  paymentController.getPaymentHistory
);

/**
 * @route   GET /payments/packages
 * @desc    Get available credit packages
 * @access  Public
 */
router.get('/packages', paymentController.getCreditPackages);

/**
 * @route   POST /payments/webhook
 * @desc    Handle Stripe webhooks for payment events
 * @access  Public (verified by Stripe signature)
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * @route   POST /payments/stripe-webhook
 * @desc    Handle Stripe webhooks for payment events (dedicated endpoint)
 * @access  Public (verified by Stripe signature)
 */
router.post('/stripe-webhook', paymentController.handleStripeWebhook);

/**
 * @route   GET /payments/success
 * @desc    Handle successful payment redirect
 * @access  Public
 */
router.get('/success', paymentController.handleSuccess);

/**
 * @route   GET /payments/cancel
 * @desc    Handle canceled payment redirect
 * @access  Public
 */
router.get('/cancel', paymentController.handleCancel);

export default router;
