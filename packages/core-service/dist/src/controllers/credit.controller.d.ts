import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
/**
 * Get user's credit balance
 *
 * @route GET /credits/balance
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export declare const getBalance: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get user's credit transaction history
 *
 * @route GET /credits/history
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user and query params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export declare const getHistory: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Redeem a promo code for credits
 *
 * @route POST /credits/redeem
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user and promo code in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export declare const redeemPromoCode: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Adjust user credits (admin only)
 *
 * @route POST /admin/credits/adjust
 * @access Private (admin only)
 * @param req - Express request object with userId in params and adjustment details in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export declare const adjustCredits: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get user credit information (admin only)
 *
 * @route GET /admin/credits/:userId
 * @access Private (admin only)
 * @param req - Express request object with userId in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export declare const getUserCredits: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=credit.controller.d.ts.map