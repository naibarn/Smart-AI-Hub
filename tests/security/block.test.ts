import request from 'supertest';
// Mock app will be available globally from setup.ts
declare global {
  var mockApp: any;
}

describe('Block System Security', () => {
  describe('Block Authorization', () => {
    it('should allow Agency to block Organization', async () => {
      const agency = await (global as any).createUser({ tier: 'agency' });
      const org = await (global as any).createUser({ tier: 'organization', parentAgencyId: agency.id });
      
      const token = (global as any).generateToken(agency);
      
      const response = await request((global as any).mockApp)
        .post('/api/v1/block')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: org.id, reason: 'Test' });
      
      expect(response.status).toBe(200);
    });
    
    it('should NOT allow General to block anyone', async () => {
      const general = await (global as any).createUser({ tier: 'general' });
      const other = await (global as any).createUser({ tier: 'general' });
      
      const token = (global as any).generateToken(general);
      
      const response = await request((global as any).mockApp)
        .post('/api/v1/block')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: other.id, reason: 'Test' });
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('Blocked User Restrictions', () => {
    it('should prevent blocked user from logging in', async () => {
      const admin = await (global as any).createUser({ tier: 'agency' }); // Use agency as admin
      const user = await (global as any).createUser({ tier: 'general', parentAgencyId: admin.id, isBlocked: false });
      const adminToken = (global as any).generateToken(admin);
      
      // Block the user using the block endpoint
      await request((global as any).mockApp)
        .post('/api/v1/block')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: user.id, reason: 'Test block' });
      
      // Now try to login with blocked user
      const response = await request((global as any).mockApp)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('blocked');
    });
    
    it('should prevent blocked user from using API', async () => {
      const user = await (global as any).createUser({ tier: 'general', isBlocked: false });
      const token = (global as any).generateToken(user);
      
      // Block the user directly in mock storage
      user.isBlocked = true;
      
      const response = await request((global as any).mockApp)
        .get('/api/v1/points/balance')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(403);
    });
  });
});