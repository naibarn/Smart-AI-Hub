// External imports
import { Request, Response, NextFunction } from 'express';

// Shared imports
import { CreateCheckoutSessionRequest, CreateCheckoutSessionResponse } from '@shared/types/payment';

// Local imports
import { AppError } from '@smart-ai-hub/shared';
import { AuthenticatedRequest } from '@smart-ai-hub/shared';
import * as paymentService from '../services/payment.service';
import { CreditPackageId } from '../config/stripe.config';

/**
 * Create a Stripe checkout session for credit purchase
 *
 * @route POST /api/payments/create-checkout-session
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user and package details
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const createCheckoutSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get userId from authenticated user
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User ID is required', 400));
    }

    // Get request body with type safety
    const { packageId, quantity } = req.body as CreateCheckoutSessionRequest;
    
    // Basic validation
    if (!packageId) {
      return next(new AppError('Package ID is required', 400));
    }

    if (!quantity || quantity < 1) {
      return next(new AppError('Quantity must be at least 1', 400));
    }

    // Validate package ID
    if (!['starter', 'pro', 'business'].includes(packageId)) {
      return next(new AppError('Invalid package ID', 400));
    }

    // Create checkout session
    const session = await paymentService.createStripeCheckoutSession(userId, packageId as CreditPackageId);

    const response: CreateCheckoutSessionResponse = {
      sessionId: session.id,
      url: session.url || '',
    };

    res.status(200).json({
      data: response,
      meta: null,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle successful payment redirect
 *
 * @route GET /api/payments/success
 * @access Public
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const handleSuccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'BAD_REQUEST',
          message: 'Session ID is required',
        },
      });
      return;
    }

    // In a real application, you might want to verify the session
    // and show a more detailed success page
    res.status(200).send(`
      <html>
        <head><title>Payment Successful</title></head>
        <body>
          <h1>Payment Successful!</h1>
          <p>Your credits have been added to your account.</p>
          <p>Session ID: ${session_id}</p>
          <p>You can now close this window and return to the application.</p>
        </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle canceled payment redirect
 *
 * @route GET /api/payments/cancel
 * @access Public
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const handleCancel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({
      data: {
        message: 'Payment canceled',
        description: 'Your payment was canceled. No charges were made.',
      },
      meta: null,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Stripe webhooks for payment events
 *
 * @route POST /api/payments/webhook
 * @access Public (verified by Stripe signature)
 * @param req - Express request object with Stripe webhook payload
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
/**
 * Handle Stripe webhooks for payment events (consolidated endpoint)
 *
 * @route POST /api/payments/webhook
 * @access Public (verified by Stripe signature)
 * @param req - Express request object with Stripe webhook payload
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'BAD_REQUEST',
          message: 'Stripe signature is required',
        },
      });
      return;
    }

    // Process webhook using the consolidated service function
    await paymentService.processStripeWebhook(req.body, sig);
    
    res.status(200).json({
      data: { received: true },
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    if (error instanceof Error && error.message.includes('signature verification failed')) {
      res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'WEBHOOK_ERROR',
          message: `Webhook Error: ${error.message}`,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * Handle Stripe webhooks for payment events (dedicated endpoint - deprecated)
 *
 * @route POST /api/payments/stripe-webhook
 * @access Public (verified by Stripe signature)
 * @param req - Express request object with Stripe webhook payload
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const handleStripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'BAD_REQUEST',
          message: 'Stripe signature is required',
        },
      });
      return;
    }

    // Get raw body for signature verification
    const rawBody = req.body;
    
    // Process webhook using the consolidated service function
    await paymentService.processStripeWebhook(rawBody, sig);
    
    res.status(200).json({
      data: { received: true },
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    if (error instanceof Error && error.message.includes('signature verification failed')) {
      res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'WEBHOOK_ERROR',
          message: `Webhook Error: ${error.message}`,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * Get payment history for the authenticated user
 *
 * @route GET /api/payments/history
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user and pagination params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getPaymentHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Get pagination parameters with defaults
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Validate pagination parameters
    if (page < 1) {
      return next(new AppError('Page must be a positive integer', 400));
    }
    if (limit < 1 || limit > 100) {
      return next(new AppError('Limit must be between 1 and 100', 400));
    }

    // Get payment history from service
    const history = await paymentService.getPaymentHistory(userId, page, limit);

    res.status(200).json({
      data: history.data,
      meta: {
        pagination: {
          page,
          limit,
          total: history.total,
          totalPages: Math.ceil(history.total / limit),
        },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available credit packages
 *
 * @route GET /api/payments/packages
 * @access Public
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getCreditPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { creditPackages } = await import('../config/stripe.config');
    
    // Transform packages for client response
    const packages = Object.entries(creditPackages).map(([key, pkg]) => ({
      id: key,
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price,
      priceInDollars: (pkg.price / 100).toFixed(2),
    }));

    res.status(200).json({
      data: packages,
      meta: null,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};