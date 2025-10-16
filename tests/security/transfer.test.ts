import request from 'supertest';
// Mock app will be available globally from setup.ts
declare global {
  var mockApp: any;
}

describe('Transfer Authorization', () => {
  let agency: any, org: any, admin: any, general1: any, general2: any;
  let agencyToken: string, orgToken: string, adminToken: string, generalToken: string;
  
  beforeAll(async () => {
    // Create test hierarchy
    agency = await (global as any).createUser({ tier: 'agency', points: 10000, credits: 100 });
    org = await (global as any).createUser({ tier: 'organization', parentAgencyId: agency.id, points: 5000, credits: 50 });
    admin = await (global as any).createUser({ tier: 'admin', parentOrganizationId: org.id, points: 1000, credits: 10 });
    general1 = await (global as any).createUser({ tier: 'general', parentOrganizationId: org.id, points: 500, credits: 5 });
    general2 = await (global as any).createUser({ tier: 'general', parentOrganizationId: org.id, points: 500, credits: 5 });
    
    agencyToken = (global as any).generateToken(agency);
    orgToken = (global as any).generateToken(org);
    adminToken = (global as any).generateToken(admin);
    generalToken = (global as any).generateToken(general1);
  });
  
  describe('Valid Transfers', () => {
    it('Agency can transfer to Organization', async () => {
      const response = await request((global as any).mockApp)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          toUserId: org.id,
          amount: 1000
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('Organization can transfer to Admin', async () => {
      const response = await request((global as any).mockApp)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          toUserId: admin.id,
          amount: 500
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('Admin can transfer to General', async () => {
      const response = await request((global as any).mockApp)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          toUserId: general1.id,
          amount: 100
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('Invalid Transfers', () => {
    it('should reject transfer to user not visible', async () => {
      const otherOrg = await (global as any).createUser({ tier: 'organization', parentAgencyId: 'other-agency' });
      
      const response = await request((global as any).mockApp)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          toUserId: otherOrg.id,
          amount: 1000
        });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('not authorized');
    });
    
    it('should reject transfer with insufficient balance', async () => {
      const response = await request((global as any).mockApp)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${generalToken}`)
        .send({
          toUserId: general1.id, // Transfer to themselves
          amount: 10000
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Insufficient');
    });
    
    it('should reject General transferring to another General', async () => {
      const response = await request((global as any).mockApp)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${generalToken}`)
        .send({
          toUserId: general2.id,
          amount: 100
        });
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('Transaction Atomicity', () => {
    it('should rollback on error', async () => {
      const initialBalance = await (global as any).getPointsBalance(agency.id);
      
      // Try to transfer to non-existent user
      const response = await request((global as any).mockApp)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          toUserId: 'non-existent-id',
          amount: 1000
        });
      
      expect(response.status).toBe(400);
      
      const finalBalance = await (global as any).getPointsBalance(agency.id);
      expect(finalBalance).toBe(initialBalance);
    });
  });
});