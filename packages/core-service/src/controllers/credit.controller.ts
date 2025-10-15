import { Request, Response, NextFunction } from 'express';
import { AppError } from '@smart-ai-hub/shared';
import * as creditService from '../services/credit.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import RedisService from '../services/redis.service';
import webhookService from '../services/webhook.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { parsePaginationParams, calculatePagination } from '../utils/pagination';

/**
 * Get user's credit balance
 *
 * @route GET /credits/balance
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getBalance = async (
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

    // Check cache first
    const cacheKey = `credit_balance:${userId}`;
    const cachedBalance = await RedisService.get(cacheKey);
    if (cachedBalance) {
      const balanceData = JSON.parse(cachedBalance);
      successResponse(balanceData, res, 200, req.requestId);
      return;
      return;
    }

    // Get balance from service
    const balance = await creditService.getBalance(userId);

    // Cache the result for 60 seconds
    await RedisService.set(cacheKey, JSON.stringify(balance), 60);

    successResponse(balance, res, 200, req.requestId);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's credit transaction history
 *
 * @route GET /credits/history
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user and query params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getHistory = async (
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

    // Get history from service
    const history = await creditService.getHistory(userId, page, limit);

    paginatedResponse(
      history.data,
      {
        page,
        per_page: limit,
        total: history.total,
        total_pages: Math.ceil(history.total / limit),
      },
      res,
      200,
      req.requestId
    );
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Redeem a promo code for credits
 *
 * @route POST /credits/redeem
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user and promo code in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const redeemPromoCode = async (
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

    // Get promo code from request body
    const { code } = req.body;
    if (!code) {
      return next(new AppError('Promo code is required', 400));
    }

    // Validate code format (basic validation)
    if (typeof code !== 'string' || code.trim().length < 3) {
      return next(new AppError('Invalid promo code format', 400));
    }

    // Redeem promo code
    const result = await creditService.redeemPromo(userId, code.trim());

    // Clear balance cache for this user
    const cacheKey = `credit_balance:${userId}`;
    await RedisService.del(cacheKey);

    // Get updated balance for webhook
    const newBalance = await creditService.getBalance(userId);

    // Trigger webhook for promo redemption
    webhookService
      .triggerCreditPromoRedeemed(userId, code.trim(), result, newBalance)
      .catch((error) => {
        console.error('Failed to trigger credit.promo_redeemed webhook:', error);
      });

    successResponse(
      {
        credits: result,
        message: `Successfully redeemed ${result} credits`,
      },
      res,
      200,
      req.requestId
    );
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Adjust user credits (admin only)
 *
 * @route POST /admin/credits/adjust
 * @access Private (admin only)
 * @param req - Express request object with userId in params and adjustment details in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const adjustCredits = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get userId from request body or params
    const { userId } = req.body;
    if (!userId) {
      return next(new AppError('User ID is required', 400));
    }

    // Get adjustment details from request body
    const { amount, reason } = req.body;
    if (amount === undefined || amount === null) {
      return next(new AppError('Amount is required', 400));
    }
    if (typeof amount !== 'number') {
      return next(new AppError('Amount must be a number', 400));
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return next(new AppError('Reason is required and must be a non-empty string', 400));
    }

    // Adjust credits
    const result = await creditService.adjustCredits(userId, amount, reason.trim());

    // Clear balance cache for this user
    const cacheKey = `credit_balance:${userId}`;
    await RedisService.del(cacheKey);

    // Trigger appropriate webhooks based on adjustment
    if (amount > 0) {
      // Credit added - trigger purchased webhook
      webhookService
        .triggerCreditPurchased(userId, amount, result, {
          transactionId: `admin_${Date.now()}`,
          paymentMethod: 'admin_adjustment',
          paymentId: null,
        })
        .catch((error) => {
          console.error('Failed to trigger credit.purchased webhook:', error);
        });
    }

    // Check if credit is low or depleted
    await webhookService.checkAndTriggerLowCredit(userId, result, 10);
    await webhookService.checkAndTriggerCreditDepleted(userId, result, {
      id: `admin_${Date.now()}`,
      type: 'admin_adjustment',
      amount: amount,
      balanceAfter: result,
      description: reason.trim(),
    });

    successResponse(
      {
        newBalance: result,
        message: 'Credits adjusted successfully',
      },
      res,
      200,
      req.requestId
    );
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Get user credit information (admin only)
 *
 * @route GET /admin/credits/:userId
 * @access Private (admin only)
 * @param req - Express request object with userId in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getUserCredits = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get userId from request params
    const { userId } = req.params;
    if (!userId) {
      return next(new AppError('User ID is required', 400));
    }

    // Get balance and recent transactions
    const [balance, history] = await Promise.all([
      creditService.getBalance(userId),
      creditService.getHistory(userId, 1, 10), // Get 10 most recent transactions
    ]);

    successResponse(
      {
        balance,
        recentTransactions: history.data,
      },
      res,
      200,
      req.requestId
    );
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has sufficient credits for a service
 *
 * @route POST /api/mcp/v1/credits/check
 * @access Public (requires X-User-ID header)
 * @param req - Express request object with userId in header and service/cost in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const checkCredits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get userId from header
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return next(new AppError('X-User-ID header is required', 401));
    }

    // Get service and cost from request body
    const { service, cost } = req.body;
    if (!service) {
      return next(new AppError('Service is required', 400));
    }
    if (cost === undefined || cost === null) {
      return next(new AppError('Cost is required', 400));
    }
    if (typeof cost !== 'number' || cost < 0) {
      return next(new AppError('Cost must be a non-negative number', 400));
    }

    // Check credits
    const result = await creditService.checkCredits(userId, service, cost);

    successResponse(result, res, 200, req.requestId);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Deduct credits from user account with transaction record
 *
 * @route POST /api/mcp/v1/credits/deduct
 * @access Public (requires X-User-ID header)
 * @param req - Express request object with userId in header and service/cost/metadata in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const deductCredits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get userId from header
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return next(new AppError('X-User-ID header is required', 401));
    }

    // Get service, cost, and metadata from request body
    const { service, cost, metadata } = req.body;
    if (!service) {
      return next(new AppError('Service is required', 400));
    }
    if (cost === undefined || cost === null) {
      return next(new AppError('Cost is required', 400));
    }
    if (typeof cost !== 'number' || cost <= 0) {
      return next(new AppError('Cost must be a positive number', 400));
    }

    // Deduct credits
    const result = await creditService.deductCredits(userId, service, cost, metadata);

    // Clear balance cache for this user
    const cacheKey = `credit_balance:${userId}`;
    await RedisService.del(cacheKey);

    // Get transaction details for webhook
    const history = await creditService.getHistory(userId, 1, 1);
    const transactionData = history.data[0];

    // Check if credit is low or depleted and trigger appropriate webhooks
    await webhookService.checkAndTriggerLowCredit(userId, result.new_balance, 10);
    await webhookService.checkAndTriggerCreditDepleted(userId, result.new_balance, transactionData);

    successResponse(result, res, 200, req.requestId);
    return;
  } catch (error) {
    // Handle specific error for insufficient credits
    if (error instanceof Error && error.message === 'Insufficient credits') {
      return next(new AppError('Insufficient credits', 402));
    }
    next(error);
  }
};
