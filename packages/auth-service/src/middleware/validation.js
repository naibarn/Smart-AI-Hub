// src/middleware/validation.js

/**
 * Validate Registration Data
 */
const validateRegister = (req, res, next) => {
  const { email, password, username } = req.body;
  const errors = [];

  // ตรวจสอบ email
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  // ตรวจสอบ password
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  // ตรวจสอบ username (optional for now)
  if (username && username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', errors }
    });
  }

  next();
};

/**
 * Validate Login Data
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', errors }
    });
  }

  next();
};

/**
 * Validate Credit Purchase
 */
const validateCreditPurchase = (req, res, next) => {
  const { amount } = req.body;
  const errors = [];

  if (!amount) {
    errors.push('Amount is required');
  } else if (typeof amount !== 'number' || amount <= 0) {
    errors.push('Amount must be a positive number');
  } else if (amount < 10) {
    errors.push('Minimum purchase is 10 credits');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', errors }
    });
  }

  next();
};

/**
 * Validate Credit Usage
 */
const validateCreditUsage = (req, res, next) => {
  const { amount, description } = req.body;
  const errors = [];

  if (!amount) {
    errors.push('Amount is required');
  } else if (typeof amount !== 'number' || amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (!description) {
    errors.push('Description is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', errors }
    });
  }

  next();
};

/**
 * Validate Profile Update
 */
const validateProfileUpdate = (req, res, next) => {
  const { full_name, phone_number, date_of_birth } = req.body;
  const errors = [];

  if (phone_number && !/^[0-9]{10}$/.test(phone_number)) {
    errors.push('Phone number must be 10 digits');
  }

  if (date_of_birth) {
    const date = new Date(date_of_birth);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', errors }
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCreditPurchase,
  validateCreditUsage,
  validateProfileUpdate
};