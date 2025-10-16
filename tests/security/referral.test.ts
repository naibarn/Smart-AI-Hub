import request from 'supertest';
// Mock app will be available globally from setup.ts
declare global {
  var mockApp: any;
}

describe('Referral System Security', () => {
  describe('Self-Referral Prevention', () => {
    it('should prevent user from using their own invite code', async () => {
      const user = await (global as any).createUser({ tier: 'general' });
      // Invite code is already generated in createUser
      const inviteCode = user.inviteCode;
      
      // Try to register with the same email as the user (self-referral)
      const response = await request((global as any).mockApp)
        .post('/api/v1/auth/register')
        .send({
          email: user.email, // Use the same email
          inviteCode: inviteCode
        });
      
      // Should return an error because user already exists
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
      
      // Check that no referral was counted
      const stats = await (global as any).getReferralStats(user.id);
      expect(stats.totalReferrals).toBe(0);
    });
  });
  
  describe('Agency Referral Rewards', () => {
    it('should deduct from Agency balance when giving referral rewards', async () => {
      const agency = await (global as any).createUser({ tier: 'agency', points: 10000 });
      
      // Set custom referral reward
      await (global as any).setAgencyReferralReward(agency.id, {
        organizationReward: 5000,
        adminReward: 2000,
        generalReward: 1000
      });
      
      const initialBalance = await (global as any).getPointsBalance(agency.id);
      
      // Generate invite code
      const inviteCode = await (global as any).generateInviteCode(agency.id);
      
      // Register new user with invite code
      await request((global as any).mockApp)
        .post('/api/v1/auth/register')
        .send({
          email: 'neworg@example.com',
          tier: 'organization',
          inviteCode: inviteCode
        });
      
      const finalBalance = await (global as any).getPointsBalance(agency.id);
      expect(finalBalance).toBe(initialBalance - 5000);
    });
    
    it('should not give reward if Agency has insufficient balance', async () => {
      const agency = await (global as any).createUser({ tier: 'agency', points: 100 });
      
      await (global as any).setAgencyReferralReward(agency.id, {
        generalReward: 1000
      });
      
      const inviteCode = await (global as any).generateInviteCode(agency.id);
      
      const response = await request((global as any).mockApp)
        .post('/api/v1/auth/register')
        .send({
          email: 'newgeneral@example.com',
          tier: 'general', // Explicitly set the tier
          inviteCode: inviteCode
        });
      
      // Should still register but no reward
      expect(response.status).toBe(200);
      
      const newUser = await (global as any).getUserByEmail('newgeneral@example.com');
      expect(newUser.points).toBe(0);
    });
  });
});