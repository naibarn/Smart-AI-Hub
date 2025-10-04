// src/middleware/validation.js
const { z } = require('zod');

// Zod schemas for validation
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional()
});

const creditPurchaseSchema = z.object({
  amount: z.number().positive('Amount must be positive').min(10, 'Minimum purchase is 10 credits')
});

const creditUsageSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required')
});

const profileUpdateSchema = z.object({
  full_name: z.string().optional(),
  phone_number: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits').optional(),
  date_of_birth: z.string().datetime('Invalid date format').optional()
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const sendVerificationSchema = z.object({
  email: z.string().email('Invalid email format')
});

const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit number')
});

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email format')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')
});

const verifyResetTokenSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

/**
 * Validate Registration Data
 */
const validateRegister = (req, res, next) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Login Data
 */
const validateLogin = (req, res, next) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Credit Purchase
 */
const validateCreditPurchase = (req, res, next) => {
  try {
    creditPurchaseSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Credit Usage
 */
const validateCreditUsage = (req, res, next) => {
  try {
    creditUsageSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Profile Update
 */
const validateProfileUpdate = (req, res, next) => {
  try {
    profileUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Refresh Token Request
 */
const validateRefreshToken = (req, res, next) => {
  try {
    refreshTokenSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Logout Request
 */
const validateLogout = (req, res, next) => {
  try {
    logoutSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Send Verification Request
 */
const validateSendVerification = (req, res, next) => {
  try {
    sendVerificationSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Verify Email Request
 */
const validateVerifyEmail = (req, res, next) => {
  try {
    verifyEmailSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Resend Verification Request
 */
const validateResendVerification = (req, res, next) => {
  try {
    resendVerificationSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Forgot Password Request
 */
const validateForgotPassword = (req, res, next) => {
  try {
    forgotPasswordSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Reset Password Request
 */
const validateResetPassword = (req, res, next) => {
  try {
    resetPasswordSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

/**
 * Validate Verify Reset Token Request
 */
const validateVerifyResetToken = (req, res, next) => {
  try {
    verifyResetTokenSchema.parse(req.query);
    next();
  } catch (error) {
    // Check if it's a missing token error
    if (!req.query.token) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Reset token is required',
          code: 'TOKEN_REQUIRED'
        }
      });
    }
    
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.errors.map(err => err.message)
      }
    });
  }
};

module.exports = {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateLogout,
  validateCreditPurchase,
  validateCreditUsage,
  validateProfileUpdate,
  validateSendVerification,
  validateVerifyEmail,
  validateResendVerification,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyResetToken
};