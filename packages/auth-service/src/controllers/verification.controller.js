// src/controllers/verification.controller.js
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const User = require('../models/User');

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
        return res.status(400).json({
          success: false,
          error: { message: 'Valid email address is required' }
        });
      }

      // Check rate limiting for sending OTP
      const rateLimitResult = await otpService.checkRateLimit(email, 'send');
      if (!rateLimitResult.allowed) {
        const resetTime = new Date(rateLimitResult.resetTime).toISOString();
        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many verification requests. Please try again later.',
            resetTime,
            remaining: rateLimitResult.remaining
          }
        });
      }

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        // For security, don't reveal that user doesn't exist
        return res.json({
          success: true,
          message: 'If the email exists, a verification code has been sent',
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
        return res.status(500).json({
          success: false,
          error: { message: 'Failed to send verification email' }
        });
      }

      // Log the attempt for security monitoring
      await otpService.logVerificationAttempt(email, {
        action: 'send_otp',
        success: true,
        ip,
        userAgent,
        messageId: emailResult.messageId
      });

      res.json({
        success: true,
        message: 'Verification code sent',
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
        return res.status(400).json({
          success: false,
          error: { message: 'Email and OTP are required' }
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Valid email address is required' }
        });
      }

      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
          success: false,
          error: { message: 'OTP must be a 6-digit number' }
        });
      }

      // Check rate limiting for verification attempts
      const rateLimitResult = await otpService.checkRateLimit(email, 'verify');
      if (!rateLimitResult.allowed) {
        const resetTime = new Date(rateLimitResult.resetTime).toISOString();
        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many verification attempts. Please try again later.',
            resetTime,
            remaining: rateLimitResult.remaining
          }
        });
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
        return res.status(400).json({
          success: false,
          error: { message: verificationResult.message }
        });
      }

      // OTP is valid, now update user's email verification status
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
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

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

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
        return res.status(400).json({
          success: false,
          error: { message: 'Valid email address is required' }
        });
      }

      // Check rate limiting for sending OTP
      const rateLimitResult = await otpService.checkRateLimit(email, 'send');
      if (!rateLimitResult.allowed) {
        const resetTime = new Date(rateLimitResult.resetTime).toISOString();
        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many verification requests. Please try again later.',
            resetTime,
            remaining: rateLimitResult.remaining
          }
        });
      }

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        // For security, don't reveal that user doesn't exist
        return res.json({
          success: true,
          message: 'If the email exists, a verification code has been sent',
          expiresIn: parseInt(process.env.VERIFICATION_OTP_EXPIRY) || 900
        });
      }

      // Check if user is already verified
      if (user.email_verified) {
        return res.status(400).json({
          success: false,
          error: { message: 'Email is already verified' }
        });
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
        return res.status(500).json({
          success: false,
          error: { message: 'Failed to send verification email' }
        });
      }

      // Log the attempt for security monitoring
      await otpService.logVerificationAttempt(email, {
        action: 'resend_otp',
        success: true,
        ip,
        userAgent,
        messageId: emailResult.messageId
      });

      res.json({
        success: true,
        message: 'Code resent',
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
        return res.status(400).json({
          success: false,
          error: { message: 'Valid email address is required' }
        });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
      }

      const hasValidOTP = await otpService.hasValidOTP(email);

      res.json({
        success: true,
        data: {
          email: user.email,
          isVerified: user.email_verified,
          hasValidOTP,
          createdAt: user.created_at
        }
      });

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
        return res.status(403).json({
          success: false,
          error: { message: 'This endpoint is not available in production' }
        });
      }

      const testResult = await emailService.testConfiguration();

      if (testResult.success) {
        res.json({
          success: true,
          message: 'Email configuration test successful'
        });
      } else {
        res.status(500).json({
          success: false,
          error: { message: testResult.error }
        });
      }

    } catch (error) {
      console.error('Error in testEmailConfiguration:', error);
      next(error);
    }
  }
}

module.exports = new VerificationController();