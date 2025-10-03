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
exports.getUserCredits = exports.adjustCredits = exports.redeemPromoCode = exports.getHistory = exports.getBalance = void 0;
const errorHandler_middleware_1 = require("../middlewares/errorHandler.middleware");
const creditService = __importStar(require("../services/credit.service"));
const redis_service_1 = __importDefault(require("../services/redis.service"));
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
            return next(new errorHandler_middleware_1.AppError('User not authenticated', 401));
        }
        // Check cache first
        const cacheKey = `credit_balance:${userId}`;
        const cachedBalance = await redis_service_1.default.get(cacheKey);
        if (cachedBalance) {
            const balanceData = JSON.parse(cachedBalance);
            res.status(200).json({
                data: balanceData,
                meta: { cached: true },
                error: null,
            });
            return;
        }
        // Get balance from service
        const balance = await creditService.getBalance(userId);
        // Cache the result for 60 seconds
        await redis_service_1.default.set(cacheKey, JSON.stringify(balance), 60);
        console.log('Sending response with balance:', balance);
        res.status(200).json({
            data: balance,
            meta: { cached: false },
            error: null,
        });
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
            return next(new errorHandler_middleware_1.AppError('User not authenticated', 401));
        }
        // Get pagination parameters with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        // Validate pagination parameters
        if (page < 1) {
            return next(new errorHandler_middleware_1.AppError('Page must be a positive integer', 400));
        }
        if (limit < 1 || limit > 100) {
            return next(new errorHandler_middleware_1.AppError('Limit must be between 1 and 100', 400));
        }
        // Get history from service
        const history = await creditService.getHistory(userId, page, limit);
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
    }
    catch (error) {
        console.error('Error in getBalance:', error);
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
            return next(new errorHandler_middleware_1.AppError('User not authenticated', 401));
        }
        // Get promo code from request body
        const { code } = req.body;
        if (!code) {
            return next(new errorHandler_middleware_1.AppError('Promo code is required', 400));
        }
        // Validate code format (basic validation)
        if (typeof code !== 'string' || code.trim().length < 3) {
            return next(new errorHandler_middleware_1.AppError('Invalid promo code format', 400));
        }
        // Redeem promo code
        const result = await creditService.redeemPromo(userId, code.trim());
        // Clear balance cache for this user
        const cacheKey = `credit_balance:${userId}`;
        await redis_service_1.default.del(cacheKey);
        res.status(200).json({
            data: {
                credits: result,
                message: `Successfully redeemed ${result} credits`,
            },
            meta: null,
            error: null,
        });
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
            return next(new errorHandler_middleware_1.AppError('User ID is required', 400));
        }
        // Get adjustment details from request body
        const { amount, reason } = req.body;
        if (amount === undefined || amount === null) {
            return next(new errorHandler_middleware_1.AppError('Amount is required', 400));
        }
        if (typeof amount !== 'number') {
            return next(new errorHandler_middleware_1.AppError('Amount must be a number', 400));
        }
        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
            return next(new errorHandler_middleware_1.AppError('Reason is required and must be a non-empty string', 400));
        }
        // Adjust credits
        const result = await creditService.adjustCredits(userId, amount, reason.trim());
        // Clear balance cache for this user
        const cacheKey = `credit_balance:${userId}`;
        await redis_service_1.default.del(cacheKey);
        res.status(200).json({
            data: {
                newBalance: result,
                message: 'Credits adjusted successfully',
            },
            meta: null,
            error: null,
        });
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
            return next(new errorHandler_middleware_1.AppError('User ID is required', 400));
        }
        // Get balance and recent transactions
        const [balance, history] = await Promise.all([
            creditService.getBalance(userId),
            creditService.getHistory(userId, 1, 10), // Get 10 most recent transactions
        ]);
        res.status(200).json({
            data: {
                balance,
                recentTransactions: history.data,
            },
            meta: null,
            error: null,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserCredits = getUserCredits;
//# sourceMappingURL=credit.controller.js.map