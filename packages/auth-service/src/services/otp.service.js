// src/services/otp.service.js
const crypto = require('crypto');
const { redisClient } = require('../config/redis');

class OTPService {
  /**
   * Generate a cryptographically secure 6-digit OTP
   * @returns {string} 6-digit OTP string
   */
  generateOTP() {
    const otpLength = parseInt(process.env.VERIFICATION_OTP_LENGTH) || 6;
    const max = Math.pow(10, otpLength) - 1;
    const otp = crypto.randomInt(0, max).toString().padStart(otpLength, '0');
    return otp;
  }

  /**
   * Store OTP in Redis with metadata
   * @param {string} email - User email
   * @param {string} otp - Generated OTP
   * @param {object} metadata - Additional metadata (ip, userAgent, etc.)
   * @returns {Promise<void>}
   */
  async storeOTP(email, otp, metadata = {}) {
    const key = `otp:${email}`;
    const expiry = parseInt(process.env.VERIFICATION_OTP_EXPIRY) || 900; // 15 minutes default
    
    const otpData = {
      code: otp,
      createdAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 5,
      ...metadata
    };

    await redisClient.setEx(key, expiry, JSON.stringify(otpData));
  }

  /**
   * Retrieve OTP data from Redis
   * @param {string} email - User email
   * @returns {Promise<object|null>} OTP data or null if not found
   */
  async getOTPData(email) {
    const key = `otp:${email}`;
    const data = await redisClient.get(key);
    
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing OTP data:', error);
      return null;
    }
  }

  /**
   * Verify OTP with constant-time comparison
   * @param {string} email - User email
   * @param {string} providedOTP - OTP provided by user
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async verifyOTP(email, providedOTP) {
    const otpData = await this.getOTPData(email);
    
    if (!otpData) {
      return {
        success: false,
        message: 'OTP not found or expired'
      };
    }

    // Check attempt limit
    if (otpData.attempts >= otpData.maxAttempts) {
      await this.deleteOTP(email);
      return {
        success: false,
        message: 'Maximum attempts reached. Please request a new OTP.'
      };
    }

    // Increment attempt count
    otpData.attempts++;
    await this.updateOTPData(email, otpData);

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(otpData.code),
      Buffer.from(providedOTP)
    );

    if (!isValid) {
      return {
        success: false,
        message: `Invalid OTP. ${otpData.maxAttempts - otpData.attempts} attempts remaining.`
      };
    }

    // OTP is valid, delete it
    await this.deleteOTP(email);
    
    return {
      success: true,
      message: 'OTP verified successfully'
    };
  }

  /**
   * Update OTP data in Redis
   * @param {string} email - User email
   * @param {object} otpData - Updated OTP data
   * @returns {Promise<void>}
   */
  async updateOTPData(email, otpData) {
    const key = `otp:${email}`;
    const expiry = parseInt(process.env.VERIFICATION_OTP_EXPIRY) || 900;
    await redisClient.setEx(key, expiry, JSON.stringify(otpData));
  }

  /**
   * Delete OTP from Redis
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async deleteOTP(email) {
    const key = `otp:${email}`;
    await redisClient.del(key);
  }

  /**
   * Check if OTP exists and is valid
   * @param {string} email - User email
   * @returns {Promise<boolean>}
   */
  async hasValidOTP(email) {
    const otpData = await this.getOTPData(email);
    return otpData !== null && otpData.attempts < otpData.maxAttempts;
  }

  /**
   * Log verification attempt for security monitoring
   * @param {string} email - User email
   * @param {object} attemptData - Attempt details
   * @returns {Promise<void>}
   */
  async logVerificationAttempt(email, attemptData) {
    const key = `verification_attempts:${email}`;
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...attemptData
    };

    // Store log with 24-hour expiry
    await redisClient.lPush(key, JSON.stringify(logEntry));
    await redisClient.expire(key, 86400); // 24 hours
  }

  /**
   * Check rate limiting for OTP requests
   * @param {string} email - User email
   * @param {string} type - 'send' or 'verify'
   * @returns {Promise<{allowed: boolean, remaining: number, resetTime: number}>}
   */
  async checkRateLimit(email, type = 'send') {
    const key = `rate_limit:${type}:${email}`;
    const now = Date.now();
    const window = type === 'send' ? 3600000 : 900000; // 1 hour for send, 15 min for verify
    const maxRequests = type === 'send' ? 3 : 5;

    try {
      // Clean old entries
      await redisClient.zRemRangeByScore(key, 0, now - window);

      // Get current count
      const count = await redisClient.zCard(key);

      if (count >= maxRequests) {
        // Get oldest request time for reset time
        const oldest = await redisClient.zRange(key, 0, 0);
        const resetTime = oldest.length > 0 ? JSON.parse(oldest[0]).timestamp + window : now + window;
        
        return {
          allowed: false,
          remaining: 0,
          resetTime
        };
      }

      // Add current request - fix the zAdd command
      await redisClient.zAdd(key, [{ score: now, value: JSON.stringify({ timestamp: now }) }]);
      await redisClient.expire(key, Math.ceil(window / 1000)); // Convert to seconds

      return {
        allowed: true,
        remaining: maxRequests - count - 1,
        resetTime: now + window
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // If Redis fails, allow the request but log the error
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + window
      };
    }
  }

  /**
   * Cleanup expired OTPs (should be run periodically)
   * @returns {Promise<number>} Number of cleaned up OTPs
   */
  async cleanupExpiredOTPs() {
    const pattern = 'otp:*';
    const keys = await redisClient.keys(pattern);
    let cleaned = 0;

    for (const key of keys) {
      const ttl = await redisClient.ttl(key);
      if (ttl === -1) { // No expiry set, clean it up
        await redisClient.del(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

module.exports = new OTPService();