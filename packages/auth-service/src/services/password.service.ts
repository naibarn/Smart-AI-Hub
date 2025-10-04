// src/services/password.service.ts
const crypto = require('crypto');
const { redisClient } = require('../config/redis');
const User = require('../models/User');
const { addToBlacklist } = require('../config/redis');

class PasswordService {
  /**
   * Generate a cryptographically secure reset token
   * @returns {string} Base64URL encoded token
   */
  generateResetToken(): string {
    const buffer = crypto.randomBytes(32);
    return buffer.toString('base64url');
  }

  /**
   * Store reset token in Redis with TTL
   * @param {string} token - Reset token
   * @param {number} userId - User ID
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   */
  async storeResetToken(token: string, userId: number, ttl: number = 3600): Promise<void> {
    const key = `reset:${token}`;
    await redisClient.setEx(key, ttl, userId.toString());
  }

  /**
   * Validate reset token and get user ID
   * @param {string} token - Reset token
   * @returns {Promise<{valid: boolean, userId?: number}>}
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; userId?: number }> {
    try {
      const key = `reset:${token}`;
      const userId = await redisClient.get(key);

      if (!userId) {
        return { valid: false };
      }

      return { valid: true, userId: parseInt(userId) };
    } catch (error) {
      console.error('Error validating reset token:', error);
      return { valid: false };
    }
  }

  /**
   * Delete reset token (single use)
   * @param {string} token - Reset token
   */
  async deleteResetToken(token: string): Promise<void> {
    const key = `reset:${token}`;
    await redisClient.del(key);
  }

  /**
   * Check rate limiting for password reset requests
   * @param {string} ip - IP address
   * @returns {Promise<{allowed: boolean, remaining: number}>}
   */
  async checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = `reset_limit:${ip}`;
    const current = await redisClient.incr(key);

    if (current === 1) {
      // Set expiration on first request (1 hour)
      await redisClient.expire(key, 3600);
    }

    const remaining = Math.max(0, 3 - current);
    return {
      allowed: current <= 3,
      remaining,
    };
  }

  /**
   * Log password reset attempt
   * @param {string} email - User email
   * @param {string} ip - IP address
   * @param {string} userAgent - User agent
   * @param {boolean} success - Whether the attempt was successful
   */
  async logResetAttempt(
    email: string,
    ip: string,
    userAgent: string,
    success: boolean
  ): Promise<void> {
    const key = `reset_attempts:${email}`;
    const attemptData = {
      timestamp: new Date().toISOString(),
      ip,
      userAgent: userAgent || 'unknown',
      success,
    };

    // Store attempt with expiration (24 hours)
    await redisClient.lPush(key, JSON.stringify(attemptData));
    await redisClient.expire(key, 86400); // 24 hours
  }

  /**
   * Invalidate all user sessions after password reset
   * @param {number} userId - User ID
   */
  async invalidateUserSessions(userId: number): Promise<void> {
    try {
      // Remove refresh token
      const { removeRefreshToken } = require('../config/redis');
      await removeRefreshToken(userId.toString());

      // Get all active access tokens for the user (this would require tracking active tokens)
      // For now, we'll add a pattern to blacklist all tokens for this user
      const pattern = `user_tokens:${userId}:*`;
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        // Add all tokens to blacklist
        const pipeline = redisClient.multi();
        keys.forEach((key) => {
          const tokenId = key.split(':').pop();
          pipeline.setEx(`blacklist:${tokenId}`, 3600, '1'); // 1 hour TTL
        });
        await pipeline.exec();
      }

      console.log(`Invalidated all sessions for user ${userId}`);
    } catch (error) {
      console.error('Error invalidating user sessions:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   */
  async updatePassword(userId: number, newPassword: string): Promise<void> {
    try {
      await User.updatePassword(userId, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<any>} User object or null
   */
  async getUserByEmail(email: string): Promise<any> {
    try {
      return await User.findByEmail(email);
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }
}

module.exports = new PasswordService();
