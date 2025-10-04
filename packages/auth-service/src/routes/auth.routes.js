// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verificationController = require('../controllers/verification.controller');
const passwordController = require('../controllers/password.controller');
const { authenticate } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateLogout,
  validateSendVerification,
  validateVerifyEmail,
  validateResendVerification,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyResetToken
} = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    ลงทะเบียนผู้ใช้ใหม่
 * @access  Public
 */
router.post('/register', validateRegister, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    เข้าสู่ระบบ
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    ดึงข้อมูล user ที่ login อยู่
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    ออกจากระบบ
 * @access  Private
 */
router.post('/logout', authenticate, validateLogout, authController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validateRefreshToken, authController.refreshToken);

/**
 * @route   POST /api/auth/send-verification
 * @desc    Send verification email with OTP
 * @access  Public
 */
router.post('/send-verification', validateSendVerification, verificationController.sendVerification);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with OTP
 * @access  Public
 */
router.post('/verify-email', validateVerifyEmail, verificationController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', validateResendVerification, verificationController.resendVerification);

/**
 * @route   GET /api/auth/verification-status
 * @desc    Check verification status
 * @access  Public
 */
router.get('/verification-status', verificationController.getVerificationStatus);

/**
 * @route   POST /api/auth/test-email
 * @desc    Test email configuration (development only)
 * @access  Public
 */
router.post('/test-email', verificationController.testEmailConfiguration);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset link
 * @access  Public
 */
router.post('/forgot-password', validateForgotPassword, passwordController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', validateResetPassword, passwordController.resetPassword);

/**
 * @route   GET /api/auth/verify-reset-token
 * @desc    Verify reset token validity
 * @access  Public
 */
router.get('/verify-reset-token', validateVerifyResetToken, passwordController.verifyResetToken);

module.exports = router;