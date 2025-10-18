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
const express_1 = require("express");
const shared_1 = require("@smart-ai-hub/shared");
const userController = __importStar(require("../controllers/user.controller"));
const user_middleware_1 = require("../middlewares/user.middleware");
const user_audit_routes_1 = __importDefault(require("./user-audit.routes"));
const router = (0, express_1.Router)();
/**
 * @route   GET /users/me
 * @desc    Get current user profile
 * @access  Private (JWT required)
 */
router.get('/users/me', shared_1.authenticateJWT, userController.getCurrentUser);
/**
 * @route   PUT /users/me
 * @desc    Update current user profile
 * @access  Private (JWT required)
 */
router.put('/users/me', shared_1.authenticateJWT, user_middleware_1.validateUpdateProfile, userController.updateCurrentUser);
/**
 * @route   GET /users
 * @desc    Search and filter users
 * @access  Private (admin only)
 */
router.get('/users', shared_1.authenticateJWT, (0, shared_1.requirePermission)('users', 'read'), user_middleware_1.validateUserSearch, userController.searchUsers);
/**
 * @route   POST /users
 * @desc    Create a new user
 * @access  Private (admin only)
 */
router.post('/users', shared_1.authenticateJWT, (0, shared_1.requirePermission)('users', 'create'), user_middleware_1.validateCreateUser, userController.createUser);
/**
 * @route   GET /users/statistics
 * @desc    Get user statistics
 * @access  Private (admin only)
 */
router.get('/users/statistics', shared_1.authenticateJWT, (0, shared_1.requirePermission)('users', 'read'), userController.getUserStatistics);
/**
 * @route   POST /users/bulk
 * @desc    Perform bulk operations on users
 * @access  Private (admin only)
 */
router.post('/users/bulk', shared_1.authenticateJWT, (0, shared_1.requirePermission)('users', 'update'), user_middleware_1.validateBulkUserOperation, userController.bulkUserOperation);
/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Private (admin or self-access)
 */
router.get('/users/:id', shared_1.authenticateJWT, user_middleware_1.attachUserToRequest, user_middleware_1.requireUserAccess, userController.getUserById);
/**
 * @route   PUT /users/:id
 * @desc    Update user profile
 * @access  Private (admin only)
 */
router.put('/users/:id', shared_1.authenticateJWT, (0, shared_1.requirePermission)('users', 'update'), user_middleware_1.attachUserToRequest, user_middleware_1.requireUserModificationAccess, user_middleware_1.validateUpdateProfile, userController.updateUser);
/**
 * @route   POST /users/:id/deactivate
 * @desc    Deactivate user account
 * @access  Private (admin only)
 */
router.post('/users/:id/deactivate', shared_1.authenticateJWT, (0, shared_1.requirePermission)('users', 'deactivate'), user_middleware_1.attachUserToRequest, user_middleware_1.requireUserModificationAccess, user_middleware_1.validateAccountStatusChange, userController.deactivateUser);
/**
 * @route   POST /users/:id/reactivate
 * @desc    Reactivate user account
 * @access  Private (admin only)
 */
router.post('/users/:id/reactivate', shared_1.authenticateJWT, (0, shared_1.requirePermission)('users', 'reactivate'), user_middleware_1.attachUserToRequest, user_middleware_1.requireUserModificationAccess, user_middleware_1.validateAccountStatusChange, userController.reactivateUser);
/**
 * @route   DELETE /users/:id
 * @desc    Delete a user
 * @access  Private (admin only)
 */
router.delete('/users/:id', shared_1.authenticateJWT, (0, shared_1.requirePermission)('users', 'delete'), user_middleware_1.attachUserToRequest, user_middleware_1.requireUserModificationAccess, userController.deleteUser);
// User audit routes
router.use('/user-audit', user_audit_routes_1.default);
exports.default = router;
//# sourceMappingURL=user.routes.js.map