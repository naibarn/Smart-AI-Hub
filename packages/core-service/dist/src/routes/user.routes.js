"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("@shared/middlewares/rbac.middleware");
// Placeholder controllers - these should be implemented based on your business logic
const getUserProfile = (req, res) => {
    res.json({ message: 'Get user profile', user: req.user });
};
const updateUserProfile = (req, res) => {
    res.json({ message: 'Update user profile', user: req.user, data: req.body });
};
const router = (0, express_1.Router)();
/**
 * @route   GET /users/me
 * @desc    Get current user profile
 * @access  Private (JWT required)
 */
router.get('/users/me', auth_middleware_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('users', 'read'), getUserProfile);
/**
 * @route   PUT /users/me
 * @desc    Update current user profile
 * @access  Private (JWT required)
 */
router.put('/users/me', auth_middleware_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('users', 'update'), updateUserProfile);
/**
 * @route   DELETE /users/:id
 * @desc    Delete a user
 * @access  Private (requires users:delete permission or self access for admin)
 */
router.delete('/users/:id', auth_middleware_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('users', 'delete'), (req, res) => {
    res.json({ message: 'Delete user', user: req.user, targetUserId: req.params.id });
});
/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Private (requires users:read permission or self access)
 */
router.get('/users/:id', auth_middleware_1.authenticateJWT, (0, rbac_middleware_1.requireSelfOrRole)(['admin', 'manager']), (req, res) => {
    res.json({ message: 'Get user by ID', user: req.user, targetUserId: req.params.id });
});
exports.default = router;
//# sourceMappingURL=user.routes.js.map