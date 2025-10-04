// src/__tests__/verification.test.js
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');

// Mock the services
jest.mock('../services/email.service');
jest.mock('../services/otp.service');

// Mock the User model
jest.mock('../models/User', () => ({
  findByEmail: jest.fn(),
  updateEmailVerified: jest.fn()
}));

describe('Email Verification System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/send-verification', () => {
    it('should send verification email successfully', async () => {
      const email = 'test@example.com';
      const mockOTP = '123456';
      
      // Mock OTP service
      otpService.generateOTP.mockReturnValue(mockOTP);
      otpService.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 2, resetTime: Date.now() + 3600000 });
      otpService.storeOTP.mockResolvedValue();
      otpService.logVerificationAttempt.mockResolvedValue();
      
      // Mock email service
      emailService.sendVerificationEmail.mockResolvedValue({ success: true, messageId: 'test-message-id' });
      
      // Mock user existence
      User.findByEmail.mockResolvedValue({
        id: 'user-id',
        email,
        email_verified: false
      });

      const response = await request(app)
        .post('/api/auth/send-verification')
        .send({ email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Verification code sent');
      expect(response.body.expiresIn).toBe(900);
      expect(otpService.generateOTP).toHaveBeenCalled();
      expect(otpService.storeOTP).toHaveBeenCalledWith(email, mockOTP, expect.any(Object));
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(email, mockOTP);
    });

    it('should return error for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/send-verification')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
      expect(response.body.error.errors).toContain('Invalid email format');
    });

    it('should handle rate limiting', async () => {
      const email = 'test@example.com';
      
      // Mock rate limit exceeded
      otpService.checkRateLimit.mockResolvedValue({ 
        allowed: false, 
        remaining: 0, 
        resetTime: Date.now() + 3600000 
      });

      const response = await request(app)
        .post('/api/auth/send-verification')
        .send({ email })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Too many verification requests');
    });

    it('should handle email service failure', async () => {
      const email = 'test@example.com';
      
      // Mock OTP service
      otpService.generateOTP.mockReturnValue('123456');
      otpService.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 2, resetTime: Date.now() + 3600000 });
      otpService.storeOTP.mockResolvedValue();
      
      // Mock email service failure
      emailService.sendVerificationEmail.mockResolvedValue({ success: false, error: 'Email service error' });
      
      // Mock user existence
      User.findByEmail.mockResolvedValue({
        id: 'user-id',
        email,
        email_verified: false
      });

      const response = await request(app)
        .post('/api/auth/send-verification')
        .send({ email })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Failed to send verification email');
    });

    it('should not reveal if user does not exist', async () => {
      const email = 'nonexistent@example.com';
      
      // Mock OTP service
      otpService.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 2, resetTime: Date.now() + 3600000 });
      
      // Mock user does not exist
      User.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/send-verification')
        .send({ email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If the email exists');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email successfully', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      
      // Mock OTP service
      otpService.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetTime: Date.now() + 900000 });
      otpService.verifyOTP.mockResolvedValue({ success: true, message: 'OTP verified successfully' });
      otpService.logVerificationAttempt.mockResolvedValue();
      
      // Mock user existence and update
      User.findByEmail.mockResolvedValue({
        id: 'user-id',
        email,
        email_verified: false,
        profile: { first_name: 'John' }
      });
      User.updateEmailVerified.mockResolvedValue({
        id: 'user-id',
        email,
        email_verified: true
      });
      
      // Mock welcome email
      emailService.sendWelcomeEmail.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email, otp })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email verified successfully');
      expect(otpService.verifyOTP).toHaveBeenCalledWith(email, otp);
      expect(User.updateEmailVerified).toHaveBeenCalledWith('user-id', true);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(email, 'John');
    });

    it('should return error for invalid OTP format', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'test@example.com', otp: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
      expect(response.body.error.errors).toContain('OTP must be a 6-digit number');
    });

    it('should handle invalid OTP', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      
      // Mock OTP service
      otpService.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetTime: Date.now() + 900000 });
      otpService.verifyOTP.mockResolvedValue({ success: false, message: 'Invalid OTP' });
      otpService.logVerificationAttempt.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email, otp })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid OTP');
    });

    it('should handle expired OTP', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      
      // Mock OTP service
      otpService.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetTime: Date.now() + 900000 });
      otpService.verifyOTP.mockResolvedValue({ success: false, message: 'OTP not found or expired' });
      otpService.logVerificationAttempt.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email, otp })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('OTP not found or expired');
    });

    it('should handle user not found', async () => {
      const email = 'nonexistent@example.com';
      const otp = '123456';
      
      // Mock OTP service
      otpService.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetTime: Date.now() + 900000 });
      otpService.verifyOTP.mockResolvedValue({ success: true, message: 'OTP verified successfully' });
      otpService.logVerificationAttempt.mockResolvedValue();
      
      // Mock user does not exist
      User.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email, otp })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not found');
    });

    it('should handle verification rate limiting', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      
      // Mock rate limit exceeded
      otpService.checkRateLimit.mockResolvedValue({ 
        allowed: false, 
        remaining: 0, 
        resetTime: Date.now() + 900000 
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email, otp })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Too many verification attempts');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should resend verification email successfully', async () => {
      const email = 'test@example.com';
      const mockOTP = '123456';
      
      // Mock OTP service
      otpService.generateOTP.mockReturnValue(mockOTP);
      otpService.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 2, resetTime: Date.now() + 3600000 });
      otpService.storeOTP.mockResolvedValue();
      otpService.logVerificationAttempt.mockResolvedValue();
      
      // Mock email service
      emailService.sendVerificationEmail.mockResolvedValue({ success: true, messageId: 'test-message-id' });
      
      // Mock user existence (not verified)
      User.findByEmail.mockResolvedValue({
        id: 'user-id',
        email,
        email_verified: false
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Code resent');
      expect(response.body.expiresIn).toBe(900);
      expect(otpService.generateOTP).toHaveBeenCalled();
      expect(otpService.storeOTP).toHaveBeenCalledWith(email, mockOTP, expect.objectContaining({ isResend: true }));
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(email, mockOTP);
    });

    it('should return error if email already verified', async () => {
      const email = 'test@example.com';
      
      // Mock OTP service
      otpService.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 2, resetTime: Date.now() + 3600000 });
      
      // Mock user existence (already verified)
      User.findByEmail.mockResolvedValue({
        id: 'user-id',
        email,
        email_verified: true
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email is already verified');
    });
  });

  describe('GET /api/auth/verification-status', () => {
    it('should return verification status', async () => {
      const email = 'test@example.com';
      
      // Mock user existence
      User.findByEmail.mockResolvedValue({
        id: 'user-id',
        email,
        email_verified: false,
        created_at: new Date().toISOString()
      });
      
      // Mock OTP service
      otpService.hasValidOTP.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/auth/verification-status')
        .query({ email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(email);
      expect(response.body.data.isVerified).toBe(false);
      expect(response.body.data.hasValidOTP).toBe(true);
    });

    it('should return error for invalid email', async () => {
      const response = await request(app)
        .get('/api/auth/verification-status')
        .query({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Valid email address is required');
    });

    it('should return error if user not found', async () => {
      const email = 'nonexistent@example.com';
      
      // Mock user does not exist
      User.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/verification-status')
        .query({ email })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not found');
    });
  });

  describe('POST /api/auth/test-email (development only)', () => {
    it('should test email configuration in development', async () => {
      // Set environment to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Mock successful test
      emailService.testConfiguration.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/auth/test-email')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email configuration test successful');
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should return error in production', async () => {
      // Set environment to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/api/auth/test-email')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('This endpoint is not available in production');
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle email configuration test failure', async () => {
      // Set environment to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Mock failed test
      emailService.testConfiguration.mockResolvedValue({ success: false, error: 'Configuration error' });

      const response = await request(app)
        .post('/api/auth/test-email')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Configuration error');
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('OTP Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate 6-digit OTP', () => {
    const mockOTP = '123456';
    otpService.generateOTP.mockReturnValue(mockOTP);

    const result = otpService.generateOTP();
    
    expect(result).toBe(mockOTP);
    expect(otpService.generateOTP).toHaveBeenCalled();
  });

  it('should handle constant-time OTP comparison', async () => {
    const email = 'test@example.com';
    const otp = '123456';
    
    // Mock successful verification
    otpService.verifyOTP.mockResolvedValue({ success: true, message: 'OTP verified successfully' });

    const result = await otpService.verifyOTP(email, otp);
    
    expect(result.success).toBe(true);
    expect(otpService.verifyOTP).toHaveBeenCalledWith(email, otp);
  });

  it('should handle rate limiting correctly', async () => {
    const email = 'test@example.com';
    
    // Mock rate limit check
    otpService.checkRateLimit.mockResolvedValue({ 
      allowed: true, 
      remaining: 2, 
      resetTime: Date.now() + 3600000 
    });

    const result = await otpService.checkRateLimit(email, 'send');
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(otpService.checkRateLimit).toHaveBeenCalledWith(email, 'send');
  });
});

describe('Email Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send verification email with proper template', async () => {
    const email = 'test@example.com';
    const otp = '123456';
    
    // Mock successful email send
    emailService.sendVerificationEmail.mockResolvedValue({ success: true, messageId: 'test-message-id' });

    const result = await emailService.sendVerificationEmail(email, otp);
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('test-message-id');
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(email, otp);
  });

  it('should send welcome email after verification', async () => {
    const email = 'test@example.com';
    const firstName = 'John';
    
    // Mock successful welcome email
    emailService.sendWelcomeEmail.mockResolvedValue({ success: true, messageId: 'welcome-message-id' });

    const result = await emailService.sendWelcomeEmail(email, firstName);
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('welcome-message-id');
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(email, firstName);
  });
});