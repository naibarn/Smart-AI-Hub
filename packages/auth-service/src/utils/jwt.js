// src/utils/jwt.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

/**
 * Generate a random string for JWT ID
 */
const generateJTI = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * สร้าง Access Token (อายุ 15 นาที)
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    jwtid: generateJTI() // Add unique JWT ID
  });
};

/**
 * สร้าง Refresh Token (อายุ 7 วัน)
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    jwtid: generateJTI() // Add unique JWT ID
  });
};

/**
 * สร้าง JWT Token (เก็บไว้เพื่อความเข้ากันได้กับโค้ดเก่า)
 */
const generateToken = (payload) => {
  return generateAccessToken(payload);
};

/**
 * สร้างทั้ง Access Token และ Refresh Token พร้อมกัน
 */
const generateTokens = (userId) => {
  const accessToken = generateAccessToken({ userId });
  const refreshToken = generateRefreshToken({ userId });
  
  return {
    accessToken,
    refreshToken
  };
};

/**
 * ตรวจสอบและ decode JWT Token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN
};