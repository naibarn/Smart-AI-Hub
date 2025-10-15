// src/controllers/password.controller.js
const passwordService = require('../services/password.service');
const emailService = require('../services/email.service');
const { successResponse, errorResponse } = require('../utils/response');

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
        return errorResponse(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many password reset attempts. Please try again later.', {
          remaining: rateLimit.remaining
        }, req.requestId);
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
      return successResponse(null, res, 200, req.requestId, 'Reset link sent if email exists');
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
        return errorResponse(res, 400, 'INVALID_TOKEN', 'Invalid or expired reset token', null, req.requestId);
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

      return successResponse(null, res, 200, req.requestId, 'Password updated successfully');
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
        return errorResponse(res, 400, 'TOKEN_REQUIRED', 'Reset token is required', null, req.requestId);
      }

      // Validate reset token
      const tokenValidation = await passwordService.validateResetToken(token);
      
      if (!tokenValidation.valid) {
        return errorResponse(res, 400, 'INVALID_TOKEN', 'Invalid or expired reset token', null, req.requestId);
      }

      // Get user email
      const User = require('../models/User');
      const user = await User.findById(tokenValidation.userId);

      if (!user) {
        return errorResponse(res, 400, 'USER_NOT_FOUND', 'User not found', null, req.requestId);
      }

      return successResponse({
        valid: true,
        email: user.email
      }, res, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = passwordController;