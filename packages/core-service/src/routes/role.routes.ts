import { Router } from 'express';
import { authenticateJWT, requirePermission } from '@smart-ai-hub/shared';
import * as roleController from '../controllers/role.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Role management routes

/**
 * @route   GET /roles
 * @desc    Get all roles
 * @access  Private (admin only)
 */
router.get('/roles', requirePermission('roles', 'read'), roleController.getAllRoles);

/**
 * @route   GET /roles/:id
 * @desc    Get role by ID
 * @access  Private (admin only)
 */
router.get('/roles/:id', requirePermission('roles', 'read'), roleController.getRoleById);

/**
 * @route   POST /roles
 * @desc    Create a new role
 * @access  Private (admin only)
 */
router.post('/roles', requirePermission('roles', 'create'), roleController.createRole);

/**
 * @route   PUT /roles/:id
 * @desc    Update a role
 * @access  Private (admin only)
 */
router.put('/roles/:id', requirePermission('roles', 'update'), roleController.updateRole);

/**
 * @route   DELETE /roles/:id
 * @desc    Delete a role
 * @access  Private (admin only)
 */
router.delete('/roles/:id', requirePermission('roles', 'delete'), roleController.deleteRole);

// Role assignment routes

/**
 * @route   POST /roles/assign
 * @desc    Assign role to user
 * @access  Private (admin only)
 */
router.post('/roles/assign', requirePermission('users', 'update'), roleController.assignRoleToUser);

/**
 * @route   POST /roles/remove
 * @desc    Remove role from user
 * @access  Private (admin only)
 */
router.post(
  '/roles/remove',
  requirePermission('users', 'update'),
  roleController.removeRoleFromUser
);

/**
 * @route   GET /roles/:id/users
 * @desc    Get users with a specific role
 * @access  Private (admin only)
 */
router.get('/roles/:id/users', requirePermission('roles', 'read'), roleController.getUsersWithRole);

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
router.get(
  '/permissions',
  requirePermission('permissions', 'read'),
  roleController.getAllPermissions
);

/**
 * @route   GET /roles/:id/permissions
 * @desc    Get role permissions
 * @access  Private (admin only)
 */
router.get(
  '/roles/:id/permissions',
  requirePermission('permissions', 'read'),
  roleController.getRolePermissions
);

/**
 * @route   POST /roles/permissions/assign
 * @desc    Assign permission to role
 * @access  Private (admin only)
 */
router.post(
  '/roles/permissions/assign',
  requirePermission('permissions', 'update'),
  roleController.assignPermissionToRole
);

/**
 * @route   POST /roles/permissions/remove
 * @desc    Remove permission from role
 * @access  Private (admin only)
 */
router.post(
  '/roles/permissions/remove',
  requirePermission('permissions', 'update'),
  roleController.removePermissionFromRole
);

export default router;
