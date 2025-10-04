// src/__tests__/password-reset.test.js
const request = require('supertest');
const app = require('../app');
const { redisClient } = require('../config/redis');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('Password Reset Flow', () => {
  let testUser;
  let testEmail = `passwordreset-${Date.now()}@test.com`;
  let testPassword = 'OldPassword123!';
  let newPassword = 'NewPassword123!';

  beforeAll(async () => {
    // Clean up any existing user with this email first
    const existingUser = await User.findByEmail(testEmail);
    if (existingUser) {
      await User.delete(existingUser.id);
    }

    // Create a test user
    testUser = await User.create({
      email: testEmail,
      password: testPassword,
      role_name: 'user'
    });

    // Verify the user's email for login tests
    await User.updateEmailVerified(testUser.id, true);
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await User.delete(testUser.id);
    }
    
    // Clear Redis test data
    const keys = await redisClient.keys('reset:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    
    await redisClient.quit();
  });

  beforeEach(async () => {
    // Clear rate limiting and attempt logs before each test
    const keys = await redisClient.keys('reset_limit:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    
    const attemptKeys = await redisClient.keys('reset_attempts:*');
    if (attemptKeys.length > 0) {
      await redisClient.del(attemptKeys);
    }
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset link for existing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reset link sent if email exists');
    });

    it('should return success message for non-existing email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reset link sent if email exists');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should enforce rate limiting', async () => {
      // Make 4 requests (limit is 3 per hour)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: testEmail })
          .expect(200);
      }

      // 4th request should be rate limited
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should store reset token in Redis', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      // Check that a reset token was stored
      const keys = await redisClient.keys('reset:*');
      expect(keys.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/auth/verify-reset-token', () => {
    let resetToken;

    beforeEach(async () => {
      // Generate a reset token for testing
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      // Get the token from Redis (in a real app, this would come from email)
      const keys = await redisClient.keys('reset:*');
      if (keys.length > 0) {
        resetToken = keys[0].replace('reset:', '');
      }
    });

    it('should verify valid reset token', async () => {
      const response = await request(app)
        .get(`/api/auth/verify-reset-token?token=${resetToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
      expect(response.body.email).toBe(testEmail);
    });

    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-reset-token?token=invalid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-reset-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_REQUIRED');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      // Reset password back to original for each test
      await User.updatePassword(testUser.id, testPassword);
      
      // Generate a reset token for testing
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      // Get the token from Redis
      const keys = await redisClient.keys('reset:*');
      if (keys.length > 0) {
        resetToken = keys[0].replace('reset:', '');
      }
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: newPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password updated successfully');

      // Verify password was actually changed
      const user = await User.findByEmail(testEmail);
      const isPasswordValid = await User.comparePassword(newPassword, user.password_hash);
      expect(isPasswordValid).toBe(true);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: newPassword
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should delete token after use (single use)', async () => {
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: newPassword
        })
        .expect(200);

      // Try to use the same token again
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'AnotherPassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should invalidate user sessions after password reset', async () => {
      // First, login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body.data;

      // Reset password
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: newPassword
        })
        .expect(200);

      // Try to refresh with old refresh token (should be invalid)
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(refreshResponse.body.success).toBe(false);
      
      // Note: Access tokens are stateless JWTs with short expiration times
      // In a real implementation, you would track active tokens or use refresh token rotation
      // For this test, we verify that refresh tokens are invalidated
    });
  });

  describe('Session Invalidation', () => {
    it('should clear refresh tokens from Redis', async () => {
      // Reset password back to original first
      await User.updatePassword(testUser.id, testPassword);
      
      // Login to store refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        })
        .expect(200);

      const { refreshToken } = loginResponse.body.data;

      // Verify refresh token is stored
      const storedToken = await redisClient.get(`refresh_token:${testUser.id}`);
      expect(storedToken).toBe(refreshToken);

      // Generate reset token and reset password
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      const keys = await redisClient.keys('reset:*');
      const resetToken = keys[0].replace('reset:', '');

      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: newPassword
        })
        .expect(200);

      // Verify refresh token is cleared
      const clearedToken = await redisClient.get(`refresh_token:${testUser.id}`);
      expect(clearedToken).toBeNull();
    });
  });

  describe('Security Features', () => {
    it('should log all reset attempts', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      // Check that attempt was logged
      const keys = await redisClient.keys('reset_attempts:*');
      expect(keys.length).toBeGreaterThan(0);

      const attempts = await redisClient.lRange(keys[0], 0, -1);
      expect(attempts.length).toBeGreaterThan(0);

      const attemptData = JSON.parse(attempts[0]);
      expect(attemptData.email).toBe(testEmail);
      expect(attemptData.success).toBe(true);
    });

    it('should use cryptographically secure tokens', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      const keys = await redisClient.keys('reset:*');
      const token = keys[0].replace('reset:', '');

      // Check token format (base64url)
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(token.length).toBeGreaterThan(20);
    });

    it('should set proper TTL on reset tokens', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      const keys = await redisClient.keys('reset:*');
      const ttl = await redisClient.ttl(keys[0]);

      // TTL should be close to 3600 seconds (1 hour)
      expect(ttl).toBeGreaterThan(3500);
      expect(ttl).toBeLessThanOrEqual(3600);
    });
  });
});