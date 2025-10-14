const request = require('supertest');
const app = require('../app');
const { redisClient } = require('../config/redis');

describe('Session Verification', () => {
  beforeEach(async () => {
    // Clear Redis before each test
    await redisClient.flushAll();
  });

  afterEach(async () => {
    // Clean up after each test
    await redisClient.flushAll();
  });

  afterAll(async () => {
    // Close Redis connection after all tests
    await redisClient.quit();
  });

  describe('GET /api/auth/verify-session', () => {
    it('should return 200 with valid session token', async () => {
      // Create a test session
      const sessionToken = 'VERIFIED-test123';
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };

      // Store session in Redis
      await redisClient.setEx(`session:${sessionToken}`, 604800, JSON.stringify(sessionData));

      // Verify session
      const response = await request(app)
        .get('/api/auth/verify-session')
        .set('X-Session-Token', sessionToken)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: sessionData.userId,
          email: sessionData.email,
          name: sessionData.name
        }
      });
      expect(response.body.user).toHaveProperty('expiresAt');
    });

    it('should return 401 when no session token is provided', async () => {
      const response = await request(app)
        .get('/api/auth/verify-session')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Session token required'
      });
    });

    it('should return 401 when session token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/verify-session')
        .set('X-Session-Token', 'INVALID-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid or expired session token'
      });
    });

    it('should return 401 when session has expired', async () => {
      // Create a test session with immediate expiration
      const sessionToken = 'VERIFIED-expired123';
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
      };

      // Store session in Redis with 1 second expiration
      await redisClient.setEx(`session:${sessionToken}`, 1, JSON.stringify(sessionData));

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Try to verify expired session
      const response = await request(app)
        .get('/api/auth/verify-session')
        .set('X-Session-Token', sessionToken)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid or expired session token'
      });
    });

    it('should handle malformed session data gracefully', async () => {
      // Store malformed session data
      const sessionToken = 'VERIFIED-malformed123';
      await redisClient.setEx(`session:${sessionToken}`, 604800, 'invalid-json');

      const response = await request(app)
        .get('/api/auth/verify-session')
        .set('X-Session-Token', sessionToken)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid or expired session token'
      });
    });
  });
});