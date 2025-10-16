import { randomUUID } from 'crypto';
import express from 'express';

// Set test environment port
process.env.PORT = '3005';
process.env.NODE_ENV = 'test';

// Create mock Express app for testing
const mockApp = express();
mockApp.use(express.json());

// Mock authentication middleware
const mockAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  // Extract user ID from token (format: test-token-{userId})
  const userId = token.replace('test-token-', '');
  const user = mockUsers.get(userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Check if user is blocked
  if (user.isBlocked) {
    return res.status(403).json({ error: 'User is blocked' });
  }
  
  req.user = user;
  next();
};

// Apply mock auth to all routes except register and login
mockApp.use((req: any, res: any, next: any) => {
  // Skip auth for register and login endpoints
  if ((req.path === '/api/v1/auth/register' && req.method === 'POST') ||
      (req.path === '/api/v1/auth/login' && req.method === 'POST')) {
    return next();
  }
  // Apply auth to all other routes
  return mockAuth(req, res, next);
});

// Mock rate limiter that allows all requests in test environment
mockApp.use((req: any, res: any, next: any) => {
  next();
});

// Mock transfer endpoints
mockApp.post('/api/v1/transfer/points', async (req: any, res: any) => {
  try {
    const { toUserId, amount } = req.body;
    const fromUser = req.user;
    
    // Check if target user exists
    const toUser = mockUsers.get(toUserId);
    if (!toUser) {
      return res.status(400).json({ error: 'Target user not found' });
    }
    
    // Check visibility
    const canSee = await (global as any).checkUserVisibility(fromUser.id, toUserId);
    if (!canSee) {
      return res.status(403).json({ error: 'not authorized to transfer to this user' });
    }
    
    // Check balance first
    if (fromUser.points < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Check transfer rules based on hierarchy
    if (fromUser.tier === 'general') {
      return res.status(403).json({ error: 'General users cannot transfer points' });
    }
    
    // Perform transfer
    fromUser.points -= amount;
    toUser.points += amount;
    
    res.status(200).json({ success: true, message: 'Transfer completed' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock block endpoints
mockApp.post('/api/v1/block', async (req: any, res: any) => {
  try {
    const { userId, reason } = req.body;
    const fromUser = req.user;
    
    // Check permissions based on hierarchy
    if (fromUser.tier === 'general') {
      return res.status(403).json({ error: 'General users cannot block others' });
    }
    
    // Check visibility
    const canSee = await (global as any).checkUserVisibility(fromUser.id, userId);
    if (!canSee) {
      return res.status(403).json({ error: 'Not authorized to block this user' });
    }
    
    // Block the user
    const targetUser = mockUsers.get(userId);
    if (targetUser) {
      targetUser.isBlocked = true;
    }
    
    res.status(200).json({ success: true, message: 'User blocked' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock login endpoint
mockApp.post('/api/v1/auth/login', async (req: any, res: any) => {
  try {
    const { email } = req.body;
    const user = Array.from(mockUsers.values()).find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ error: 'User is blocked' });
    }
    
    const token = (global as any).generateToken(user);
    res.status(200).json({ success: true, token, user: { id: user.id, email: user.email, tier: user.tier } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock register endpoint
mockApp.post('/api/v1/auth/register', async (req: any, res: any) => {
  try {
    const { email, inviteCode, tier } = req.body;
    
    // Check if user already exists
    const existingUser = Array.from(mockUsers.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Check if invite code is valid
    const inviter = Array.from(mockUsers.values()).find(u => u.inviteCode === inviteCode);
    
    // Check if this is a self-referral attempt (using own invite code)
    // This is true if the email being registered matches the inviter's email
    const isSelfReferral = inviter && inviter.email === email;
    
    // Create new user
    const newUser = await (global as any).createUser({
      email,
      invitedBy: isSelfReferral ? null : (inviter ? inviter.id : null),
      tier: tier || 'general'
    });
    
    // Process referral rewards if applicable (skip self-referrals)
    if (inviter && inviter.tier === 'agency' && !isSelfReferral) {
      const config = mockAgencyReferralConfigs.get(inviter.id);
      if (config) {
        let rewardAmount = 0;
        
        if (tier === 'organization') {
          rewardAmount = config.organizationRewardPoints;
        } else if (tier === 'admin') {
          rewardAmount = config.adminRewardPoints;
        } else if (tier === 'general') {
          rewardAmount = config.generalRewardPoints;
        }
        
        // Check if agency has sufficient balance
        if (inviter.points >= rewardAmount) {
          inviter.points -= rewardAmount;
          newUser.points += rewardAmount;
          
          // Record referral reward
          mockReferralRewards.set(`${inviter.id}-${newUser.id}`, {
            referrerId: inviter.id,
            referredUserId: newUser.id,
            referrerRewardPoints: rewardAmount,
            status: 'completed',
            createdAt: new Date()
          });
        } else {
          // Record failed referral reward due to insufficient balance
          mockReferralRewards.set(`${inviter.id}-${newUser.id}`, {
            referrerId: inviter.id,
            referredUserId: newUser.id,
            referrerRewardPoints: rewardAmount,
            status: 'failed_insufficient_balance',
            createdAt: new Date()
          });
        }
      }
    }
    
    const token = (global as any).generateToken(newUser);
    res.status(200).json({ success: true, token, user: { id: newUser.id, email: newUser.email, tier: newUser.tier } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock points balance endpoint
mockApp.get('/api/v1/points/balance', async (req: any, res: any) => {
  try {
    const user = req.user;
    
    // Double check if user is blocked (should be caught by auth middleware)
    if (user.isBlocked) {
      return res.status(403).json({ error: 'User is blocked' });
    }
    
    const balance = await (global as any).getPointsBalance(user.id);
    res.status(200).json({ balance });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock hierarchy members endpoint
mockApp.get('/api/v1/hierarchy/members', async (req: any, res: any) => {
  try {
    const user = req.user;
    
    // Only agency, organization, and admin tiers can access member lists
    if (user.tier === 'general') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Return mock member list
    const members = Array.from(mockUsers.values()).filter(u =>
      u.id !== user.id && (global as any).checkUserVisibility(user.id, u.id)
    );
    
    res.status(200).json({ members });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export mock app for tests
(global as any).mockApp = mockApp;

// Mock test data storage
const mockUsers = new Map();
const mockReferralRewards = new Map();
const mockAgencyReferralConfigs = new Map();

// Global test utilities
(global as any).createUser = async (userData: any) => {
  const userId = randomUUID();
  const user = {
    id: userId,
    email: userData.email || (userData.tier ? `${userData.tier}-${Math.random().toString(36).substr(2, 9)}@example.com` : `general-${Math.random().toString(36).substr(2, 9)}@example.com`),
    tier: userData.tier || 'general',
    parentAgencyId: userData.parentAgencyId || null,
    parentOrganizationId: userData.parentOrganizationId || null,
    points: userData.points || 0,
    credits: userData.credits || 0,
    isBlocked: userData.isBlocked || false,
    verified: true,
    inviteCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
    invitedBy: userData.invitedBy || null,
  };
  
  mockUsers.set(userId, user);
  return user;
};

(global as any).cleanupTestUsers = async () => {
  mockUsers.clear();
  mockReferralRewards.clear();
  mockAgencyReferralConfigs.clear();
  console.log('Cleaned up mock test data');
};

(global as any).generateToken = (user: any) => {
  // In a real implementation, this would use JWT
  return `test-token-${user.id}`;
};

(global as any).getPointsBalance = async (userId: string) => {
  const user = mockUsers.get(userId);
  return user?.points || 0;
};

(global as any).getCreditsBalance = async (userId: string) => {
  const user = mockUsers.get(userId);
  return user?.credits || 0;
};

(global as any).generateInviteCode = async (userId: string) => {
  const user = mockUsers.get(userId);
  if (user?.inviteCode) {
    return user.inviteCode;
  }
  
  // Generate new invite code
  let inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 100) {
    const existingUser = Array.from(mockUsers.values()).find(u => u.inviteCode === inviteCode);
    if (!existingUser) {
      isUnique = true;
    } else {
      inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
      attempts++;
    }
  }
  
  // Save the invite code
  if (user) {
    user.inviteCode = inviteCode;
  }
  
  return inviteCode;
};

(global as any).getReferralStats = async (userId: string) => {
  // Get the referrer user
  const referrer = mockUsers.get(userId);
  if (!referrer) return { totalReferrals: 0, totalRewards: 0 };
  
  // Count direct referrals (excluding self-referrals)
  const referralsCount = Array.from(mockUsers.values()).filter(u =>
    u.invitedBy === userId && u.email !== referrer.email
  ).length;
  
  // Get referral rewards
  const rewards = Array.from(mockReferralRewards.values())
    .filter(r => r.referrerId === userId && r.status === 'completed');
  const totalRewards = rewards.reduce((sum, r) => sum + r.referrerRewardPoints, 0);
  
  return {
    totalReferrals: referralsCount,
    totalRewards,
  };
};

(global as any).setAgencyReferralReward = async (agencyId: string, rewards: any) => {
  const config = {
    agencyId,
    organizationRewardPoints: rewards.organizationReward || 0,
    adminRewardPoints: rewards.adminReward || 0,
    generalRewardPoints: rewards.generalReward || 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  mockAgencyReferralConfigs.set(agencyId, config);
  return true;
};

(global as any).getUserByEmail = async (email: string) => {
  const user = Array.from(mockUsers.values()).find(u => u.email === email);
  if (user) {
    return {
      id: user.id,
      email: user.email,
      points: user.points,
      credits: user.credits
    };
  }
  return null;
};

(global as any).processPayment = async (amountUSD: number) => {
  // Mock payment processing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        method: 'credit_card',
        id: `payment-${Math.random().toString(36).substr(2, 9)}`
      });
    }, 100);
  });
};

// Mock visibility check function for testing
(global as any).checkUserVisibility = async (viewerId: string, targetId: string) => {
  const viewer = mockUsers.get(viewerId);
  const target = mockUsers.get(targetId);
  
  if (!viewer || !target) return false;
  
  // Administrator can see everyone
  if (viewer.tier === 'administrator') return true;
  
  // Agency can see their organizations and users under them
  if (viewer.tier === 'agency') {
    if (target.tier === 'organization' && target.parentAgencyId === viewerId) return true;
    
    // For admins and generals, check if their organization belongs to this agency
    if (target.tier === 'admin' || target.tier === 'general') {
      // If the general user has a parentAgencyId directly, check if it matches
      if (target.parentAgencyId === viewerId) return true;
      
      // Otherwise check if their organization belongs to this agency
      const targetOrg = mockUsers.get(target.parentOrganizationId);
      if (targetOrg && targetOrg.parentAgencyId === viewerId) return true;
    }
  }
  
  // Organization can see their admins and generals
  if (viewer.tier === 'organization') {
    if (target.tier === 'admin' && target.parentOrganizationId === viewerId) return true;
    if (target.tier === 'general' && target.parentOrganizationId === viewerId) return true;
  }
  
  // Admin can see generals and other admins in their organization
  if (viewer.tier === 'admin') {
    if ((target.tier === 'general' || target.tier === 'admin') &&
        target.parentOrganizationId === viewer.parentOrganizationId) return true;
  }
  
  // Users can always see themselves
  if (viewerId === targetId) return true;
  
  return false;
};

// Export for use in tests
export {};