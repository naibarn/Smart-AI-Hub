// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validation');

/**
 * @route   GET /api/users/profile
 * @desc    ดึงข้อมูล profile ของตัวเอง
 * @access  Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route   GET /api/users/profile/:id
 * @desc    ดึงข้อมูล profile ของ user คนอื่น
 * @access  Private (Admin/Manager)
 */
router.get('/profile/:id', authenticate, authorize('admin', 'manager'), userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    แก้ไขข้อมูล profile ของตัวเอง
 * @access  Private
 */
router.put('/profile', authenticate, validateProfileUpdate, userController.updateProfile);

/**
 * @route   GET /api/users
 * @desc    แสดงรายการ users ทั้งหมด
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize('admin', 'super_admin'), userController.listUsers);

module.exports = router;