import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  UserTier,
  HierarchyRequest
} from '../middleware/visibilityCheckRaw';
import {
  generateInviteCode,
  calculateReferralRewards,
  validateReferralRelationship,
  getAgencyReferralConfig,
  processReferralRewards,
  validateInviteCode
} from '../utils/referralUtils';

const prisma = new PrismaClient();

/**
 * Get user's invite link and QR code
 */
export async function getInviteLink(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's invite code
    const userResult = await prisma.$queryRaw`
      SELECT invite_code, tier FROM users WHERE id = ${req.user.id}
    ` as unknown as any[];

    const user = userResult[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let inviteCode = user.invite_code;
    
    // Generate invite code if user doesn't have one
    if (!inviteCode) {
      let isUnique = false;
      let attempts = 0;

      do {
        inviteCode = generateInviteCode();
        const existingResult = await prisma.$queryRaw`
          SELECT id FROM users WHERE invite_code = ${inviteCode}
        ` as unknown as any[];
        
        isUnique = existingResult.length === 0;
        attempts++;
        
        if (attempts > 100) {
          return res.status(500).json({ error: 'Failed to generate unique invite code' });
        }
      } while (!isUnique);

      // Save the invite code
      await prisma.$executeRaw`
        UPDATE users SET invite_code = ${inviteCode} WHERE id = ${req.user!.id}
      `;
    }

    const baseUrl = process.env.INVITE_BASE_URL || 'https://smartaihub.com/signup';
    const inviteLink = `${baseUrl}?invite=${inviteCode}`;

    // Generate QR code (simplified - in production you'd use a QR code library)
    const qrCode = `data:text/plain;base64,${Buffer.from(inviteLink).toString('base64')}`;

    res.json({
      inviteCode,
      inviteLink,
      qrCode,
      tier: user.tier
    });

  } catch (error) {
    console.error('Get invite link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get referral statistics for the current user
 */
export async function getReferralStats(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's tier and invite code
    const userResult = await prisma.$queryRaw`
      SELECT tier, invite_code FROM users WHERE id = ${req.user.id}
    ` as unknown as any[];

    const user = userResult[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count direct referrals
    const referralsResult = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN tier = 'organization' THEN 1 END) as organization_referrals,
        COUNT(CASE WHEN tier = 'admin' THEN 1 END) as admin_referrals,
        COUNT(CASE WHEN tier = 'general' THEN 1 END) as general_referrals
      FROM users 
      WHERE invited_by = ${req.user.id}
    ` as unknown as any[];

    // Get referral rewards
    const rewardsResult = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_rewards,
        COALESCE(SUM(referrer_reward_points), 0) as total_points_earned
      FROM referral_rewards 
      WHERE referrer_id = ${req.user.id} AND status = 'completed'
    ` as unknown as any[];

    // Get recent referrals
    const recentReferralsResult = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.email,
        u.tier,
        u.created_at,
        up.first_name,
        up.last_name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.invited_by = ${req.user.id}
      ORDER BY u.created_at DESC
      LIMIT 10
    ` as unknown as any[];

    const stats = {
      inviteCode: user.invite_code,
      tier: user.tier,
      totalReferrals: parseInt(referralsResult[0]?.total_referrals || '0'),
      organizationReferrals: parseInt(referralsResult[0]?.organization_referrals || '0'),
      adminReferrals: parseInt(referralsResult[0]?.admin_referrals || '0'),
      generalReferrals: parseInt(referralsResult[0]?.general_referrals || '0'),
      totalPointsEarned: parseInt(rewardsResult[0]?.total_points_earned || '0'),
      recentReferrals: recentReferralsResult.map((referral: any) => ({
        id: referral.id,
        email: referral.email,
        tier: referral.tier,
        firstName: referral.first_name,
        lastName: referral.last_name,
        joinedAt: referral.created_at
      }))
    };

    res.json(stats);

  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Register with invite code
 */
export async function registerWithInviteCode(req: Request, res: Response) {
  try {
    const { inviteCode, email, password, tier, firstName, lastName } = req.body;

    if (!inviteCode || !email || !password || !tier) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Invite code, email, password, and tier are required'
      });
    }

    // Validate tier
    if (!Object.values(UserTier).includes(tier)) {
      return res.status(400).json({ 
        error: 'Invalid tier',
        message: 'Tier must be one of: administrator, agency, organization, admin, general'
      });
    }

    // Find the referrer
    const referrerResult = await prisma.$queryRaw`
      SELECT id, tier FROM users WHERE invite_code = ${inviteCode}
    ` as unknown as any[];

    const referrer = referrerResult[0];
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if email already exists
    const existingUserResult = await prisma.$queryRaw`
      SELECT id FROM users WHERE email = ${email}
    ` as unknown as any[];

    if (existingUserResult.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Use database transaction for user creation and reward distribution
    const result = await prisma.$transaction(async (tx) => {
      // Create new user
      const newUserResult = await tx.$queryRaw`
        INSERT INTO users (
          email, 
          password_hash, 
          tier, 
          invited_by, 
          verified, 
          points, 
          credits,
          created_at,
          updated_at
        )
        VALUES (
          ${email}, 
          ${password}, -- In production, this should be hashed
          ${tier}, 
          ${referrer.id}, 
          true, 
          0, 
          0,
          NOW(),
          NOW()
        )
        RETURNING id, email, tier, points, credits, created_at
      ` as unknown as any[];

      const newUser = newUserResult[0];

      // Create user profile
      await tx.$executeRaw`
        INSERT INTO user_profiles (user_id, first_name, last_name, updated_at)
        VALUES (${newUser.id}, ${firstName || null}, ${lastName || null}, NOW())
      `;

      // Calculate rewards based on referrer and referee tiers
      let referrerRewardPoints = 0;
      let refereeRewardPoints = 1000; // Base reward
      let agencyBonusPoints = 0;

      if (referrer.tier === UserTier.general) {
        // General referrer: 2,000 Points
        referrerRewardPoints = 2000;
      } else if (referrer.tier === UserTier.organization) {
        // Organization referrer: 2,000 Points
        referrerRewardPoints = 2000;
        // New user automatically joins the Organization
        await tx.$executeRaw`
          UPDATE users SET parent_organization_id = ${referrer.id} WHERE id = ${newUser.id}
        `;
      } else if (referrer.tier === UserTier.agency) {
        // Agency referrer: Get agency's reward configuration
        const agencyConfigResult = await tx.$queryRaw`
          SELECT organization_reward_points, admin_reward_points, general_reward_points 
          FROM agency_referral_configs 
          WHERE agency_id = ${referrer.id} AND is_active = true
        ` as unknown as any[];

        const agencyConfig = agencyConfigResult[0];
        
        if (agencyConfig) {
          // Set agency bonus based on new user's tier
          if (tier === UserTier.organization) {
            agencyBonusPoints = agencyConfig.organization_reward_points;
          } else if (tier === UserTier.admin) {
            agencyBonusPoints = agencyConfig.admin_reward_points;
          } else if (tier === UserTier.general) {
            agencyBonusPoints = agencyConfig.general_reward_points;
          }

          // Deduct bonus from agency and give to new user
          if (agencyBonusPoints > 0) {
            await tx.$executeRaw`
              UPDATE users SET points = points - ${agencyBonusPoints} WHERE id = ${referrer.id}
            `;
            refereeRewardPoints += agencyBonusPoints;
          }

          // Set parent agency for new user
          await tx.$executeRaw`
            UPDATE users SET parent_agency_id = ${referrer.id} WHERE id = ${newUser.id}
          `;
        }
      }

      // Give base reward to new user
      await tx.$executeRaw`
        UPDATE users SET points = points + ${refereeRewardPoints} WHERE id = ${newUser.id}
      `;

      // Give reward to referrer
      if (referrerRewardPoints > 0) {
        await tx.$executeRaw`
          UPDATE users SET points = points + ${referrerRewardPoints} WHERE id = ${referrer.id}
        `;
      }

      // Create referral reward record
      await tx.$executeRaw`
        INSERT INTO referral_rewards (
          referrer_id, 
          referee_id, 
          referrer_tier, 
          referee_tier, 
          referrer_reward_points, 
          referee_reward_points, 
          agency_bonus_points, 
          agency_id, 
          status, 
          processed_at, 
          created_at
        )
        VALUES (
          ${referrer.id}, 
          ${newUser.id}, 
          ${referrer.tier}, 
          ${tier}, 
          ${referrerRewardPoints}, 
          ${refereeRewardPoints}, 
          ${agencyBonusPoints || null}, 
          ${referrer.tier === UserTier.agency ? referrer.id : null}, 
          'completed', 
          NOW(), 
          NOW()
        )
      `;

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          tier: newUser.tier,
          points: newUser.points + refereeRewardPoints,
          credits: newUser.credits,
          createdAt: newUser.created_at
        },
        rewards: {
          referrerRewardPoints,
          refereeRewardPoints,
          agencyBonusPoints
        }
      };
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully with referral rewards',
      ...result
    });

  } catch (error: any) {
    console.error('Register with invite code error:', error);
    
    if (error.message?.includes('duplicate key')) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * View referral rewards history
 */
export async function getReferralRewards(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { limit = 50, offset = 0, status } = req.query;

    // Build where clause
    let whereClause = 'WHERE referrer_id = $1';
    const params: any[] = [req.user.id];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const query = `
      SELECT 
        rr.*,
        u_referee.email as referee_email,
        u_referee.tier as referee_tier,
        up_referee.first_name as referee_first_name,
        up_referee.last_name as referee_last_name
      FROM referral_rewards rr
      JOIN users u_referee ON rr.referee_id = u_referee.id
      LEFT JOIN user_profiles up_referee ON u_referee.id = up_referee.user_id
      ${whereClause} 
      ORDER BY rr.created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM referral_rewards ${whereClause}
    `;

    params.push(parseInt(limit as string), parseInt(offset as string));

    const [rewards, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(query, ...params) as unknown as any[],
      prisma.$queryRawUnsafe(countQuery, ...params.slice(0, -2)) as unknown as any[]
    ]);

    res.json({
      rewards: rewards.map((reward: any) => ({
        id: reward.id,
        refereeId: reward.referee_id,
        refereeEmail: reward.referee_email,
        refereeTier: reward.referee_tier,
        refereeFirstName: reward.referee_first_name,
        refereeLastName: reward.referee_last_name,
        referrerTier: reward.referrer_tier,
        referrerRewardPoints: reward.referrer_reward_points,
        refereeRewardPoints: reward.referee_reward_points,
        agencyBonusPoints: reward.agency_bonus_points,
        agencyId: reward.agency_id,
        status: reward.status,
        processedAt: reward.processed_at,
        createdAt: reward.created_at
      })),
      total: parseInt(countResult[0]?.total || '0'),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error) {
    console.error('Get referral rewards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default {
  getInviteLink,
  getReferralStats,
  registerWithInviteCode,
  getReferralRewards
};