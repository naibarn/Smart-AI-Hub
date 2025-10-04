const request = require('supertest');
const app = require('../app');

describe('Google OAuth Tests', () => {
  describe('GET /api/auth/oauth/status', () => {
    it('should return OAuth configuration status', async () => {
      const response = await request(app)
        .get('/api/auth/oauth/status')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('google');
      expect(response.body.google).toHaveProperty('enabled');
      expect(response.body.google).toHaveProperty('callbackUrl');
    });
  });

  describe('GET /api/auth/google', () => {
    it('should redirect to Google OAuth with state parameter', async () => {
      const response = await request(app)
        .get('/api/auth/google')
        .expect(302); // Redirect status code

      // Should redirect to Google OAuth
      expect(response.headers.location).toContain('accounts.google.com');
      expect(response.headers.location).toContain('scope=profile%20email');
      expect(response.headers.location).toContain('state=');
    });
  });

  describe('GET /api/auth/google/callback', () => {
    it('should return error for missing state parameter', async () => {
      const response = await request(app)
        .get('/api/auth/google/callback')
        .expect(302); // Redirect status code

      // Should redirect to frontend with error
      expect(response.headers.location).toContain('auth/error');
      expect(response.headers.location).toContain('error=missing_state');
    });

    it('should return error for invalid state parameter', async () => {
      const response = await request(app)
        .get('/api/auth/google/callback?state=invalid_state')
        .expect(302); // Redirect status code

      // Should redirect to frontend with error
      expect(response.headers.location).toContain('auth/error');
      expect(response.headers.location).toContain('error=invalid_state');
    });
  });
});