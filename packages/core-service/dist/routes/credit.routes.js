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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@smart-ai-hub/shared");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const service_auth_middleware_1 = require("../middlewares/service-auth.middleware");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const creditController = __importStar(require("../controllers/credit.controller"));
const router = (0, express_1.Router)();
/**
 * @route   GET /credits/balance
 * @desc    Get current user's credit balance
 * @access  Private (JWT required)
 */
router.get('/credits/balance', rateLimiter_1.rateLimiter, shared_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('credits', 'read'), creditController.getBalance);
/**
 * @route   GET /credits/history
 * @desc    Get current user's credit history
 * @access  Private (JWT required)
 */
router.get('/credits/history', rateLimiter_1.rateLimiter, shared_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('credits', 'read'), creditController.getHistory);
/**
 * @route   POST /credits/redeem
 * @desc    Redeem promo code for credits
 * @access  Private (JWT required)
 */
router.post('/credits/redeem', rateLimiter_1.strictRateLimiter, shared_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('credits', 'write'), creditController.redeemPromoCode);
/**
 * @route   POST /admin/credits/adjust
 * @desc    Adjust user credits (admin only)
 * @access  Private (requires credits:adjust permission)
 */
router.post('/admin/credits/adjust', rateLimiter_1.rateLimiter, shared_1.authenticateJWT, (0, rbac_middleware_1.requireRoles)(['admin', 'superadmin']), creditController.adjustCredits);
/**
 * @route   GET /admin/credits/:userId
 * @desc    Get user credit information (admin only)
 * @access  Private (requires credits:read permission)
 */
router.get('/admin/credits/:userId', rateLimiter_1.rateLimiter, shared_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('credits', 'read'), creditController.getUserCredits);
/**
 * @route   POST /api/mcp/v1/credits/check
 * @desc    Check if user has sufficient credits for a service
 * @access  Private (requires service authentication)
 */
router.post('/mcp/v1/credits/check', rateLimiter_1.rateLimiter, service_auth_middleware_1.authenticateServiceRequest, creditController.checkCredits);
/**
 * @route   POST /api/mcp/v1/credits/deduct
 * @desc    Deduct credits from user account with transaction record
 * @access  Private (requires service authentication)
 */
router.post('/mcp/v1/credits/deduct', rateLimiter_1.rateLimiter, service_auth_middleware_1.authenticateServiceRequest, creditController.deductCredits);
exports.default = router;
//# sourceMappingURL=credit.routes.js.map