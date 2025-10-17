import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserTier, HierarchyRequest } from '../middleware/visibilityCheckRaw';
import { checkUserVisibility } from '../middleware/visibilityCheckRaw';

const prisma = new PrismaClient();

/**
 * Block a user (only higher tier users can block lower tier users)
 */
export async function blockUser(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    // Prevent blocking self
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Get current user data
    const currentUserResult = (await prisma.$queryRaw`
      SELECT id, tier FROM users WHERE id = ${req.user.id}
    `) as unknown as any[];

    if (!currentUserResult.length) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    const currentUser = currentUserResult[0];

    // Get target user data
    const targetUserResult = (await prisma.$queryRaw`
      SELECT id, tier FROM users WHERE id = ${targetUserId}
    `) as unknown as any[];

    if (!targetUserResult.length) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const targetUser = targetUserResult[0];

    // Check if current user can see target user (visibility check)
    const canSee = await checkUserVisibility(req.user.id, targetUserId);
    if (!canSee) {
      return res.status(403).json({ error: 'Cannot block user outside your hierarchy' });
    }

    // Check hierarchy rules for blocking
    const canBlock = await canBlockUser(currentUser.tier, targetUser.tier);
    if (!canBlock) {
      return res.status(403).json({
        error: 'Insufficient privileges to block this user',
        message: 'You can only block users of lower tier in your hierarchy',
      });
    }

    // Check if user is already blocked
    const existingBlockResult = (await prisma.$queryRaw`
      SELECT id FROM block_logs 
      WHERE blocker_id = ${req.user.id} AND blocked_id = ${targetUserId} AND is_active = true
    `) as unknown as any[];

    if (existingBlockResult.length > 0) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    // Block the user
    await prisma.$queryRaw`
      INSERT INTO block_logs (
        blocker_id, blocked_id, blocker_tier, blocked_tier,
        block_reason, is_active, created_at
      ) VALUES (
        ${req.user.id}, ${targetUserId}, ${currentUser.tier}, ${targetUser.tier},
        ${req.body.reason || 'Blocked by user'}, true, NOW()
      )
    `;

    res.json({
      message: 'User blocked successfully',
      blockedUserId: targetUserId,
      blockedBy: req.user.id,
      blockedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    // Check if block exists
    const existingBlockResult = (await prisma.$queryRaw`
      SELECT id FROM block_logs 
      WHERE blocker_id = ${req.user.id} AND blocked_id = ${targetUserId} AND is_active = true
    `) as unknown as any[];

    if (existingBlockResult.length === 0) {
      return res.status(400).json({ error: 'User is not blocked' });
    }

    // Unblock the user
    await prisma.$queryRaw`
      UPDATE block_logs 
      SET is_active = false, unblocked_at = NOW() 
      WHERE blocker_id = ${req.user.id} AND blocked_id = ${targetUserId} AND is_active = true
    `;

    res.json({
      message: 'User unblocked successfully',
      unblockedUserId: targetUserId,
      unblockedBy: req.user.id,
      unblockedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
}

/**
 * Get list of blocked users
 */
export async function getBlockedUsers(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get blocked users with pagination
    const blockedUsersResult = (await prisma.$queryRaw`
      SELECT 
        bl.id,
        bl.blocked_id,
        bl.block_reason,
        bl.created_at as blocked_at,
        bl.unblocked_at,
        u.email,
        u.tier,
        up.first_name,
        up.last_name
      FROM block_logs bl
      JOIN users u ON bl.blocked_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE bl.blocker_id = ${req.user.id} AND bl.is_active = true
      ORDER BY bl.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as any[];

    // Get total count
    const countResult = (await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM block_logs
      WHERE blocker_id = ${req.user.id} AND is_active = true
    `) as unknown as any[];

    const total = parseInt(countResult[0]?.total || '0');

    res.json({
      blockedUsers: blockedUsersResult.map((block: any) => ({
        id: block.id,
        userId: block.blocked_id,
        email: block.email,
        tier: block.tier,
        firstName: block.first_name,
        lastName: block.last_name,
        reason: block.block_reason,
        blockedAt: block.blocked_at,
        unblockedAt: block.unblocked_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting blocked users:', error);
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
}

/**
 * Check if a user can block another user based on hierarchy
 */
async function canBlockUser(blockerTier: UserTier, blockedTier: UserTier): Promise<boolean> {
  // Administrator can block anyone
  if (blockerTier === UserTier.administrator) {
    return true;
  }

  // Agency can block organizations, admins, and generals
  if (blockerTier === UserTier.agency) {
    return [UserTier.organization, UserTier.admin, UserTier.general].includes(blockedTier);
  }

  // Organization can block admins and generals
  if (blockerTier === UserTier.organization) {
    return [UserTier.admin, UserTier.general].includes(blockedTier);
  }

  // Admin can block generals
  if (blockerTier === UserTier.admin) {
    return blockedTier === UserTier.general;
  }

  // General cannot block others
  if (blockerTier === UserTier.general) {
    return false;
  }

  return false;
}

/**
 * Check if current user is blocked by target user
 */
export async function checkIfBlocked(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { targetUserId } = req.params;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    // Check if current user is blocked by target user
    const blockResult = (await prisma.$queryRaw`
      SELECT id, block_reason, created_at
      FROM block_logs
      WHERE blocker_id = ${targetUserId} AND blocked_id = ${req.user.id} AND is_active = true
    `) as unknown as any[];

    const isBlocked = blockResult.length > 0;

    res.json({
      isBlocked,
      blockedBy: isBlocked
        ? {
            userId: targetUserId,
            reason: blockResult[0].block_reason,
            blockedAt: blockResult[0].created_at,
          }
        : null,
    });
  } catch (error) {
    console.error('Error checking block status:', error);
    res.status(500).json({ error: 'Failed to check block status' });
  }
}
