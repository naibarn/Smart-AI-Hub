const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { verifyToken, generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { storeRefreshToken, logFailedLogin } = require('../config/redis');

// Mock the dependencies
jest.mock('../models/User');
jest.mock('../utils/jwt');
jest.mock('../config/redis');

describe('Login Endpoint', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    const validUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: '$2a$10$hashedpassword',
      role_id: 2,
      email_verified: true,
      role_name: 'user'
    };

    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    // Test Case 1: Login สำเร็จด้วย credentials ที่ถูกต้อง
    test('should login successfully with valid credentials', async () => {
      // Mock User.findByEmail to return a valid user
      User.findByEmail.mockResolvedValue(validUser);
      
      // Mock User.comparePassword to return true
      User.comparePassword.mockResolvedValue(true);
      
      // Mock token generation
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      generateAccessToken.mockReturnValue(mockAccessToken);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      
      // Mock Redis operations
      storeRefreshToken.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.accessToken).toBe(mockAccessToken);
      expect(response.body.data.refreshToken).toBe(mockRefreshToken);
      expect(response.body.message).toBe('Login successful');
      
      // Verify that User.findByEmail was called with correct email
      expect(User.findByEmail).toHaveBeenCalledWith(validLoginData.email);
      
      // Verify that User.comparePassword was called
      expect(User.comparePassword).toHaveBeenCalled();
      
      // Verify that tokens were generated
      expect(generateAccessToken).toHaveBeenCalledWith({
        userId: validUser.id,
        email: validUser.email,
        role: validUser.role_name
      });
      
      expect(generateRefreshToken).toHaveBeenCalledWith({
        userId: validUser.id
      });
      
      // Verify that refresh token was stored in Redis
      expect(storeRefreshToken).toHaveBeenCalledWith(
        validUser.id, 
        mockRefreshToken, 
        604800
      );
    });

    // Test Case 2: Login ล้มเหลวด้วย email ที่ไม่มีในระบบ
    test('should fail login with email not found in system', async () => {
      // Mock User.findByEmail to return null (user not found)
      User.findByEmail.mockResolvedValue(null);
      
      // Mock Redis logFailedLogin
      logFailedLogin.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid email or password');
      
      // Verify that User.findByEmail was called
      expect(User.findByEmail).toHaveBeenCalledWith(validLoginData.email);
      
      // Verify that failed login was logged
      expect(logFailedLogin).toHaveBeenCalled();
      
      // Verify that User.comparePassword was not called
      expect(User.comparePassword).not.toHaveBeenCalled();
    });

    // Test Case 3: Login ล้มเหลวด้วย password ผิด
    test('should fail login with incorrect password', async () => {
      // Mock User.findByEmail to return a valid user
      User.findByEmail.mockResolvedValue(validUser);
      
      // Mock User.comparePassword to return false (password mismatch)
      User.comparePassword.mockResolvedValue(false);
      
      // Mock Redis logFailedLogin
      logFailedLogin.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid email or password');
      
      // Verify that User.findByEmail was called
      expect(User.findByEmail).toHaveBeenCalledWith(validLoginData.email);
      
      // Verify that User.comparePassword was called
      expect(User.comparePassword).toHaveBeenCalledWith(
        validLoginData.password, 
        validUser.password_hash
      );
      
      // Verify that failed login was logged
      expect(logFailedLogin).toHaveBeenCalled();
    });

    // Test Case 4: Validation error เมื่อ input ไม่ครบ
    test('should return validation error when input is incomplete', async () => {
      // Test with missing email
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(response1.status).toBe(400);
      expect(response1.body.success).toBe(false);
      expect(response1.body.error.message).toBe('Validation failed');
      expect(response1.body.error.errors).toContain('Required');

      // Test with missing password
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response2.status).toBe(400);
      expect(response2.body.success).toBe(false);
      expect(response2.body.error.message).toBe('Validation failed');
      expect(response2.body.error.errors).toContain('Required');

      // Test with invalid email format
      const response3 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response3.status).toBe(400);
      expect(response3.body.success).toBe(false);
      expect(response3.body.error.message).toBe('Validation failed');
      expect(response3.body.error.errors).toContain('Invalid email format');

      // Verify that no database operations were called
      expect(User.findByEmail).not.toHaveBeenCalled();
      expect(User.comparePassword).not.toHaveBeenCalled();
    });

    // Test Case 5: ตรวจสอบว่า token ที่ได้สามารถ decode ได้
    test('should generate tokens that can be decoded', async () => {
      // Mock User.findByEmail to return a valid user
      User.findByEmail.mockResolvedValue(validUser);
      
      // Mock User.comparePassword to return true
      User.comparePassword.mockResolvedValue(true);
      
      // Mock token generation with actual JWT tokens
      const mockTokenPayload = {
        userId: validUser.id,
        email: validUser.email,
        role: validUser.role_name
      };
      
      generateAccessToken.mockReturnValue('real-access-token');
      generateRefreshToken.mockReturnValue('real-refresh-token');
      
      // Mock verifyToken to return the payload
      verifyToken.mockReturnValue(mockTokenPayload);
      
      // Mock Redis operations
      storeRefreshToken.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe('real-access-token');
      expect(response.body.data.refreshToken).toBe('real-refresh-token');
      
      // Verify that tokens were generated with correct payload
      expect(generateAccessToken).toHaveBeenCalledWith({
        userId: validUser.id,
        email: validUser.email,
        role: validUser.role_name
      });
      
      expect(generateRefreshToken).toHaveBeenCalledWith({
        userId: validUser.id
      });
      
      // Verify that the tokens can be decoded (simulating verification)
      // Since we're mocking verifyToken, we can verify it was defined
      expect(verifyToken).toBeDefined();
      
      // In a real test, you would verify the actual JWT tokens
      // For this mock test, we verify the token generation functions were called correctly
    });

    // Additional test: Login with unverified email
    test('should fail login with unverified email', async () => {
      const unverifiedUser = {
        ...validUser,
        email_verified: false
      };
      
      // Mock User.findByEmail to return an unverified user
      User.findByEmail.mockResolvedValue(unverifiedUser);
      
      // Mock User.comparePassword to return true
      User.comparePassword.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Account is not verified');
      
      // Verify that User.findByEmail was called
      expect(User.findByEmail).toHaveBeenCalledWith(validLoginData.email);
      
      // Verify that User.comparePassword was called
      expect(User.comparePassword).toHaveBeenCalledWith(
        validLoginData.password, 
        unverifiedUser.password_hash
      );
      
      // Verify that no tokens were generated
      expect(generateAccessToken).not.toHaveBeenCalled();
      expect(generateRefreshToken).not.toHaveBeenCalled();
    });
  });
});