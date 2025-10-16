"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deductCredits = exports.checkCredits = exports.getUserCredits = exports.adjustCredits = exports.redeemPromoCode = exports.getHistory = exports.getBalance = void 0;
const shared_1 = require("@smart-ai-hub/shared");
const creditService = __importStar(require("../services/credit.service"));
const redis_service_1 = __importDefault(require("../services/redis.service"));
const webhook_service_1 = __importDefault(require("../services/webhook.service"));
const response_1 = require("../utils/response");
/**
 * Get user's credit balance
 *
 * @route GET /credits/balance
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
const getBalance = async (req, res, next) => {
    try {
        // Extract userId from authenticated user
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        // Check cache first
        const cacheKey = `credit_balance:${userId}`;
        const cachedBalance = await redis_service_1.default.get(cacheKey);
        if (cachedBalance) {
            const balanceData = JSON.parse(cachedBalance);
            (0, response_1.successResponse)(balanceData, res, 200, req.requestId);
            return;
            return;
        }
        // Get balance from service
        const balance = await creditService.getBalance(userId);
        // Cache the result for 60 seconds
        await redis_service_1.default.set(cacheKey, JSON.stringify(balance), 60);
        (0, response_1.successResponse)(balance, res, 200, req.requestId);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.getBalance = getBalance;
/**
 * Get user's credit transaction history
 *
 * @route GET /credits/history
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user and query params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
const getHistory = async (req, res, next) => {
    try {
        // Extract userId from authenticated user
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        // Get pagination parameters with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        // Validate pagination parameters
        if (page < 1) {
            return next(new shared_1.AppError('Page must be a positive integer', 400));
        }
        if (limit < 1 || limit > 100) {
            return next(new shared_1.AppError('Limit must be between 1 and 100', 400));
        }
        // Get history from service
        const history = await creditService.getHistory(userId, page, limit);
        (0, response_1.paginatedResponse)(history.data, {
            page,
            per_page: limit,
            total: history.total,
            total_pages: Math.ceil(history.total / limit),
        }, res, 200, req.requestId);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.getHistory = getHistory;
/**
 * Redeem a promo code for credits
 *
 * @route POST /credits/redeem
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user and promo code in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
const redeemPromoCode = async (req, res, next) => {
    try {
        // Extract userId from authenticated user
        const userId = req.user?.id;
        if (!userId) {
            return next(new shared_1.AppError('User not authenticated', 401));
        }
        // Get promo code from request body
        const { code } = req.body;
        if (!code) {
            return next(new shared_1.AppError('Promo code is required', 400));
        }
        // Validate code format (basic validation)
        if (typeof code !== 'string' || code.trim().length < 3) {
            return next(new shared_1.AppError('Invalid promo code format', 400));
        }
        // Redeem promo code
        const result = await creditService.redeemPromo(userId, code.trim());
        // Clear balance cache for this user
        const cacheKey = `credit_balance:${userId}`;
        await redis_service_1.default.del(cacheKey);
        // Get updated balance for webhook
        const newBalance = await creditService.getBalance(userId);
        // Trigger webhook for promo redemption
        webhook_service_1.default
            .triggerCreditPromoRedeemed(userId, code.trim(), result, newBalance)
            .catch((error) => {
            console.error('Failed to trigger credit.promo_redeemed webhook:', error);
        });
        (0, response_1.successResponse)({
            credits: result,
            message: `Successfully redeemed ${result} credits`,
        }, res, 200, req.requestId);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.redeemPromoCode = redeemPromoCode;
/**
 * Adjust user credits (admin only)
 *
 * @route POST /admin/credits/adjust
 * @access Private (admin only)
 * @param req - Express request object with userId in params and adjustment details in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
const adjustCredits = async (req, res, next) => {
    try {
        // Get userId from request body or params
        const { userId } = req.body;
        if (!userId) {
            return next(new shared_1.AppError('User ID is required', 400));
        }
        // Get adjustment details from request body
        const { amount, reason } = req.body;
        if (amount === undefined || amount === null) {
            return next(new shared_1.AppError('Amount is required', 400));
        }
        if (typeof amount !== 'number') {
            return next(new shared_1.AppError('Amount must be a number', 400));
        }
        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
            return next(new shared_1.AppError('Reason is required and must be a non-empty string', 400));
        }
        // Adjust credits
        const result = await creditService.adjustCredits(userId, amount, reason.trim());
        // Clear balance cache for this user
        const cacheKey = `credit_balance:${userId}`;
        await redis_service_1.default.del(cacheKey);
        // Trigger appropriate webhooks based on adjustment
        if (amount > 0) {
            // Credit added - trigger purchased webhook
            webhook_service_1.default
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
        await webhook_service_1.default.checkAndTriggerLowCredit(userId, result, 10);
        await webhook_service_1.default.checkAndTriggerCreditDepleted(userId, result, {
            id: `admin_${Date.now()}`,
            type: 'admin_adjustment',
            amount: amount,
            balanceAfter: result,
            description: reason.trim(),
        });
        (0, response_1.successResponse)({
            newBalance: result,
            message: 'Credits adjusted successfully',
        }, res, 200, req.requestId);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.adjustCredits = adjustCredits;
/**
 * Get user credit information (admin only)
 *
 * @route GET /admin/credits/:userId
 * @access Private (admin only)
 * @param req - Express request object with userId in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
const getUserCredits = async (req, res, next) => {
    try {
        // Get userId from request params
        const { userId } = req.params;
        if (!userId) {
            return next(new shared_1.AppError('User ID is required', 400));
        }
        // Get balance and recent transactions
        const [balance, history] = await Promise.all([
            creditService.getBalance(userId),
            creditService.getHistory(userId, 1, 10), // Get 10 most recent transactions
        ]);
        (0, response_1.successResponse)({
            balance,
            recentTransactions: history.data,
        }, res, 200, req.requestId);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.getUserCredits = getUserCredits;
/**
 * Check if user has sufficient credits for a service
 *
 * @route POST /api/mcp/v1/credits/check
 * @access Public (requires X-User-ID header)
 * @param req - Express request object with userId in header and service/cost in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
const checkCredits = async (req, res, next) => {
    try {
        // Get userId from header
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return next(new shared_1.AppError('X-User-ID header is required', 401));
        }
        // Get service and cost from request body
        const { service, cost } = req.body;
        if (!service) {
            return next(new shared_1.AppError('Service is required', 400));
        }
        if (cost === undefined || cost === null) {
            return next(new shared_1.AppError('Cost is required', 400));
        }
        if (typeof cost !== 'number' || cost < 0) {
            return next(new shared_1.AppError('Cost must be a non-negative number', 400));
        }
        // Check credits
        const result = await creditService.checkCredits(userId, service, cost);
        (0, response_1.successResponse)(result, res, 200, req.requestId);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.checkCredits = checkCredits;
/**
 * Deduct credits from user account with transaction record
 *
 * @route POST /api/mcp/v1/credits/deduct
 * @access Public (requires X-User-ID header)
 * @param req - Express request object with userId in header and service/cost/metadata in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
const deductCredits = async (req, res, next) => {
    try {
        // Get userId from header
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return next(new shared_1.AppError('X-User-ID header is required', 401));
        }
        // Get service, cost, and metadata from request body
        const { service, cost, metadata } = req.body;
        if (!service) {
            return next(new shared_1.AppError('Service is required', 400));
        }
        if (cost === undefined || cost === null) {
            return next(new shared_1.AppError('Cost is required', 400));
        }
        if (typeof cost !== 'number' || cost <= 0) {
            return next(new shared_1.AppError('Cost must be a positive number', 400));
        }
        // Deduct credits
        const result = await creditService.deductCredits(userId, service, cost, metadata);
        // Clear balance cache for this user
        const cacheKey = `credit_balance:${userId}`;
        await redis_service_1.default.del(cacheKey);
        // Get transaction details for webhook
        const history = await creditService.getHistory(userId, 1, 1);
        const transactionData = history.data[0];
        // Check if credit is low or depleted and trigger appropriate webhooks
        await webhook_service_1.default.checkAndTriggerLowCredit(userId, result.new_balance, 10);
        await webhook_service_1.default.checkAndTriggerCreditDepleted(userId, result.new_balance, transactionData);
        (0, response_1.successResponse)(result, res, 200, req.requestId);
        return;
    }
    catch (error) {
        // Handle specific error for insufficient credits
        if (error instanceof Error && error.message === 'Insufficient credits') {
            return next(new shared_1.AppError('Insufficient credits', 402));
        }
        next(error);
    }
};
exports.deductCredits = deductCredits;
//# sourceMappingURL=credit.controller.js.map