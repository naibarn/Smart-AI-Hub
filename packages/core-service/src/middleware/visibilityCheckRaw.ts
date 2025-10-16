import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// Define UserTier enum locally since it's not exported from Prisma client yet
export enum UserTier {
  administrator = 'administrator',
  agency = 'agency',
  organization = 'organization',
  admin = 'admin',
  general = 'general'
}

// Extended interface for hierarchy-aware requests
export interface HierarchyRequest extends AuthenticatedRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    roles: Array<{ name: string }>;
    permissions?: string[];
    tier?: UserTier;
    parentAgencyId?: string;
    parentOrganizationId?: string;
  };
}

/**
 * 🔒 CRITICAL SECURITY MIDDLEWARE
 * 
 * This middleware enforces user visibility rules based on hierarchy relationships.
 * Users can ONLY see other users based on their tier and hierarchy relationship.
 */
export async function checkUserVisibility(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    // Use raw SQL queries to bypass TypeScript type issues
    const currentUserResult = await prisma.$queryRaw`
      SELECT tier, parent_agency_id, parent_organization_id
      FROM users
      WHERE id = ${currentUserId}::uuid
    ` as any[];
    
    const targetUserResult = await prisma.$queryRaw`
      SELECT tier, parent_agency_id, parent_organization_id
      FROM users
      WHERE id = ${targetUserId}::uuid
    ` as any[];
    
    const currentUser = currentUserResult[0];
    const targetUser = targetUserResult[0];
    
    if (!currentUser || !targetUser) {
      return false;
    }
    
    // Administrator can see everyone
    if (currentUser.tier === UserTier.administrator) {
      return true;
    }
    
    // Agency can see Organizations and Generals under them
    if (currentUser.tier === UserTier.agency) {
      if (targetUser.tier === UserTier.organization || targetUser.tier === UserTier.general) {
        return targetUser.parent_agency_id === currentUserId;
      }
      // Agency can see Admins in their Organizations
      if (targetUser.tier === UserTier.admin) {
        const targetOrgResult = await prisma.$queryRaw`
          SELECT parent_agency_id
          FROM users
          WHERE id = ${targetUser.parent_organization_id}::uuid
        ` as any[];
        
        const targetOrg = targetOrgResult[0];
        return targetOrg?.parent_agency_id === currentUserId;
      }
      return false;
    }
    
    // Organization can see Admins and Generals in their org
    if (currentUser.tier === UserTier.organization) {
      if (targetUser.tier === UserTier.admin || targetUser.tier === UserTier.general) {
        return targetUser.parent_organization_id === currentUserId;
      }
      return false;
    }
    
    // Admin can see Generals in same org
    if (currentUser.tier === UserTier.admin) {
      if (targetUser.tier === UserTier.general) {
        return targetUser.parent_organization_id === currentUser.parent_organization_id;
      }
      // Admin can see other Admins in same org
      if (targetUser.tier === UserTier.admin) {
        return targetUser.parent_organization_id === currentUser.parent_organization_id;
      }
      return false;
    }
    
    // General can only see themselves
    if (currentUser.tier === UserTier.general) {
      return targetUserId === currentUserId;
    }
    
    return false;
  } catch (error) {
    console.error('Error in checkUserVisibility:', error);
    return false;
  }
}

/**
 * Middleware to check if current user can see target user
 * Returns 403 Forbidden if user cannot see target user
 */
