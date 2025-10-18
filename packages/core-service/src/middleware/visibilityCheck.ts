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
  general = 'general',
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
 *
 * VISIBILITY RULES:
 *
 * Administrator:
 * - ✅ Can see ALL users in the system (no restrictions)
 *
 * Agency:
 * - ✅ Can see Organizations where parentAgencyId === agency.id
 * - ✅ Can see Admins in Organizations under them
 * - ✅ Can see General where parentAgencyId === agency.id OR in Organizations under them
 * - ❌ CANNOT see other Agencies
 * - ❌ CANNOT see Administrators
 * - ❌ CANNOT see General not under their Agency
 *
 * Organization:
 * - ✅ Can see Admins where parentOrganizationId === organization.id
 * - ✅ Can see General where parentOrganizationId === organization.id
 * - ✅ Can see parent Agency (basic info only)
 * - ❌ CANNOT see other Organizations
 * - ❌ CANNOT see Admins/General of other Organizations
 * - ❌ CANNOT see Agencies
 * - ❌ CANNOT see Administrators
 *
 * Admin:
 * - ✅ Can see General where parentOrganizationId === admin.parentOrganizationId
 * - ✅ Can see other Admins in same Organization
 * - ✅ Can see parent Organization (basic info only)
 * - ❌ CANNOT see Admins/General of other Organizations
 * - ❌ CANNOT see Organizations
 * - ❌ CANNOT see Agencies
 * - ❌ CANNOT see Administrators
 *
 * General:
 * - ✅ Can see ONLY themselves
 * - ✅ Can see parent Organization (basic info only, if applicable)
 * - ✅ Can see Admins in same Organization (basic contact info only)
 * - ❌ CANNOT see other Generals (even in same Organization)
 * - ❌ CANNOT see member lists
 * - ❌ CANNOT see Organizations
 * - ❌ CANNOT see Agencies
 * - ❌ CANNOT see Administrators
 */
export async function checkUserVisibility(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  const currentUser = (await prisma.user.findUnique({
    where: { id: currentUserId },
  })) as any;

  const targetUser = (await prisma.user.findUnique({
    where: { id: targetUserId },
  })) as any;

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
      return targetUser.parentAgencyId === currentUserId;
    }
    // Agency can see Admins in their Organizations
    if (targetUser.tier === UserTier.admin) {
      const targetOrg = (await prisma.user.findUnique({
        where: { id: targetUser.parentOrganizationId! },
      })) as any;
      return targetOrg?.parentAgencyId === currentUserId;
    }
    return false;
  }

  // Organization can see Admins and Generals in their org
  if (currentUser.tier === UserTier.organization) {
    if (targetUser.tier === UserTier.admin || targetUser.tier === UserTier.general) {
      return targetUser.parentOrganizationId === currentUserId;
    }
    return false;
  }

  // Admin can see Generals in same org
  if (currentUser.tier === UserTier.admin) {
    if (targetUser.tier === UserTier.general) {
      return targetUser.parentOrganizationId === currentUser.parentOrganizationId;
    }
    // Admin can see other Admins in same org
    if (targetUser.tier === UserTier.admin) {
      return targetUser.parentOrganizationId === currentUser.parentOrganizationId;
    }
    return false;
  }

  // General can only see themselves
  if (currentUser.tier === UserTier.general) {
    return targetUserId === currentUserId;
  }

  return false;
}

/**
 * Middleware to check if current user can see target user
 * Returns 403 Forbidden if user cannot see target user
 */
