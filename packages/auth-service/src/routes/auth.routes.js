// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

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
router.post('/logout', authenticate, authController.logout);

module.exports = router;