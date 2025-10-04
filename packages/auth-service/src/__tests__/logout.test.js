const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { verifyToken, generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { storeRefreshToken, removeRefreshToken, addToBlacklist } = require('../config/redis');

// Mock the dependencies
jest.mock('../models/User');
jest.mock('../utils/jwt');
jest.mock('../config/redis');

describe('Logout Endpoint', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/auth/logout', () => {
    const validUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: '$2a$10$hashedpassword',
      role_id: 2,
      email_verified: true,
      role_name: 'user',
      is_active: true
    };

    const mockAccessToken = 'mock-access-token';
    const mockRefreshToken = 'mock-refresh-token';
    
    const mockDecodedAccess = {
      userId: validUser.id,
      email: validUser.email,
      role: validUser.role_name,
      jti: 'access-jti-123',
      exp: Math.floor(Date.now() / 1000) + 900 // 15 minutes from now
    };
    
    const mockDecodedRefresh = {
      userId: validUser.id,
      jti: 'refresh-jti-456',
      exp: Math.floor(Date.now() / 1000) + 604800 // 7 days from now
    };

    // Test Case 1: Logout สำเร็จด้วย token ที่ถูกต้อง
    test('should logout successfully with valid tokens', async () => {
      // Mock User.findById to return a valid user
      User.findById.mockResolvedValue(validUser);
      
      // Mock verifyToken to return decoded tokens
      verifyToken.mockImplementation((token) => {
        if (token === mockAccessToken) return mockDecodedAccess;
        if (token === mockRefreshToken) return mockDecodedRefresh;
        throw new Error('Invalid token');
      });
      
      // Mock Redis operations
      removeRefreshToken.mockResolvedValue(true);
      addToBlacklist.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: mockRefreshToken })
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      
      // Verify that access token was added to blacklist
      expect(addToBlacklist).toHaveBeenCalledWith(
        mockDecodedAccess.jti,
        expect.any(Number) // TTL
      );
      
      // Verify that refresh token was removed from Redis
      expect(removeRefreshToken).toHaveBeenCalledWith(validUser.id);
      
      // Verify that refresh token was added to blacklist
      expect(addToBlacklist).toHaveBeenCalledWith(
        mockDecodedRefresh.jti,
        expect.any(Number) // TTL
      );
    });

    // Test Case 2: Logout สำเร็จแม้ไม่มี refresh token
    test('should logout successfully even without refresh token', async () => {
      // Mock User.findById to return a valid user
      User.findById.mockResolvedValue(validUser);
      
      // Mock verifyToken to return decoded access token
      verifyToken.mockReturnValue(mockDecodedAccess);
      
      // Mock Redis operations
      removeRefreshToken.mockResolvedValue(true);
      addToBlacklist.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'valid-refresh-token' })
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      
      // Verify that access token was added to blacklist
      expect(addToBlacklist).toHaveBeenCalledWith(
        mockDecodedAccess.jti,
        expect.any(Number) // TTL
      );
      
      // Verify that refresh token was removed from Redis
      expect(removeRefreshToken).toHaveBeenCalledWith(validUser.id);
    });

    // Test Case 3: Validation error เมื่อไม่มี refresh token
    test('should return validation error when refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({})
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
      expect(response.body.error.errors).toContain('Required');
      
      // Verify that no Redis operations were called
      expect(removeRefreshToken).not.toHaveBeenCalled();
      expect(addToBlacklist).not.toHaveBeenCalled();
    });

    // Test Case 4: Logout ล้มเหลวเมื่อไม่มี authorization header
    test('should fail logout without authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: mockRefreshToken });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('No token provided');
      
      // Verify that no Redis operations were called
      expect(removeRefreshToken).not.toHaveBeenCalled();
      expect(addToBlacklist).not.toHaveBeenCalled();
    });

    // Test Case 5: Logout สำเร็จแม้ refresh token จะ invalid
    test('should logout successfully even with invalid refresh token', async () => {
      // Mock User.findById to return a valid user
      User.findById.mockResolvedValue(validUser);
      
      // Mock verifyToken to return decoded access token but throw error for refresh token
      verifyToken.mockImplementation((token) => {
        if (token === mockAccessToken) return mockDecodedAccess;
        throw new Error('Invalid refresh token');
      });
      
      // Mock Redis operations
      removeRefreshToken.mockResolvedValue(true);
      addToBlacklist.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'invalid-refresh-token' })
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      
      // Verify that access token was added to blacklist
      expect(addToBlacklist).toHaveBeenCalledWith(
        mockDecodedAccess.jti,
        expect.any(Number) // TTL
      );
      
      // Verify that refresh token was removed from Redis
      expect(removeRefreshToken).toHaveBeenCalledWith(validUser.id);
    });

    // Test Case 6: ตรวจสอบว่า TTL คำนวณถูกต้อง
    test('should calculate TTL correctly for token blacklist', async () => {
      // Mock User.findById to return a valid user
      User.findById.mockResolvedValue(validUser);
      
      // Create a token that expires in 5 minutes
      const fiveMinutesFromNow = Math.floor(Date.now() / 1000) + 300;
      const mockDecodedAccessWithExpiry = {
        ...mockDecodedAccess,
        exp: fiveMinutesFromNow
      };
      
      // Mock verifyToken to return decoded token with specific expiry
      verifyToken.mockReturnValue(mockDecodedAccessWithExpiry);
      
      // Mock Redis operations
      removeRefreshToken.mockResolvedValue(true);
      addToBlacklist.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: mockRefreshToken })
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      
      // Verify that TTL is approximately 5 minutes (300 seconds)
      // Allow for small time differences (±5 seconds)
      expect(addToBlacklist).toHaveBeenCalledWith(
        mockDecodedAccessWithExpiry.jti,
        expect.any(Number)
      );
      
      const ttlCall = addToBlacklist.mock.calls.find(call => call[0] === mockDecodedAccessWithExpiry.jti);
      const ttlValue = ttlCall[1];
      expect(ttlValue).toBeGreaterThanOrEqual(295); // At least 295 seconds
      expect(ttlValue).toBeLessThanOrEqual(305); // At most 305 seconds
    });
  });
});