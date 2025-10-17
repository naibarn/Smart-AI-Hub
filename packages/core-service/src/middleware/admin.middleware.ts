import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

/**
 * Middleware to check if user has admin privileges
 */
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource',
      });
      return;
    }

    // Check if user has admin role
    const userRoles = req.user.roles.map((r: any) => r.name);
    const isAdmin = userRoles.includes('admin') || userRoles.includes('administrator');

    if (!isAdmin) {
      res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required to access this resource',
      });
      return;
    }

    // Verify user exists in database and has admin tier
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        tier: true,
        isBlocked: true,
      }
    });

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'Authenticated user not found in the system',
      });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({
        error: 'Account blocked',
        message: 'Your account has been blocked. Please contact support.',
      });
      return;
    }

    // Check if user has admin tier
    const adminTiers = ['administrator', 'admin'];
    if (!adminTiers.includes(user.tier)) {
      res.status(403).json({
        error: 'Insufficient privileges',
        message: 'Your account does not have admin privileges',
      });
      return;
    }

    // Attach user details to request for use in subsequent middleware
    (req as any).adminUser = user;
    
    next();
  } catch (error) {
    console.error('Error checking admin privileges:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while checking admin privileges',
    });
  }
};

/**
 * Middleware to check if user can approve agents
 */
export const requireApprovalPermissions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource',
      });
      return;
    }

    // Check if user has admin role
    const userRoles = req.user.roles.map((r: any) => r.name);
    const hasAdminRole = userRoles.includes('admin') || userRoles.includes('administrator');

    if (!hasAdminRole) {
      res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required to approve agents',
      });
      return;
    }

    // Get user permissions from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        tier: true,
        isBlocked: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'Authenticated user not found in the system',
      });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({
        error: 'Account blocked',
        message: 'Your account has been blocked. Please contact support.',
      });
      return;
    }

    // Extract all permissions from user roles
    const permissions = user.userRoles.flatMap(userRole => 
      userRole.role.permissions.map(rolePermission => rolePermission.permission)
    );

    // Check for agent approval permissions
    const canApproveAgents = permissions.some(permission => 
      permission.resource === 'agent' && permission.action === 'approve'
    );

    const canRejectAgents = permissions.some(permission => 
      permission.resource === 'agent' && permission.action === 'reject'
    );

    if (!canApproveAgents || !canRejectAgents) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to approve or reject agents',
      });
      return;
    }

    // Attach user details and permissions to request
    (req as any).adminUser = user;
    (req as any).adminPermissions = permissions;
    
    next();
  } catch (error) {
    console.error('Error checking approval permissions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while checking approval permissions',
    });
  }
};

/**
 * Middleware to check if user can view admin dashboard
 */
export const requireDashboardAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource',
      });
      return;
    }

    // Check if user has admin or elevated role
    const userRoles = req.user.roles.map((r: any) => r.name);
    const hasElevatedRole = userRoles.includes('admin') || 
                          userRoles.includes('administrator') ||
                          userRoles.includes('organization') ||
                          userRoles.includes('agency');

    if (!hasElevatedRole) {
      res.status(403).json({
        error: 'Access denied',
        message: 'Elevated privileges required to access the admin dashboard',
      });
      return;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        tier: true,
        isBlocked: true,
        parentOrganizationId: true,
        parentAgencyId: true,
      }
    });

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'Authenticated user not found in the system',
      });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({
        error: 'Account blocked',
        message: 'Your account has been blocked. Please contact support.',
      });
      return;
    }

    // Check if user has appropriate tier
    const allowedTiers = ['administrator', 'admin', 'organization', 'agency'];
    if (!allowedTiers.includes(user.tier)) {
      res.status(403).json({
        error: 'Insufficient privileges',
        message: 'Your account tier does not have access to the admin dashboard',
      });
      return;
    }

    // Attach user details to request
    (req as any).adminUser = user;
    
    next();
  } catch (error) {
    console.error('Error checking dashboard access:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while checking dashboard access',
    });
  }
};

/**
 * Middleware to validate admin action parameters
 */
export const validateAdminAction = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const { reason, notes, agentIds } = req.body;

    // For rejection actions, reason is required
    if (req.path.includes('/reject') && (!reason || typeof reason !== 'string' || reason.trim().length === 0)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Rejection reason is required and must be a non-empty string',
      });
      return;
    }

    // For bulk actions, agentIds array is required
    if (req.path.includes('/bulk') && (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Agent IDs array is required for bulk actions',
      });
      return;
    }

    // Validate agent IDs format for bulk actions
    if (req.path.includes('/bulk') && agentIds) {
      for (const agentId of agentIds) {
        if (typeof agentId !== 'string' || agentId.trim().length === 0) {
          res.status(400).json({
            error: 'Validation Error',
            message: 'All agent IDs must be non-empty strings',
          });
          return;
        }
      }
    }

    // Validate reason length
    if (reason && reason.length > 1000) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Reason must be less than 1000 characters',
      });
      return;
    }

    // Validate notes length
    if (notes && notes.length > 1000) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Notes must be less than 1000 characters',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validating admin action:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during validation',
    });
  }
};

/**
 * Middleware to log admin actions
 */
export const logAdminAction = (action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next();
        return;
      }

      const adminId = req.user.id;
      const adminEmail = req.user.email;
      const agentId = req.params.id || req.params.agentId;
      const { reason, notes } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Log the admin action
      console.log(`[ADMIN ACTION] ${action} - Admin: ${adminEmail} (${adminId}) - Agent: ${agentId} - IP: ${ipAddress}`);

      // Store action metadata for audit trail
      (req as any).adminAction = {
        action,
        adminId,
        adminEmail,
        agentId,
        reason,
        notes,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      };

      next();
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't block the request if logging fails
      next();
    }
  };
};