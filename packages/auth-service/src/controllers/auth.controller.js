// src/controllers/auth.controller.js
const User = require('../models/User');
const Credit = require('../models/Credit');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { storeRefreshToken, getRefreshToken, removeRefreshToken, addToBlacklist, logFailedLogin } = require('../config/redis');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');

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

      // Generate and send verification email
      const otp = otpService.generateOTP();
      const metadata = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: user.id,
        isRegistration: true
      };

      await otpService.storeOTP(email, otp, metadata);

      // Send verification email asynchronously (don't wait for it)
      emailService.sendVerificationEmail(email, otp).catch(error => {
        console.error('Failed to send verification email during registration:', error);
      });

      // สร้าง token
      const token = generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ userId: user.id });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role_id: user.role_id,
            email_verified: user.emailVerified
          },
          token,
          refreshToken
        },
        message: 'Registration successful. Please check your email for verification code.'
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
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // หา user จาก email
      const user = await User.findByEmail(email);
      if (!user) {
        // Log failed login attempt
        await logFailedLogin(email, ip, userAgent);
        
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid email or password' }
        });
      }

      // ตรวจสอบ password
      const isPasswordValid = await User.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        // Log failed login attempt
        await logFailedLogin(email, ip, userAgent);
        
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid email or password' }
        });
      }

      // ตรวจสอบว่า account active หรือไม่
      if (!user.email_verified) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Account is not verified. Please check your email for verification code.',
            code: 'EMAIL_NOT_VERIFIED',
            email: user.email
          }
        });
      }

      // สร้าง access token (15 min) และ refresh token (7 days)
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role_name
      });
      const refreshToken = generateRefreshToken({ userId: user.id });

      // Store refresh token in Redis
      await storeRefreshToken(user.id, refreshToken, 604800); // 7 days in seconds

      // ลบ password ออกจาก response
      delete user.password_hash;

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role_id: user.role_id,
            role_name: user.role_name
          },
          accessToken,
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
   * Refresh Token - สร้าง access token ใหม่จาก refresh token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      // 1. Verify refresh token
      let decoded;
      try {
        decoded = verifyToken(refreshToken);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid or expired refresh token' }
        });
      }

      // 2. ตรวจสอบว่า token match กับที่เก็บใน Redis
      const storedRefreshToken = await getRefreshToken(decoded.userId);
      if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          error: { message: 'Refresh token does not match stored token' }
        });
      }

      // 3. Get user information
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { message: 'User not found' }
        });
      }

      // 4. Generate access token ใหม่
      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role_name
      });

      // 5. Rotate refresh token - generate ใหม่และ update Redis
      const newRefreshToken = generateRefreshToken({ userId: user.id });
      await storeRefreshToken(user.id, newRefreshToken, 604800); // 7 days in seconds

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        },
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout - ออกจากระบบพร้อม blacklist token
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user.id;
      const token = req.token;

      // 1. เพิ่ม access token ไปยัง blacklist ใน Redis
      if (token && token.jti) {
        // คำนวณ TTL จากเวลาที่เหลือจนกว่า token จะหมดอายุ
        const currentTime = Math.floor(Date.now() / 1000);
        const ttl = token.exp - currentTime;
        
        if (ttl > 0) {
          await addToBlacklist(token.jti, ttl);
        }
      }

      // 2. ลบ refresh token จาก Redis (key: refresh_token:{userId})
      await removeRefreshToken(userId);

      // 3. ตรวจสอบและ blacklist refresh token ที่ส่งมา (ถ้ามี)
      if (refreshToken) {
        try {
          const decodedRefresh = verifyToken(refreshToken);
          if (decodedRefresh.jti) {
            // คำนวณ TTL สำหรับ refresh token
            const currentTime = Math.floor(Date.now() / 1000);
            const refreshTtl = decodedRefresh.exp - currentTime;
            
            if (refreshTtl > 0) {
              await addToBlacklist(decodedRefresh.jti, refreshTtl);
            }
          }
        } catch (error) {
          // Ignore error if refresh token is invalid/expired
          console.log('Refresh token verification failed during logout:', error.message);
        }
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;