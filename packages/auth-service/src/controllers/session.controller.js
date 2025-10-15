// src/controllers/session.controller.js
const { getSession } = require('../config/redis');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

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
        return errorResponse(res, 401, 'MISSING_SESSION_TOKEN', 'X-Session-Token header is required', null, req.requestId);
      }

      // Validate session token format
      if (!sessionToken.startsWith('VERIFIED-')) {
        return errorResponse(res, 401, 'INVALID_SESSION_TOKEN', 'Invalid session token format', null, req.requestId);
      }

      // Get session data from Redis
      const sessionData = await getSession(sessionToken);
      
      if (!sessionData) {
        return errorResponse(res, 401, 'SESSION_NOT_FOUND', 'Session not found or expired', null, req.requestId);
      }

      // Get user information from database
      const user = await User.findById(sessionData.userId);
      
      if (!user) {
        return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found', null, req.requestId);
      }

      // Return user information
      return successResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0], // Use name if available, otherwise use email prefix
          verified: user.email_verified || false
        }
      }, res, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = sessionController;