// src/routes/session.routes.js
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');

/**
 * @route   GET /api/auth/verify-session
 * @desc    Verify session token and return user information
 * @access  Public (requires X-Session-Token header)
 */
router.get('/verify-session', sessionController.verifySession);

module.exports = router;