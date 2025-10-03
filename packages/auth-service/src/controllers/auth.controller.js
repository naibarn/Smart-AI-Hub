// src/controllers/auth.controller.js
const User = require('../models/User');
const Credit = require('../models/Credit');
const { generateToken, generateRefreshToken } = require('../utils/jwt');

const authController = {
  /**
   * Register - ลงทะเบียนผู้ใช้ใหม่
   */
  async register(req, res, next) {
    try {
      const { email, password } = req.body;

      // ตรวจสอบว่า email ซ้ำหรือไม่
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { message: 'Email already exists' }
        });
      }

      // สร้าง user ใหม่
      const user = await User.create({ email, password, role_name: 'user' });

      // สร้าง credit account สำหรับ user ใหม่
      await Credit.createAccount(user.id);

      // สร้าง token
      const token = generateToken({ userId: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ userId: user.id });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role_id: user.role_id
          },
          token,
          refreshToken
        },
        message: 'Registration successful'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Login - เข้าสู่ระบบ
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // หา user จาก email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid email or password' }
        });
      }

      // ตรวจสอบ password
      const isPasswordValid = await User.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid email or password' }
        });
      }

      // ตรวจสอบว่า account active หรือไม่
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: { message: 'Account is inactive' }
        });
      }

      // สร้าง token
      const token = generateToken({ 
        userId: user.id, 
        email: user.email,
        role: user.role_name 
      });
      const refreshToken = generateRefreshToken({ userId: user.id });

      // ลบ password ออกจาก response
      delete user.password;

      res.json({
        success: true,
        data: {
          user,
          token,
          refreshToken
        },
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Current User - ดึงข้อมูล user ที่ login อยู่
   */
  async getCurrentUser(req, res, next) {
    try {
      const userWithDetails = await User.findByIdWithDetails(req.user.id);

      res.json({
        success: true,
        data: { user: userWithDetails }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout - ออกจากระบบ (ฝั่ง client จะต้องลบ token)
   */
  async logout(req, res) {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
};

module.exports = authController;