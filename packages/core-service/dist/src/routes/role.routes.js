"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("@shared/middlewares/rbac.middleware");
const role_controller_1 = require("../controllers/role.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/admin/roles/assign
 * @desc    Assign a role to a user
 * @access  Private (requires roles:assign permission)
 */
router.post('/admin/roles/assign', auth_middleware_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('roles', 'assign'), role_controller_1.assignRoleToUser);
/**
 * @route   DELETE /api/admin/roles/remove
 * @desc    Remove a role from a user
 * @access  Private (requires roles:assign permission)
 */
router.delete('/admin/roles/remove', auth_middleware_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('roles', 'assign'), role_controller_1.removeRoleFromUser);
/**
 * @route   GET /api/users/:id/roles
 * @desc    Get roles for a specific user
 * @access  Private (requires users:read permission or self access)
 */
router.get('/users/:id/roles', auth_middleware_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('users', 'read'), role_controller_1.getUserRolesHandler);
/**
 * @route   GET /api/admin/roles
 * @desc    Get all available roles
 * @access  Private (requires roles:read permission)
 */
router.get('/admin/roles', auth_middleware_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('roles', 'read'), role_controller_1.getAllRolesHandler);
/**
 * @route   GET /api/admin/permissions
 * @desc    Get all available permissions
 * @access  Private (requires roles:read permission)
 */
router.get('/admin/permissions', auth_middleware_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('roles', 'read'), role_controller_1.getAllPermissionsHandler);
/**
 * @route   POST /api/admin/roles
 * @desc    Create a new role
 * @access  Private (requires roles:assign permission)
 */
router.post('/admin/roles', auth_middleware_1.authenticateJWT, (0, rbac_middleware_1.requirePermission)('roles', 'assign'), role_controller_1.createRoleHandler);
/**
 * @route   POST /api/permissions/check
 * @desc    Check if a user has a specific permission (internal API)
 * @access  Private (internal use by middleware)
 */
router.post('/permissions/check', role_controller_1.checkPermissionHandler);
exports.default = router;
//# sourceMappingURL=role.routes.js.map