import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Define UserTier enum to match database schema
export enum UserTier {
  administrator = 'administrator',
  agency = 'agency',
  organization = 'organization',
  admin = 'admin',
  general = 'general',
}

// Define ReferralStatus enum to match database schema
export enum ReferralStatus {
  pending = 'pending',
  processed = 'processed',
  failed = 'failed',
}

/**
 * Generate a unique invite code
 */
export function generateInviteCode(): string {
  const bytes = randomBytes(6);
  return bytes.toString('hex').toUpperCase();
}

/**
 * Calculate referral rewards based on referrer and referee tiers
 */
export function calculateReferralRewards(
  referrerTier: UserTier,
  refereeTier: UserTier
): { referrerRewardPoints: number; refereeRewardPoints: number; agencyBonusPoints: number } {
  // Default rewards
  let referrerRewardPoints = 0;
  let refereeRewardPoints = 0;
  let agencyBonusPoints = 0;

  // Referrer rewards based on their tier
  switch (referrerTier) {
    case UserTier.administrator:
      referrerRewardPoints = 1000;
      break;
    case UserTier.agency:
      referrerRewardPoints = 500;
      agencyBonusPoints = 200; // Agency gets bonus for referrals
      break;
    case UserTier.organization:
      referrerRewardPoints = 300;
      break;
    case UserTier.admin:
      referrerRewardPoints = 200;
      break;
    case UserTier.general:
      referrerRewardPoints = 100;
      break;
  }

  // Referee rewards based on their tier
  switch (refereeTier) {
    case UserTier.administrator:
      refereeRewardPoints = 500;
      break;
    case UserTier.agency:
      refereeRewardPoints = 300;
      break;
    case UserTier.organization:
      refereeRewardPoints = 200;
      break;
    case UserTier.admin:
      refereeRewardPoints = 150;
      break;
    case UserTier.general:
      refereeRewardPoints = 100;
      break;
  }

  return {
    referrerRewardPoints,
    refereeRewardPoints,
    agencyBonusPoints,
  };
}

/**
 * Validate referral relationship between referrer and referee
 */
export async function validateReferralRelationship(
  referrerId: string,
  refereeId: string
): Promise<boolean> {
  try {
    // Check if referrer exists
    const referrerResult = (await prisma.$queryRaw`
      SELECT id, tier FROM users WHERE id = ${referrerId}
    `) as unknown as any[];

    if (!referrerResult.length) {
      return false;
    }

    // Check if referee exists
    const refereeResult = (await prisma.$queryRaw`
      SELECT id, tier FROM users WHERE id = ${refereeId}
    `) as unknown as any[];

    if (!refereeResult.length) {
      return false;
    }

    const referrer = referrerResult[0];
    const referee = refereeResult[0];

    // Apply visibility rules to validate relationship
    // Administrator can refer anyone
    if (referrer.tier === UserTier.administrator) {
      return true;
    }

    // Agency can refer organizations, admins, and generals
    if (referrer.tier === UserTier.agency) {
      return [UserTier.organization, UserTier.admin, UserTier.general].includes(referee.tier);
    }

    // Organization can refer admins and generals
    if (referrer.tier === UserTier.organization) {
      return [UserTier.admin, UserTier.general].includes(referee.tier);
    }

    // Admin can refer generals
    if (referrer.tier === UserTier.admin) {
      return referee.tier === UserTier.general;
    }

    // General cannot refer others
    if (referrer.tier === UserTier.general) {
      return false;
    }

    return false;
  } catch (error) {
    console.error('Error validating referral relationship:', error);
    return false;
  }
}

/**
 * Get agency referral configuration
 */
export async function getAgencyReferralConfig(agencyId: string): Promise<any> {
  try {
    const configResult = (await prisma.$queryRaw`
      SELECT * FROM agency_referral_configs WHERE agency_id = ${agencyId} AND is_active = true
    `) as unknown as any[];

    return configResult.length ? configResult[0] : null;
  } catch (error) {
    console.error('Error getting agency referral config:', error);
    return null;
  }
}

/**
 * Process referral rewards
 */
export async function processReferralRewards(
  referrerId: string,
  refereeId: string,
  referrerTier: UserTier,
  refereeTier: UserTier
): Promise<string> {
  try {
    const rewards = calculateReferralRewards(referrerTier, refereeTier);

    // Create referral reward record
    const rewardResult = (await prisma.$queryRaw`
      INSERT INTO referral_rewards (
        referrer_id, referee_id, referrer_tier, referee_tier,
        referrer_reward_points, referee_reward_points, agency_bonus_points,
        status, created_at
      ) VALUES (
        ${referrerId}, ${refereeId}, ${referrerTier}, ${refereeTier},
        ${rewards.referrerRewardPoints}, ${rewards.refereeRewardPoints}, ${rewards.agencyBonusPoints},
        ${ReferralStatus.pending}, NOW()
      ) RETURNING id
    `) as unknown as any[];

    const rewardId = rewardResult[0].id;

    // Process rewards in a transaction
    await prisma.$transaction(async (tx) => {
      // Award points to referrer
      if (rewards.referrerRewardPoints > 0) {
        await tx.$executeRaw`
          UPDATE users SET points = points + ${rewards.referrerRewardPoints} WHERE id = ${referrerId}
        `;
      }

      // Award points to referee
      if (rewards.refereeRewardPoints > 0) {
        await tx.$executeRaw`
          UPDATE users SET points = points + ${rewards.refereeRewardPoints} WHERE id = ${refereeId}
        `;
      }

      // Award agency bonus if applicable
      if (rewards.agencyBonusPoints > 0 && referrerTier === UserTier.agency) {
        await tx.$executeRaw`
          UPDATE users SET points = points + ${rewards.agencyBonusPoints} WHERE id = ${referrerId}
        `;
      }

      // Mark reward as processed
      await tx.$executeRaw`
        UPDATE referral_rewards SET status = ${ReferralStatus.processed}, processed_at = NOW() WHERE id = ${rewardId}
      `;
    });

    return rewardId;
  } catch (error) {
    console.error('Error processing referral rewards:', error);
    throw error;
  }
}

/**
 * Check if invite code is valid and get referrer information
 */
export async function validateInviteCode(inviteCode: string): Promise<any> {
  try {
    const result = (await prisma.$queryRaw`
      SELECT id, email, tier FROM users WHERE invite_code = ${inviteCode}
    `) as unknown as any[];

    return result.length ? result[0] : null;
  } catch (error) {
    console.error('Error validating invite code:', error);
    return null;
  }
}
