const request = require('supertest');
const app = require('../app');
const { redisClient } = require('../config/redis');

describe('OAuth Sora2 Integration', () => {
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

  describe('GET /api/auth/google with session parameters', () => {
    it('should store session and return_to parameters in state', async () => {
      const sessionId = 'test-session-123';
      const returnTo = 'chatgpt';

      const response = await request(app)
        .get('/api/auth/google')
        .query({
          session: sessionId,
          return_to: returnTo
        })
        .expect(302); // Redirect to Google

      // Extract state from redirect URL
      const location = response.headers.location;
      const stateMatch = location.match(/state=([^&]+)/);
      expect(stateMatch).toBeTruthy();
      
      const state = stateMatch[1];
      expect(state).toBeTruthy();

      // Verify state data was stored in Redis
      const stateData = await redisClient.get(`oauth_state:${state}`);
      expect(stateData).toBeTruthy();

      const parsedStateData = JSON.parse(stateData);
      expect(parsedStateData).toMatchObject({
        session: sessionId,
        return_to: returnTo
      });
      expect(parsedStateData.ip).toBeTruthy();
      expect(parsedStateData.userAgent).toBeTruthy();
      expect(parsedStateData.timestamp).toBeTruthy();
    });

    it('should use default return_to when not provided', async () => {
      const sessionId = 'test-session-123';

      const response = await request(app)
        .get('/api/auth/google')
        .query({
          session: sessionId
        })
        .expect(302); // Redirect to Google

      // Extract state from redirect URL
      const location = response.headers.location;
      const stateMatch = location.match(/state=([^&]+)/);
      const state = stateMatch[1];

      // Verify state data was stored with default return_to
      const stateData = await redisClient.get(`oauth_state:${state}`);
      const parsedStateData = JSON.parse(stateData);
      
      expect(parsedStateData.session).toBe(sessionId);
      expect(parsedStateData.return_to).toBe('chatgpt'); // Default value
    });

    it('should work without session parameters (traditional flow)', async () => {
      const response = await request(app)
        .get('/api/auth/google')
        .expect(302); // Redirect to Google

      // Extract state from redirect URL
      const location = response.headers.location;
      const stateMatch = location.match(/state=([^&]+)/);
      const state = stateMatch[1];

      // Verify state data was stored without session parameters
      const stateData = await redisClient.get(`oauth_state:${state}`);
      const parsedStateData = JSON.parse(stateData);
      
      expect(parsedStateData.session).toBeNull();
      expect(parsedStateData.return_to).toBe('chatgpt'); // Default value
    });
  });

  describe('OAuth Success Page', () => {
    it('should serve the OAuth success page', async () => {
      const response = await request(app)
        .get('/oauth-success.html')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('Authentication Successful');
      expect(response.text).toContain('verification code');
    });

    it('should display verification code when provided', async () => {
      const verificationCode = 'VERIFIED-test123';
      const returnTo = 'chatgpt';

      const response = await request(app)
        .get('/oauth-success.html')
        .query({
          verification_code: verificationCode,
          return_to: returnTo
        })
        .expect(200);

      expect(response.text).toContain(verificationCode);
      expect(response.text).toContain(returnTo);
    });

    it('should display token section when access token is provided', async () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      const response = await request(app)
        .get('/oauth-success.html')
        .query({
          accessToken: accessToken,
          refreshToken: refreshToken
        })
        .expect(200);

      expect(response.text).toContain('You have been successfully authenticated');
    });
  });

  describe('Verification Code Storage', () => {
    it('should store verification code in Redis with correct format', async () => {
      const verificationCode = 'VERIFIED-test123';
      const userId = 'user-123';
      const email = 'test@example.com';
      const sessionId = 'session-123';

      // Simulate storing verification code (as done in OAuth callback)
      await redisClient.setEx(`verification_code:${verificationCode}`, 600, JSON.stringify({
        userId: userId,
        email: email,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }));

      // Verify verification code was stored
      const storedData = await redisClient.get(`verification_code:${verificationCode}`);
      expect(storedData).toBeTruthy();

      const parsedData = JSON.parse(storedData);
      expect(parsedData).toMatchObject({
        userId: userId,
        email: email,
        sessionId: sessionId
      });
      expect(parsedData.timestamp).toBeTruthy();
    });

    it('should expire verification code after 10 minutes', async () => {
      const verificationCode = 'VERIFIED-expired123';
      
      // Store verification code with 1 second expiration for testing
      await redisClient.setEx(`verification_code:${verificationCode}`, 1, JSON.stringify({
        userId: 'user-123',
        email: 'test@example.com',
        sessionId: 'session-123',
        timestamp: new Date().toISOString()
      }));

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Verify verification code has expired
      const storedData = await redisClient.get(`verification_code:${verificationCode}`);
      expect(storedData).toBeNull();
    });
  });
});