export function requireUserVisibility(targetUserIdParam: string = 'targetUserId') {
  return async (req: HierarchyRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const targetUserId = req.params[targetUserIdParam] || req.body[targetUserIdParam];
      
      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID required' });
      }

      const canSee = await checkUserVisibility(req.user.id, targetUserId);
      
      if (!canSee) {
        // Log unauthorized access attempt
        console.warn(`🚨 UNAUTHORIZED ACCESS ATTEMPT: User ${req.user.id} (${req.user.role}) tried to access User ${targetUserId}`);
        
        return res.status(403).json({ 
          error: 'You do not have permission to access this user information' 
        });
      }

      next();
    } catch (error) {
      console.error('Visibility check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Filter user data based on viewer's tier and relationship
 * Removes sensitive information that shouldn't be visible to certain tiers
 */
export function sanitizeUserData(
  user: any, 
  viewerTier: UserTier,
  viewerId?: string
): any {
  const baseData = {
    id: user.id,
    email: user.email,
    tier: user.tier,
    profile: user.profile ? {
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      avatarUrl: user.profile.avatarUrl
    } : null,
    createdAt: user.createdAt
  };
  
  // Only Administrator can see sensitive data
  if (viewerTier === UserTier.administrator) {
    return {
      ...baseData,
      points: user.points,
      credits: user.credits,
      isBlocked: user.is_blocked,
      blockedReason: user.blocked_reason,
      blockedAt: user.blocked_at,
      parentAgencyId: user.parent_agency_id,
      parentOrganizationId: user.parent_organization_id,
      inviteCode: user.invite_code,
      invitedBy: user.invited_by
    };
  }
  
  // Agency can see some additional info about users under them
  if (viewerTier === UserTier.agency) {
    return {
      ...baseData,
      isBlocked: user.is_blocked,
      parentAgencyId: user.parent_agency_id,
      parentOrganizationId: user.parent_organization_id
    };
  }
  
  // Organization can see basic info about their members
  if (viewerTier === UserTier.organization) {
    return {
      ...baseData,
      isBlocked: user.is_blocked,
      parentOrganizationId: user.parent_organization_id
    };
  }
  
  // Admin can see very limited info
  if (viewerTier === UserTier.admin) {
    return {
      ...baseData,
      isBlocked: user.is_blocked
    };
  }
  
  // General users can only see basic profile info
  if (viewerTier === UserTier.general && viewerId === user.id) {
    return {
      ...baseData,
      points: user.points,
      credits: user.credits
    };
  }
  
  // General users seeing others get minimal info
  return baseData;
}

/**
 * Apply visibility filters to a list of users
 * This should be used in all API endpoints that return user lists
 */
export async function applyVisibilityFilters(
  currentUserId: string,
  userFilters?: {
    tier?: UserTier;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ users: any[], total: number }> {
  try {
    const currentUserResult = await prisma.$queryRaw`
      SELECT tier, parent_agency_id, parent_organization_id
      FROM users
      WHERE id = ${currentUserId}::uuid
    ` as any[];

    const currentUser = currentUserResult[0];

    if (!currentUser) {
      return { users: [], total: 0 };
    }

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Build visibility filter based on user tier
    switch (currentUser.tier) {
      case UserTier.administrator:
        // Can see everyone
        if (userFilters?.tier) {
          whereClause += ` AND tier = $${paramIndex}`;
          params.push(userFilters.tier);
          paramIndex++;
        }
        if (userFilters?.search) {
          whereClause += ` AND (email ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex})`;
          params.push(`%${userFilters.search}%`);
          paramIndex++;
        }
        break;
        
      case UserTier.agency:
        // Can see Organizations and Generals under them, and Admins in their Organizations
        whereClause += ` AND (
          (tier = 'organization' AND parent_agency_id = $1) OR
          (tier = 'general' AND parent_agency_id = $1) OR
          (tier = 'admin' AND parent_organization_id IN (
            SELECT id FROM users WHERE tier = 'organization' AND parent_agency_id = $1
          )) OR
          (tier = 'general' AND parent_organization_id IN (
            SELECT id FROM users WHERE tier = 'organization' AND parent_agency_id = $1
          ))
        )`;
        break;
        
      case UserTier.organization:
        // Can see Admins and Generals in their org ONLY
        whereClause += ` AND parent_organization_id = $1 AND tier IN ('admin', 'general')`;
        break;
        
      case UserTier.admin:
        // Can see Generals in same org ONLY
        whereClause += ` AND parent_organization_id = (SELECT parent_organization_id FROM users WHERE id = $1) AND tier = 'general'`;
        break;
        
      case UserTier.general:
        // Can only see themselves
        whereClause += ` AND id = $1`;
        break;
    }

    // Apply additional filters
    if (userFilters?.tier) {
      whereClause += ` AND tier = $${paramIndex}`;
      params.push(userFilters.tier);
      paramIndex++;
    }

    if (userFilters?.search) {
      whereClause += ` AND (email ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex})`;
      params.push(`%${userFilters.search}%`);
      paramIndex++;
    }

    // Build the complete query
    const baseQuery = `
      SELECT u.*, up.first_name, up.last_name, up.avatar_url
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1 ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(userFilters?.limit || 50, userFilters?.offset || 0);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1 ${whereClause}
    `;

    const [usersResult, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(baseQuery, ...params) as unknown as any[],
      prisma.$queryRawUnsafe(countQuery, ...params.slice(0, -2)) as unknown as any[]
    ]);

    // Sanitize user data based on viewer's tier
    const sanitizedUsers = usersResult.map((user: any) => {
      // Convert snake_case to camelCase for consistency
      const formattedUser = {
        id: user.id,
        email: user.email,
        tier: user.tier,
        points: user.points,
        credits: user.credits,
        isBlocked: user.is_blocked,
        blockedReason: user.blocked_reason,
        blockedAt: user.blocked_at,
        parentAgencyId: user.parent_agency_id,
        parentOrganizationId: user.parent_organization_id,
        inviteCode: user.invite_code,
        invitedBy: user.invited_by,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        profile: user.first_name || user.last_name || user.avatar_url ? {
          firstName: user.first_name,
          lastName: user.last_name,
          avatarUrl: user.avatar_url
        } : null
      };
      
      return sanitizeUserData(formattedUser, currentUser.tier, currentUserId);
    });

    return { users: sanitizedUsers, total: parseInt(countResult[0]?.total || '0') };
  } catch (error) {
    console.error('Error in applyVisibilityFilters:', error);
    return { users: [], total: 0 };
  }
}

export default {
  checkUserVisibility,
  requireUserVisibility,
  sanitizeUserData,
  applyVisibilityFilters
};