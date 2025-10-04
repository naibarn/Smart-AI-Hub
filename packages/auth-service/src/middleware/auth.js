// src/middleware/auth.js
const { verifyToken } = require('../utils/jwt');
const { isTokenBlacklisted } = require('../config/redis');
const User = require('../models/User');

/**
 * ตรวจสอบ JWT Token
 */
const authenticate = async (req, res, next) => {
  try {
    // ดึง token จาก header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided' }
      });
    }

    const token = authHeader.substring(7); // ตัด "Bearer " ออก

    // ตรวจสอบ token
    const decoded = verifyToken(token);

    // ตรวจสอบว่า token ถูก blacklist หรือไม่
    const isBlacklisted = await isTokenBlacklisted(decoded.jti);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: { message: 'Token has been revoked' }
      });
    }

    // ดึงข้อมูล user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: { message: 'Account is inactive' }
      });
    }

    // เก็บข้อมูล user และ token ใน request
    req.user = user;
    req.token = {
      jti: decoded.jti,
      exp: decoded.exp
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * ตรวจสอบสิทธิ์ตาม Role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

    const hasRole = allowedRoles.includes(req.user.role_name);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      });
    }

    next();
  };
};

/**
 * ตรวจสอบ Permission เฉพาะ
 */
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({
        success: false,
        error: { message: 'No permissions found' }
      });
    }

    const permissions = req.user.permissions;
    
    // ตรวจสอบว่ามี permission หรือไม่
    const hasPermission = 
      permissions[resource] && 
      permissions[resource].includes(action);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: { 
          message: `Permission denied: ${resource}.${action}` 
        }
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  checkPermission
};