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
const roleController = __importStar(require("../controllers/role.controller"));
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(shared_1.authenticateJWT);
// Role management routes
/**
 * @route   GET /roles
 * @desc    Get all roles
 * @access  Private (admin only)
 */
router.get('/roles', (0, shared_1.requirePermission)('roles', 'read'), roleController.getAllRoles);
/**
 * @route   GET /roles/:id
 * @desc    Get role by ID
 * @access  Private (admin only)
 */
router.get('/roles/:id', (0, shared_1.requirePermission)('roles', 'read'), roleController.getRoleById);
/**
 * @route   POST /roles
 * @desc    Create a new role
 * @access  Private (admin only)
 */
router.post('/roles', (0, shared_1.requirePermission)('roles', 'create'), roleController.createRole);
/**
 * @route   PUT /roles/:id
 * @desc    Update a role
 * @access  Private (admin only)
 */
router.put('/roles/:id', (0, shared_1.requirePermission)('roles', 'update'), roleController.updateRole);
/**
 * @route   DELETE /roles/:id
 * @desc    Delete a role
 * @access  Private (admin only)
 */
router.delete('/roles/:id', (0, shared_1.requirePermission)('roles', 'delete'), roleController.deleteRole);
// Role assignment routes
/**
 * @route   POST /roles/assign
 * @desc    Assign role to user
 * @access  Private (admin only)
 */
router.post('/roles/assign', (0, shared_1.requirePermission)('users', 'update'), roleController.assignRoleToUser);
/**
 * @route   POST /roles/remove
 * @desc    Remove role from user
 * @access  Private (admin only)
 */
router.post('/roles/remove', (0, shared_1.requirePermission)('users', 'update'), roleController.removeRoleFromUser);
/**
 * @route   GET /roles/:id/users
 * @desc    Get users with a specific role
 * @access  Private (admin only)
 */
router.get('/roles/:id/users', (0, shared_1.requirePermission)('roles', 'read'), roleController.getUsersWithRole);
/**
 * @route   GET /users/:id/roles
 * @desc    Get user roles
 * @access  Private (admin or self-access)
 */
router.get('/users/:id/roles', roleController.getUserRoles);
// Permission management routes
/**
 * @route   GET /permissions
 * @desc    Get all permissions
 * @access  Private (admin only)
 */
router.get('/permissions', (0, shared_1.requirePermission)('permissions', 'read'), roleController.getAllPermissions);
/**
 * @route   GET /roles/:id/permissions
 * @desc    Get role permissions
 * @access  Private (admin only)
 */
router.get('/roles/:id/permissions', (0, shared_1.requirePermission)('permissions', 'read'), roleController.getRolePermissions);
/**
 * @route   POST /roles/permissions/assign
 * @desc    Assign permission to role
 * @access  Private (admin only)
 */
router.post('/roles/permissions/assign', (0, shared_1.requirePermission)('permissions', 'update'), roleController.assignPermissionToRole);
/**
 * @route   POST /roles/permissions/remove
 * @desc    Remove permission from role
 * @access  Private (admin only)
 */
router.post('/roles/permissions/remove', (0, shared_1.requirePermission)('permissions', 'update'), roleController.removePermissionFromRole);
exports.default = router;
//# sourceMappingURL=role.routes.js.map