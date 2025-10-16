import { Request, Response, NextFunction } from 'express';
import { AppError } from '@smart-ai-hub/shared';
import * as pointService from '../services/point.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import RedisService from '../services/redis.service';
import webhookService from '../services/webhook.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { parsePaginationParams, calculatePagination } from '../utils/pagination';

/**
 * Get user's point balance
 *
 * @route GET /points/balance
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
    const cacheKey = `point_balance:${userId}`;
    const cachedBalance = await RedisService.get(cacheKey);
    if (cachedBalance) {
      const balanceData = JSON.parse(cachedBalance);
      successResponse(balanceData, res, 200, req.requestId);
      return;
    }

    // Get balance from service
    const balance = await pointService.getBalance(userId);

    // Cache the result for 60 seconds
    await RedisService.set(cacheKey, JSON.stringify(balance), 60);

    successResponse(balance, res, 200, req.requestId);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's point transaction history
 *
 * @route GET /points/history
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
    const history = await pointService.getHistory(userId, page, limit);

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
 * Exchange Credits to Points (manual)
 *
 * @route POST /points/exchange-from-credits
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user and exchange details in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const exchangeCreditsToPoints = async (
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

    // Get exchange details from request body
    const { creditAmount } = req.body;
    if (!creditAmount) {
      return next(new AppError('Credit amount is required', 400));
    }
    if (typeof creditAmount !== 'number' || creditAmount <= 0) {
      return next(new AppError('Credit amount must be a positive number', 400));
    }

    // Exchange credits to points
    const result = await pointService.exchangeCreditsToPoints(userId, creditAmount);

    // Clear balance cache for this user
    const cacheKey = `point_balance:${userId}`;
    await RedisService.del(cacheKey);

    // TODO: Implement webhook for credit exchange
    // webhookService
    //   .triggerCreditToPointsExchange(userId, creditAmount, result.pointsReceived, result.newPointBalance)
    //   .catch((error: any) => {
    //     console.error('Failed to trigger credit.to_points_exchange webhook:', error);
    //   });

    successResponse(
      {
        newCreditBalance: result.newCreditBalance,
        newPointBalance: result.newPointBalance,
        pointsReceived: result.pointsReceived,
        message: `Successfully exchanged ${creditAmount} credits for ${result.pointsReceived} points`,
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
 * Purchase Points with real money
 *
 * @route POST /points/purchase
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user and purchase details in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const purchasePoints = async (
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

    // Get purchase details from request body
    const { pointsAmount, paymentDetails } = req.body;
    if (!pointsAmount) {
      return next(new AppError('Points amount is required', 400));
    }
    if (typeof pointsAmount !== 'number' || pointsAmount <= 0) {
      return next(new AppError('Points amount must be a positive number', 400));
    }
    if (!paymentDetails || !paymentDetails.stripeSessionId) {
      return next(new AppError('Payment details are required', 400));
    }

    // Purchase points
    const result = await pointService.purchasePoints(userId, pointsAmount, paymentDetails);

    // Clear balance cache for this user
    const cacheKey = `point_balance:${userId}`;
    await RedisService.del(cacheKey);

    // TODO: Implement webhook for point purchase
    // webhookService
    //   .triggerPointPurchased(userId, pointsAmount, result.new_balance, paymentDetails)
    //   .catch((error: any) => {
    //     console.error('Failed to trigger point.purchased webhook:', error);
    //   });

    successResponse(
      {
        newBalance: result.new_balance,
        transactionId: result.transaction_id,
        message: `Successfully purchased ${pointsAmount} points`,
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
 * Deduct Points (internal, checks auto top-up first)
 *
 * @route POST /points/deduct
 * @access Public (requires X-User-ID header)
 * @param req - Express request object with userId in header and deduction details in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const deductPoints = async (
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

    // Get deduction details from request body
    const { amount, description, metadata } = req.body;
    if (!amount) {
      return next(new AppError('Amount is required', 400));
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return next(new AppError('Amount must be a positive number', 400));
    }

    // Deduct points
    const result = await pointService.deductPoints(userId, amount, description, metadata);

    // Clear balance cache for this user
    const cacheKey = `point_balance:${userId}`;
    await RedisService.del(cacheKey);

    // TODO: Implement webhook for point usage
    // webhookService
    //   .triggerPointUsed(userId, amount, result.new_balance, description, metadata)
    //   .catch((error: any) => {
    //     console.error('Failed to trigger point.used webhook:', error);
    //   });

    // If auto top-up was triggered, send additional notification
    if (result.autoTopupTriggered) {
      // TODO: Implement webhook for auto top-up
      // webhookService
      //   .triggerAutoTopupTriggered(userId)
      //   .catch((error: any) => {
      //     console.error('Failed to trigger auto_topup.triggered webhook:', error);
      //   });
    }

    successResponse(result, res, 200, req.requestId);
    return;
  } catch (error) {
    // Handle specific error for insufficient points
    if (error instanceof Error && error.message === 'Insufficient points') {
      return next(new AppError('Insufficient points', 402));
    }
    next(error);
  }
};

/**
 * Claim daily login reward
 *
 * @route POST /points/claim-daily-reward
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const claimDailyReward = async (
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

    // Claim daily reward
    const result = await pointService.claimDailyReward(userId);

    // Clear balance cache for this user
    const cacheKey = `point_balance:${userId}`;
    await RedisService.del(cacheKey);

    // TODO: Implement webhook for daily reward
    // webhookService
    //   .triggerDailyRewardClaimed(userId, result.points)
    //   .catch((error: any) => {
    //     console.error('Failed to trigger daily_reward.claimed webhook:', error);
    //   });

    successResponse(result, res, 200, req.requestId);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Check daily reward status
 *
 * @route GET /points/daily-reward-status
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getDailyRewardStatus = async (
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

    // Get daily reward status
    const status = await pointService.getDailyRewardStatus(userId);

    successResponse(status, res, 200, req.requestId);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Get both Credits and Points balance
 *
 * @route GET /wallet/balance
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getWalletBalance = async (
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

    // Get both balances
    const [creditBalance, pointBalance] = await Promise.all([
      import('../services/credit.service').then(m => m.getBalance(userId)),
      pointService.getBalance(userId),
    ]);

    successResponse(
      {
        credits: creditBalance,
        points: pointBalance,
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
 * Adjust user points (admin only)
 *
 * @route POST /admin/points/adjust
 * @access Private (admin only)
 * @param req - Express request object with userId in params and adjustment details in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const adjustPoints = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get userId from request body
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

    // Adjust points
    const result = await pointService.adjustPoints(userId, amount, reason.trim());

    // Clear balance cache for this user
    const cacheKey = `point_balance:${userId}`;
    await RedisService.del(cacheKey);

    // TODO: Implement webhook for point adjustment
    // webhookService
    //   .triggerPointAdjusted(userId, amount, result, reason.trim())
    //   .catch((error: any) => {
    //     console.error('Failed to trigger point.adjusted webhook:', error);
    //   });

    successResponse(
      {
        newBalance: result,
        message: 'Points adjusted successfully',
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
 * View all exchange rates (admin only)
 *
 * @route GET /admin/exchange-rates
 * @access Private (admin only)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getExchangeRates = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get exchange rates
    const rates = await pointService.getExchangeRates();

    successResponse(rates, res, 200, req.requestId);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Update exchange rate (admin only)
 *
 * @route PUT /admin/exchange-rates/:name
 * @access Private (admin only)
 * @param req - Express request object with rate name in params and update details in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const updateExchangeRate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get rate name from request params
    const { name } = req.params;
    if (!name) {
      return next(new AppError('Rate name is required', 400));
    }

    // Get update details from request body
    const { rate, description } = req.body;
    if (rate === undefined || rate === null) {
      return next(new AppError('Rate is required', 400));
    }
    if (typeof rate !== 'number' || rate <= 0) {
      return next(new AppError('Rate must be a positive number', 400));
    }

    // Update exchange rate
    const updatedRate = await pointService.updateExchangeRate(name, rate, description);

    successResponse(
      {
        rate: updatedRate,
        message: 'Exchange rate updated successfully',
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
 * Get Points statistics (admin only)
 *
 * @route GET /admin/points/stats
 * @access Private (admin only)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getPointsStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get points statistics
    const stats = await pointService.getPointsStats();

    successResponse(stats, res, 200, req.requestId);
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Get auto top-up statistics (admin only)
 *
 * @route GET /admin/auto-topup/stats
 * @access Private (admin only)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getAutoTopupStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get auto top-up statistics
    const stats = await pointService.getAutoTopupStats();

    successResponse(stats, res, 200, req.requestId);
    return;
  } catch (error) {
    next(error);
  }
};