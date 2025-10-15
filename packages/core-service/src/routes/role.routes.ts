import { Router } from 'express';
import { authenticateJWT, requirePermission, requireRoles } from '@smart-ai-hub/shared';
import {
  assignRoleToUser,
  removeRoleFromUser,
  getUserRolesHandler,
  getAllRolesHandler,
  getAllPermissionsHandler,
  createRoleHandler,
  checkPermissionHandler,
} from '../controllers/role.controller';

const router = Router();

/**
 * @route   POST /api/admin/roles/assign
 * @desc    Assign a role to a user
 * @access  Private (requires roles:assign permission)
 */
router.post(
  '/admin/roles/assign',
  authenticateJWT,
  requirePermission('roles', 'assign'),
  assignRoleToUser
);

/**
 * @route   DELETE /api/admin/roles/remove
 * @desc    Remove a role from a user
 * @access  Private (requires roles:assign permission)
 */
router.delete(
  '/admin/roles/remove',
  authenticateJWT,
  requirePermission('roles', 'assign'),
  removeRoleFromUser
);

/**
 * @route   GET /api/users/:id/roles
 * @desc    Get roles for a specific user
 * @access  Private (requires users:read permission or self access)
 */
router.get(
  '/users/:id/roles',
  authenticateJWT,
  requirePermission('users', 'read'),
  getUserRolesHandler
);

/**
 * @route   GET /api/admin/roles
 * @desc    Get all available roles
 * @access  Private (requires roles:read permission)
 */
router.get('/admin/roles', authenticateJWT, requirePermission('roles', 'read'), getAllRolesHandler);

/**
 * @route   GET /api/admin/permissions
 * @desc    Get all available permissions
 * @access  Private (requires roles:read permission)
 */
router.get(
  '/admin/permissions',
  authenticateJWT,
  requirePermission('roles', 'read'),
  getAllPermissionsHandler
);

/**
 * @route   POST /api/admin/roles
 * @desc    Create a new role
 * @access  Private (requires roles:assign permission)
 */
router.post(
  '/admin/roles',
  authenticateJWT,
  requirePermission('roles', 'assign'),
  createRoleHandler
);

/**
 * @route   POST /api/permissions/check
 * @desc    Check if a user has a specific permission (internal API)
 * @access  Private (internal use by middleware)
 */
router.post('/permissions/check', checkPermissionHandler);

export default router;
