// src/controllers/password.controller.js
const passwordService = require('../services/password.service');
const emailService = require('../services/email.service');

const passwordController = {
  /**
   * POST /api/auth/forgot-password
   * Send password reset link to user's email
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Check rate limiting
      const rateLimit = await passwordService.checkRateLimit(ip);
      if (!rateLimit.allowed) {
        await passwordService.logResetAttempt(email, ip, userAgent, false);
        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many password reset attempts. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            remaining: rateLimit.remaining
          }
        });
      }

      // Find user by email (don't reveal if email exists or not for security)
      const user = await passwordService.getUserByEmail(email);
      
      if (user) {
        // Generate reset token
        const resetToken = passwordService.generateResetToken();
        
        // Store token in Redis with 1 hour TTL
        await passwordService.storeResetToken(resetToken, user.id, 3600);
        
        // Send reset email asynchronously
        emailService.sendPasswordResetEmail(email, resetToken).catch(error => {
          console.error('Failed to send password reset email:', error);
        });

        await passwordService.logResetAttempt(email, ip, userAgent, true);
      } else {
        // Log attempt for non-existent email
        await passwordService.logResetAttempt(email, ip, userAgent, false);
      }

      // Always return success message for security
      res.json({
        success: true,
        message: 'Reset link sent if email exists'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/reset-password
   * Reset password using token
   */
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Validate reset token
      const tokenValidation = await passwordService.validateResetToken(token);
      
      if (!tokenValidation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid or expired reset token',
            code: 'INVALID_TOKEN'
          }
        });
      }

      const userId = tokenValidation.userId;

      // Get user for logging
      const User = require('../models/User');
      const user = await User.findById(userId);

      // Update user password
      await passwordService.updatePassword(userId, newPassword);

      // Invalidate all user sessions
      await passwordService.invalidateUserSessions(userId);

      // Delete the reset token (single use)
      await passwordService.deleteResetToken(token);

      if (user) {
        await passwordService.logResetAttempt(user.email, ip, userAgent, true);
      }

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/verify-reset-token
   * Verify if reset token is valid
   */
  async verifyResetToken(req, res, next) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Reset token is required',
            code: 'TOKEN_REQUIRED'
          }
        });
      }

      // Validate reset token
      const tokenValidation = await passwordService.validateResetToken(token);
      
      if (!tokenValidation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid or expired reset token',
            code: 'INVALID_TOKEN'
          }
        });
      }

      // Get user email
      const User = require('../models/User');
      const user = await User.findById(tokenValidation.userId);

      if (!user) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      res.json({
        success: true,
        valid: true,
        email: user.email
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = passwordController;