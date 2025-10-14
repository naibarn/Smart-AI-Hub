const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

// Rate limiting for OAuth endpoints
const oauthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '60s'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Store state parameters in Redis for CSRF protection
const { redisClient } = require('../config/redis');

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get('/google', oauthLimiter, async (req, res, next) => {
  try {
    // Get session and return_to parameters from query
    const { session, return_to } = req.query;
    
    // Generate state parameter for CSRF protection
    const state = uuidv4();
    
    // Store state in Redis with 10-minute expiration
    await redisClient.setEx(`oauth_state:${state}`, 600, JSON.stringify({
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      session: session || null,
      return_to: return_to || 'chatgpt' // Default to chatgpt if not provided
    }));
    
    // Log OAuth initiation
    console.log(`Google OAuth initiated from IP: ${req.ip}, State: ${state}, Session: ${session}, Return To: ${return_to}`);
    
    // Redirect to Google with state parameter
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: state
    })(req, res, next);
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate authentication'
    });
  }
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', oauthLimiter, async (req, res, next) => {
  try {
    const { state, code } = req.query;
    
    // Verify state parameter for CSRF protection
    if (!state) {
      console.error('OAuth callback missing state parameter');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?error=missing_state`);
    }
    
    // Check if state exists in Redis
    try {
      const stateData = await redisClient.get(`oauth_state:${state}`);
      
      if (!stateData) {
        console.error('Invalid or expired OAuth state:', state);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?error=invalid_state`);
      }
      
      const parsedStateData = JSON.parse(stateData);
      
      // Verify IP and User-Agent match (optional security check)
      if (parsedStateData.ip !== req.ip) {
        console.error(`IP mismatch in OAuth callback. Expected: ${parsedStateData.ip}, Actual: ${req.ip}`);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?error=ip_mismatch`);
      }
      
      // Delete the state from Redis
      await redisClient.del(`oauth_state:${state}`);
      
      // Continue with passport authentication
      passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?error=authentication_failed`,
        session: false // We're using JWT, not sessions
      })(req, res, next);
    } catch (error) {
      console.error('Error verifying OAuth state:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?error=state_verification_failed`);
    }
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?error=callback_error`);
  }
}, (req, res) => {
  // This is the success callback after authentication
  try {
    const { user } = req;
    const { tokens, stateData } = user;
    
    // Check if this is a session-based OAuth flow
    if (stateData && stateData.session) {
      // Generate verification code
      const { generateVerificationCode } = require('../config/redis');
      const verificationCode = generateVerificationCode();
      
      // Store verification code in Redis with 10-minute expiration
      redisClient.setEx(`verification_code:${verificationCode}`, 600, JSON.stringify({
        userId: user.id,
        email: user.email,
        sessionId: stateData.session,
        timestamp: new Date().toISOString()
      }));

      // Log successful OAuth with verification code
      console.log(`Google OAuth successful for user ${user.email} with verification code: ${verificationCode}`);

      // Redirect to success page with verification code
      const redirectUrl = `/oauth-success.html?verification_code=${verificationCode}&return_to=${stateData.return_to}`;
      
      res.redirect(redirectUrl);
    } else {
      // Traditional OAuth flow - redirect with tokens
      console.log(`Google OAuth successful for user: ${user.email}`);
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
      
      res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('Error in OAuth success callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?error=success_callback_failed`);
  }
});

/**
 * @route   GET /api/auth/oauth/status
 * @desc    Check OAuth status
 * @access  Public
 */
router.get('/oauth/status', (req, res) => {
  res.json({
    success: true,
    google: {
      enabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
    }
  });
});

module.exports = router;