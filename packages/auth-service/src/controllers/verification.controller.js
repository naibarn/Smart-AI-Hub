// src/controllers/verification.controller.js
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

class VerificationController {
  /**
   * Send verification email with OTP
   * POST /api/auth/send-verification
   */
  async sendVerification(req, res, next) {
    try {
      const { email } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Validate email format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return errorResponse(res, 400, 'INVALID_EMAIL', 'Valid email address is required', null, req.requestId);
      }

      // Check rate limiting for sending OTP
      const rateLimitResult = await otpService.checkRateLimit(email, 'send');
      if (!rateLimitResult.allowed) {
        const resetTime = new Date(rateLimitResult.resetTime).toISOString();
        return errorResponse(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many verification requests. Please try again later.', {
          resetTime,
          remaining: rateLimitResult.remaining
        }, req.requestId);
      }

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        // For security, don't reveal that user doesn't exist
        return successResponse(null, res, 200, req.requestId, 'If the email exists, a verification code has been sent', {
          expiresIn: parseInt(process.env.VERIFICATION_OTP_EXPIRY) || 900
        });
      }

      // Generate and store OTP
      const otp = otpService.generateOTP();
      const metadata = {
        ip,
        userAgent,
        userId: user.id,
        emailVerified: user.email_verified
      };

      await otpService.storeOTP(email, otp, metadata);

      // Send email
      const emailResult = await emailService.sendVerificationEmail(email, otp);
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        return errorResponse(res, 500, 'EMAIL_SEND_FAILED', 'Failed to send verification email', null, req.requestId);
      }

      // Log the attempt for security monitoring
      await otpService.logVerificationAttempt(email, {
        action: 'send_otp',
        success: true,
        ip,
        userAgent,
        messageId: emailResult.messageId
      });

      return successResponse(null, res, 200, req.requestId, 'Verification code sent', {
        expiresIn: parseInt(process.env.VERIFICATION_OTP_EXPIRY) || 900
      });

    } catch (error) {
      console.error('Error in sendVerification:', error);
      next(error);
    }
  }

  /**
   * Verify email with OTP
   * POST /api/auth/verify-email
   */
  async verifyEmail(req, res, next) {
    try {
      const { email, otp } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Validate input
      if (!email || !otp) {
        return errorResponse(res, 400, 'MISSING_INPUT', 'Email and OTP are required', null, req.requestId);
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return errorResponse(res, 400, 'INVALID_EMAIL', 'Valid email address is required', null, req.requestId);
      }

      if (!/^\d{6}$/.test(otp)) {
        return errorResponse(res, 400, 'INVALID_OTP_FORMAT', 'OTP must be a 6-digit number', null, req.requestId);
      }

      // Check rate limiting for verification attempts
      const rateLimitResult = await otpService.checkRateLimit(email, 'verify');
      if (!rateLimitResult.allowed) {
        const resetTime = new Date(rateLimitResult.resetTime).toISOString();
        return errorResponse(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many verification attempts. Please try again later.', {
          resetTime,
          remaining: rateLimitResult.remaining
        }, req.requestId);
      }

      // Verify OTP
      const verificationResult = await otpService.verifyOTP(email, otp);

      // Log the attempt for security monitoring
      await otpService.logVerificationAttempt(email, {
        action: 'verify_otp',
        success: verificationResult.success,
        ip,
        userAgent,
        otpProvided: otp
      });

      if (!verificationResult.success) {
        return errorResponse(res, 400, 'OTP_VERIFICATION_FAILED', verificationResult.message, null, req.requestId);
      }

      // OTP is valid, now update user's email verification status
      const user = await User.findByEmail(email);
      if (!user) {
        return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found', null, req.requestId);
      }

      // Update user's verification status
      await User.updateEmailVerified(user.id, true);

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(email, user.profile?.first_name);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the verification if welcome email fails
      }

      return successResponse(null, res, 200, req.requestId, 'Email verified successfully');

    } catch (error) {
      console.error('Error in verifyEmail:', error);
      next(error);
    }
  }

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Validate email format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return errorResponse(res, 400, 'INVALID_EMAIL', 'Valid email address is required', null, req.requestId);
      }

      // Check rate limiting for sending OTP
      const rateLimitResult = await otpService.checkRateLimit(email, 'send');
      if (!rateLimitResult.allowed) {
        const resetTime = new Date(rateLimitResult.resetTime).toISOString();
        return errorResponse(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many verification requests. Please try again later.', {
          resetTime,
          remaining: rateLimitResult.remaining
        }, req.requestId);
      }

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        // For security, don't reveal that user doesn't exist
        return successResponse(null, res, 200, req.requestId, 'If the email exists, a verification code has been sent', {
          expiresIn: parseInt(process.env.VERIFICATION_OTP_EXPIRY) || 900
        });
      }

      // Check if user is already verified
      if (user.email_verified) {
        return errorResponse(res, 400, 'EMAIL_ALREADY_VERIFIED', 'Email is already verified', null, req.requestId);
      }

      // Generate and store new OTP
      const otp = otpService.generateOTP();
      const metadata = {
        ip,
        userAgent,
        userId: user.id,
        emailVerified: user.email_verified,
        isResend: true
      };

      await otpService.storeOTP(email, otp, metadata);

      // Send email
      const emailResult = await emailService.sendVerificationEmail(email, otp);
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        return errorResponse(res, 500, 'EMAIL_SEND_FAILED', 'Failed to send verification email', null, req.requestId);
      }

      // Log the attempt for security monitoring
      await otpService.logVerificationAttempt(email, {
        action: 'resend_otp',
        success: true,
        ip,
        userAgent,
        messageId: emailResult.messageId
      });

      return successResponse(null, res, 200, req.requestId, 'Code resent', {
        expiresIn: parseInt(process.env.VERIFICATION_OTP_EXPIRY) || 900
      });

    } catch (error) {
      console.error('Error in resendVerification:', error);
      next(error);
    }
  }

  /**
   * Check verification status
   * GET /api/auth/verification-status
   */
  async getVerificationStatus(req, res, next) {
    try {
      const { email } = req.query;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return errorResponse(res, 400, 'INVALID_EMAIL', 'Valid email address is required', null, req.requestId);
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found', null, req.requestId);
      }

      const hasValidOTP = await otpService.hasValidOTP(email);

      return successResponse({
        email: user.email,
        isVerified: user.email_verified,
        hasValidOTP,
        createdAt: user.created_at
      }, res, 200, req.requestId);

    } catch (error) {
      console.error('Error in getVerificationStatus:', error);
      next(error);
    }
  }

  /**
   * Test email configuration (development only)
   * POST /api/auth/test-email
   */
  async testEmailConfiguration(req, res, next) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return errorResponse(res, 403, 'ENDPOINT_UNAVAILABLE', 'This endpoint is not available in production', null, req.requestId);
      }

      const testResult = await emailService.testConfiguration();

      if (testResult.success) {
        return successResponse(null, res, 200, req.requestId, 'Email configuration test successful');
      } else {
        return errorResponse(res, 500, 'EMAIL_CONFIG_FAILED', testResult.error, null, req.requestId);
      }

    } catch (error) {
      console.error('Error in testEmailConfiguration:', error);
      next(error);
    }
  }
}

module.exports = new VerificationController();