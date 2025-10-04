// packages/shared/src/utils/validators.ts

/**
 * Password strength validator
 * @param password - Password to validate
 * @returns {isValid: boolean, errors: string[]} Validation result
 */
export const validatePasswordStrength = (
  password: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Common weak passwords check
  const commonPasswords = [
    'password',
    '12345678',
    'qwerty123',
    'admin123',
    'password123',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Email validator
 * @param email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Username validator
 * @param username - Username to validate
 * @returns {isValid: boolean, errors: string[]} Validation result
 */
export const validateUsername = (username: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  if (username.length > 30) {
    errors.push('Username must be less than 30 characters');
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, dots, hyphens, and underscores');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Phone number validator (Thai format)
 * @param phoneNumber - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
export const isValidThaiPhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^0[0-9]{9}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * URL validator
 * @param url - URL to validate
 * @returns {boolean} True if valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * UUID validator
 * @param uuid - UUID to validate
 * @returns {boolean} True if valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Token validator (for reset tokens, etc.)
 * @param token - Token to validate
 * @returns {boolean} True if valid token format
 */
export const isValidToken = (token: string): boolean => {
  // Base64URL encoded tokens should be alphanumeric with optional - and _
  const tokenRegex = /^[A-Za-z0-9_-]+$/;
  return tokenRegex.test(token) && token.length >= 20;
};
