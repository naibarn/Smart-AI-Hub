import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserTier, HierarchyRequest } from '../middleware/visibilityCheckRaw';
import {
  applyVisibilityFilters,
  sanitizeUserData,
  checkUserVisibility,
} from '../middleware/visibilityCheckRaw';

const prisma = new PrismaClient();

/**
 * Get hierarchy members list with visibility filters
 */
export async function getHierarchyMembers(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const tier = req.query.tier as string;
    const search = req.query.search as string;

    // Get current user data
    const currentUserResult = (await prisma.$queryRaw`
      SELECT id, tier FROM users WHERE id = ${req.user.id}
    `) as unknown as any[];

    if (!currentUserResult.length) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    const currentUser = currentUserResult[0];

    // Build user filters
    const userFilters: any = {
      limit,
      offset,
    };

    if (tier && Object.values(UserTier).includes(tier as UserTier)) {
      userFilters.tier = tier as UserTier;
    }

    if (search) {
      userFilters.search = search;
    }

    // Apply visibility filters
    const result = await applyVisibilityFilters(req.user.id, userFilters);

    // Get total count with same filters
    const countResult = await applyVisibilityFilters(req.user.id, { ...userFilters, limit: 10000 });
    const total = countResult.total;

    // Sanitize user data based on visibility rules
    const sanitizedMembers = result.users;

    res.json({
      members: sanitizedMembers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        tier,
        search,
      },
    });
  } catch (error) {
    console.error('Error getting hierarchy members:', error);
    res.status(500).json({ error: 'Failed to get hierarchy members' });
  }
}

/**
 * Get hierarchy statistics
 */
export async function getHierarchyStats(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get current user data
    const currentUserResult = (await prisma.$queryRaw`
      SELECT id, tier FROM users WHERE id = ${req.user.id}
    `) as unknown as any[];

    if (!currentUserResult.length) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    const currentUser = currentUserResult[0];

    // Get all visible users for statistics
    const allUsersResult = await applyVisibilityFilters(req.user.id, { limit: 10000 });

    // Calculate tier statistics
    const tierStats: any = {};
    allUsersResult.users.forEach((user: any) => {
      tierStats[user.tier] = (tierStats[user.tier] || 0) + 1;
    });

    // Calculate total points and credits
    const totalPoints = allUsersResult.users.reduce(
      (sum: number, user: any) => sum + (user.points || 0),
      0
    );
    const totalCredits = allUsersResult.users.reduce(
      (sum: number, user: any) => sum + (user.credits || 0),
      0
    );

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = allUsersResult.users.filter(
      (user: any) => new Date(user.createdAt) >= thirtyDaysAgo
    );

    const stats = {
      tierStats,
      totalPoints,
      totalCredits,
      totalUsers: allUsersResult.total,
      recentRegistrations: recentUsers.length,
      currentUserTier: currentUser.tier,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting hierarchy stats:', error);
    res.status(500).json({ error: 'Failed to get hierarchy statistics' });
  }
}

/**
 * Get user details with visibility checks
 */
