// src/controllers/session.controller.js
const { getSession } = require('../config/redis');
const User = require('../models/User');

const sessionController = {
  /**
   * Verify Session - Verify session token and return user information
   * Required for Sora2 Video Generator integration
   */
  async verifySession(req, res, next) {
    try {
      // Get session token from header
      const sessionToken = req.headers['x-session-token'];
      
      if (!sessionToken) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_SESSION_TOKEN',
            message: 'X-Session-Token header is required'
          }
        });
      }

      // Validate session token format
      if (!sessionToken.startsWith('VERIFIED-')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_SESSION_TOKEN',
            message: 'Invalid session token format'
          }
        });
      }

      // Get session data from Redis
      const sessionData = await getSession(sessionToken);
      
      if (!sessionData) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found or expired'
          }
        });
      }

      // Get user information from database
      const user = await User.findById(sessionData.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Return user information
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0], // Use name if available, otherwise use email prefix
            verified: user.email_verified || false
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = sessionController;