export function requireUserVisibility(targetUserIdParam: string = 'targetUserId') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
        console.warn(
          `🚨 UNAUTHORIZED ACCESS ATTEMPT: User ${req.user.id} (${(req.user as any).tier}) tried to access User ${targetUserId}`
        );

        return res.status(403).json({
          error: 'You do not have permission to access this user information',
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
export function sanitizeUserData(user: any, viewerTier: UserTier, viewerId?: string): any {
  const baseData = {
    id: user.id,
    email: user.email,
    tier: user.tier,
    profile: user.profile
      ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          avatarUrl: user.profile.avatarUrl,
        }
      : null,
    createdAt: user.createdAt,
  };

  // Only Administrator can see sensitive data
  if (viewerTier === UserTier.administrator) {
    return {
      ...baseData,
      points: user.points,
      credits: user.credits,
      isBlocked: user.isBlocked,
      blockedReason: user.blockedReason,
      blockedAt: user.blockedAt,
      parentAgencyId: user.parentAgencyId,
      parentOrganizationId: user.parentOrganizationId,
      inviteCode: user.inviteCode,
      invitedBy: user.invitedBy,
    };
  }

  // Agency can see some additional info about users under them
  if (viewerTier === UserTier.agency) {
    return {
      ...baseData,
      isBlocked: user.isBlocked,
      parentAgencyId: user.parentAgencyId,
      parentOrganizationId: user.parentOrganizationId,
    };
  }

  // Organization can see basic info about their members
  if (viewerTier === UserTier.organization) {
    return {
      ...baseData,
      isBlocked: user.isBlocked,
      parentOrganizationId: user.parentOrganizationId,
    };
  }

  // Admin can see very limited info
  if (viewerTier === UserTier.admin) {
    return {
      ...baseData,
      isBlocked: user.isBlocked,
    };
  }

  // General users can only see basic profile info
  if (viewerTier === UserTier.general && viewerId === user.id) {
    return {
      ...baseData,
      points: user.points,
      credits: user.credits,
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
): Promise<{ users: any[]; total: number }> {
  const currentUser = (await prisma.user.findUnique({
    where: { id: currentUserId },
  })) as any;

  if (!currentUser) {
    return { users: [], total: 0 };
  }

  const whereClause: any = {};

  // Build visibility filter based on user tier
  switch (currentUser.tier) {
    case UserTier.administrator:
      // Can see everyone
      if (userFilters?.tier) {
        whereClause.tier = userFilters.tier;
      }
      if (userFilters?.search) {
        whereClause.OR = [
          { email: { contains: userFilters.search, mode: 'insensitive' } },
          { profile: { firstName: { contains: userFilters.search, mode: 'insensitive' } } },
          { profile: { lastName: { contains: userFilters.search, mode: 'insensitive' } } },
        ];
      }
      break;

    case UserTier.agency:
      // Can see Organizations and Generals under them, and Admins in their Organizations
      whereClause.OR = [
        { tier: 'organization', parentAgencyId: currentUserId },
        { tier: 'general', parentAgencyId: currentUserId },
        {
          tier: 'admin',
          parentOrganization: { parentAgencyId: currentUserId },
        },
        {
          tier: 'general',
          parentOrganization: { parentAgencyId: currentUserId },
        },
      ];
      break;

    case UserTier.organization:
      // Can see Admins and Generals in their org ONLY
      whereClause.parentOrganizationId = currentUserId;
      whereClause.tier = { in: ['admin', 'general'] };
      break;

    case UserTier.admin:
      // Can see Generals in same org ONLY
      whereClause.parentOrganizationId = currentUser.parentOrganizationId;
      whereClause.tier = 'general';
      break;

    case UserTier.general:
      // Can only see themselves
      whereClause.id = currentUserId;
      break;
  }

  // Apply additional filters
  if (userFilters?.tier) {
    whereClause.tier = userFilters.tier;
  }

  if (userFilters?.search) {
    const searchCondition = {
      OR: [
        { email: { contains: userFilters.search, mode: 'insensitive' } },
        { profile: { firstName: { contains: userFilters.search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: userFilters.search, mode: 'insensitive' } } },
      ],
    };

    if (whereClause.OR) {
      whereClause.AND = [{ OR: whereClause.OR }, searchCondition];
      delete whereClause.OR;
    } else {
      whereClause.OR = searchCondition.OR;
    }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
      take: userFilters?.limit || 50,
      skip: userFilters?.offset || 0,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  // Sanitize user data based on viewer's tier
  const sanitizedUsers = users.map((user) =>
    sanitizeUserData(user, currentUser.tier, currentUserId)
  );

  return { users: sanitizedUsers, total };
}

export default {
  checkUserVisibility,
  requireUserVisibility,
  sanitizeUserData,
  applyVisibilityFilters,
};