export async function getUserDetails(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get current user data
    const currentUserResult = (await prisma.$queryRaw`
      SELECT id, tier FROM users WHERE id = ${req.user.id}
    `) as unknown as any[];

    if (!currentUserResult.length) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    const currentUser = currentUserResult[0];

    // Check if current user can see target user
    const canSee = await checkUserVisibility(req.user.id, userId);

    if (!canSee) {
      return res.status(403).json({ error: 'User not found or access denied' });
    }

    // Get user details
    const userResult = (await prisma.$queryRaw`
      SELECT 
        u.id,
        u.email,
        u.tier,
        u.points,
        u.credits,
        u.verified,
        u.created_at,
        u.updated_at,
        u.invite_code,
        u.parent_agency_id,
        u.parent_organization_id,
        up.first_name,
        up.last_name,
        up.phone,
        up.avatar_url,
        up.bio,
        up.address,
        up.city,
        up.country,
        up.date_of_birth
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ${userId}
    `) as unknown as any[];

    if (!userResult.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // Sanitize user data based on visibility rules
    const sanitizedUser = sanitizeUserData(user, currentUser.tier, req.user.id);

    // Get referral statistics if user can see them
    let referralStats = null;
    if (
      currentUser.tier === UserTier.administrator ||
      currentUser.tier === UserTier.agency ||
      (currentUser.tier === UserTier.organization && user.parent_organization_id === req.user.id)
    ) {
      const referralResult = (await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_referrals,
          COUNT(CASE WHEN tier = 'organization' THEN 1 END) as organization_referrals,
          COUNT(CASE WHEN tier = 'admin' THEN 1 END) as admin_referrals,
          COUNT(CASE WHEN tier = 'general' THEN 1 END) as general_referrals
        FROM users
        WHERE invited_by = ${userId}
      `) as unknown as any[];

      referralStats = referralResult[0];
    }

    res.json({
      user: sanitizedUser,
      referralStats,
    });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
}

/**
 * Get hierarchy tree structure
 */
export async function getHierarchyTree(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get current user data
    const currentUserResult = (await prisma.$queryRaw`
      SELECT id, tier, parent_agency_id, parent_organization_id FROM users WHERE id = ${req.user.id}
    `) as unknown as any[];

    if (!currentUserResult.length) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    const currentUser = currentUserResult[0];

    // Build hierarchy tree based on user tier
    let tree = null;

    if (currentUser.tier === UserTier.administrator) {
      // Administrator can see entire hierarchy
      tree = await buildFullHierarchyTree();
    } else if (currentUser.tier === UserTier.agency) {
      // Agency can see their subtree
      tree = await buildAgencyHierarchyTree(req.user.id);
    } else if (currentUser.tier === UserTier.organization) {
      // Organization can see their subtree
      tree = await buildOrganizationHierarchyTree(req.user.id);
    } else if (currentUser.tier === UserTier.admin) {
      // Admin can see generals in their organization
      tree = await buildAdminHierarchyTree(req.user.id);
    } else {
      // General users have no hierarchy under them
      tree = {
        id: req.user.id,
        tier: currentUser.tier,
        children: [],
      };
    }

    res.json({ tree });
  } catch (error) {
    console.error('Error getting hierarchy tree:', error);
    res.status(500).json({ error: 'Failed to get hierarchy tree' });
  }
}

/**
 * Build full hierarchy tree for administrators
 */
async function buildFullHierarchyTree(): Promise<any> {
  const result = (await prisma.$queryRaw`
    SELECT 
      id, tier, parent_agency_id, parent_organization_id,
      email, first_name, last_name, points, credits
    FROM users
    ORDER BY tier, created_at
  `) as unknown as any[];

  return buildTreeFromArray(result);
}

/**
 * Build agency hierarchy tree
 */
async function buildAgencyHierarchyTree(agencyId: string): Promise<any> {
  const result = (await prisma.$queryRaw`
    SELECT 
      id, tier, parent_agency_id, parent_organization_id,
      email, first_name, last_name, points, credits
    FROM users
    WHERE parent_agency_id = ${agencyId} OR id = ${agencyId}
    ORDER BY tier, created_at
  `) as unknown as any[];

  return buildTreeFromArray(result);
}

/**
 * Build organization hierarchy tree
 */
async function buildOrganizationHierarchyTree(orgId: string): Promise<any> {
  const result = (await prisma.$queryRaw`
    SELECT 
      id, tier, parent_agency_id, parent_organization_id,
      email, first_name, last_name, points, credits
    FROM users
    WHERE parent_organization_id = ${orgId} OR id = ${orgId}
    ORDER BY tier, created_at
  `) as unknown as any[];

  return buildTreeFromArray(result);
}

/**
 * Build admin hierarchy tree
 */
async function buildAdminHierarchyTree(adminId: string): Promise<any> {
  // Get admin's organization first
  const adminResult = (await prisma.$queryRaw`
    SELECT parent_organization_id FROM users WHERE id = ${adminId}
  `) as unknown as any[];

  if (!adminResult.length || !adminResult[0].parent_organization_id) {
    return { id: adminId, tier: 'admin', children: [] };
  }

  const orgId = adminResult[0].parent_organization_id;

  const result = (await prisma.$queryRaw`
    SELECT 
      id, tier, parent_agency_id, parent_organization_id,
      email, first_name, last_name, points, credits
    FROM users
    WHERE (parent_organization_id = ${orgId} AND tier = 'general') OR id = ${adminId}
    ORDER BY tier, created_at
  `) as unknown as any[];

  return buildTreeFromArray(result);
}

/**
 * Build tree structure from flat array
 */
function buildTreeFromArray(users: any[]): any {
  const userMap = new Map();
  const roots: any[] = [];

  // Create user map
  users.forEach((user) => {
    userMap.set(user.id, {
      ...user,
      children: [],
    });
  });

  // Build tree
  users.forEach((user) => {
    const userNode = userMap.get(user.id);

    if (user.tier === 'administrator' || user.tier === 'agency') {
      roots.push(userNode);
    } else if (user.parent_agency_id && userMap.has(user.parent_agency_id)) {
      userMap.get(user.parent_agency_id).children.push(userNode);
    } else if (user.parent_organization_id && userMap.has(user.parent_organization_id)) {
      userMap.get(user.parent_organization_id).children.push(userNode);
    }
  });

  return roots.length === 1 ? roots[0] : roots;
}
