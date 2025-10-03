import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@smart-ai-hub/shared';
/**
 * Assign a role to a user
 * POST /api/admin/roles/assign
 * Requires: admin role
 */
export declare const assignRoleToUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Remove a role from a user
 * DELETE /api/admin/roles/remove
 * Requires: admin role
 */
export declare const removeRoleFromUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get roles for a specific user
 * GET /api/users/:id/roles
 * Requires: users:read permission
 */
export declare const getUserRolesHandler: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get all available roles
 * GET /api/admin/roles
 * Requires: roles:read permission
 */
export declare const getAllRolesHandler: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get all available permissions
 * GET /api/admin/permissions
 * Requires: roles:read permission
 */
export declare const getAllPermissionsHandler: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Create a new role
 * POST /api/admin/roles
 * Requires: roles:assign permission
 */
export declare const createRoleHandler: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Check if a user has a specific permission
 * POST /api/permissions/check
 * Internal API used by middleware
 */
export declare const checkPermissionHandler: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=role.controller.d.ts.map