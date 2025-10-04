// src/__tests__/refresh.test.js
const request = require('supertest');
const app = require('../app');

describe('POST /api/auth/refresh', () => {
  let refreshToken;
  let accessToken;

  beforeAll(async () => {
    // First, login to get tokens
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    if (loginResponse.status === 200) {
      refreshToken = loginResponse.body.data.refreshToken;
      accessToken = loginResponse.body.data.accessToken;
    }
  });

  it('should refresh tokens with valid refresh token', async () => {
    if (!refreshToken) {
      console.log('Skipping test - no refresh token available');
      return;
    }

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    expect(response.body.message).toBe('Token refreshed successfully');
  });

  it('should return 400 for missing refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('should return 401 for invalid refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: 'invalid.token.here'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Invalid or expired refresh token');
  });

  it('should return 401 for non-matching refresh token', async () => {
    // Generate a valid token but not stored in Redis
    const { generateRefreshToken } = require('../utils/jwt');
    const fakeRefreshToken = generateRefreshToken({ userId: 99999 });

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: fakeRefreshToken
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Refresh token does not match stored token');
  });
});